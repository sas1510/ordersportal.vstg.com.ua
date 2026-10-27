"""API-key-only entry point for orders submitted by the measurement application."""
import uuid
import logging
from .measurement_notifications import record_measurement_notification
from .measurement_alerts import report_measurement_failure
from utils.portal_error_alerts import enqueue_alert
logger = logging.getLogger(__name__)
from rest_framework.exceptions import APIException

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .measurement_auth import MeasurementApiKeyAuthentication
from backend.utils.BinToGuid1C import bin_to_guid_1c
from .measurement_serializers import MeasurementOrderSerializer
from .views import CreateCalculationViewSet, extract_calculation_guid


class MeasurementOneCNotConfigured(APIException):
    status_code = 503
    default_detail = 'Перевірте ONE_C_USER та ONE_C_PASSWORD для робочої 1С.'
    default_code = 'measurement_1c_not_configured'


class MeasurementOrderViewSet(CreateCalculationViewSet):
    authentication_classes = [MeasurementApiKeyAuthentication]
    permission_classes = [IsAuthenticated]
    create_serializer_class = MeasurementOrderSerializer

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        try:
            report_measurement_failure(request, response)
        except Exception:
            logger.warning('Measurement failure alert could not be queued')
        return response

    def get_one_c_credentials(self):
        user, password = super().get_one_c_credentials()
        if not user or not password:
            raise MeasurementOneCNotConfigured()
        return user, password

    def get_one_c_url(self):
        return super().get_one_c_url()

    def get_idempotency_key(self, request):
        raw = request.headers.get('Idempotency-Key', '')
        try:
            key = uuid.UUID(raw)
        except (ValueError, TypeError, AttributeError):
            raise serializers.ValidationError({'Idempotency-Key': 'Потрібен UUID. Повторний запит надсилайте з тим самим UUID.'})
        # Keep independent callers from sharing cached responses with each other.
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f'measurement-order:{self.get_one_c_url()}:{request.user.pk}:{key}'))

    def _send_to_1c(self, payload):
        for calculation in payload.get('calculations', []):
            calculation.setdefault('orders', [])
            calculation.setdefault('address', {
                'addressGUID': None,
                'addressName': '',
                'addressCoordinates': {'lat': None, 'lng': None},
                'addressAdditionalInfo': '',
            })
        return super()._send_to_1c(payload)

    @extend_schema(
        summary='Створення заявки із замірника (PDF)',
        description='X-API-KEY інтеграції з MEASUREMENT_API_KEY та Idempotency-Key (UUID) обов’язкові. user_id — внутрішній ID дилера з portal_db.dbo.User. PDF до 20 МіБ; до 10 фото по 10 МіБ. Створює прорахунок у 1С.',
        request=MeasurementOrderSerializer,
        responses={201: dict, 400: dict, 401: dict, 403: dict, 409: dict, 502: dict},
        tags=['measurement'],
    )
    def create(self, request):
        # Validate the replay key before touching 1C or idempotency storage.
        self.get_idempotency_key(request)
        self.get_one_c_credentials()
        response = super().create(request)
        if response.status_code in (200, 201) and response.data.get('success'):
            calculation_guid = response.data.get('calculation_guid') or extract_calculation_guid(response.data.get('result_1c') or {})
            if calculation_guid:
                try:
                    record_measurement_notification(request, calculation_guid, self.get_idempotency_key(request))
                except Exception as exc:
                    # Creation in 1C succeeded: Telegram must not turn it into a failed order.
                    logger.error('Measurement Telegram outbox failed: calculation=%s error_type=%s', calculation_guid, type(exc).__name__)
            else:
                enqueue_alert('🚨 Заявка із замірника: 1С повернула успіх без GUID документа.\nКористувач ID: ' + str(request.user.pk))

            return Response({
                'success': True,
                'calculation_guid': response.data.get('calculation_guid') or extract_calculation_guid(response.data.get('result_1c') or {}),
                'portal_user_id': request.user.pk,
                'contractor_guid': bin_to_guid_1c(request.user.user_id_1C),
            }, status=response.status_code)
        # Don't expose files/Base64 from a failed upstream request.
        if isinstance(response.data, dict):
            response.data.pop('payload_sent_to_1c', None)
        return response
