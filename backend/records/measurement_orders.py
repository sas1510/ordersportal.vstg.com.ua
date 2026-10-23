"""API-key-only entry point for orders submitted by the measurement application."""
import uuid
from django.conf import settings
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
    default_detail = 'Заповніть MEASUREMENT_ONE_C_USER та MEASUREMENT_ONE_C_PASSWORD для тестової 1С.'
    default_code = 'measurement_1c_not_configured'


class MeasurementOrderViewSet(CreateCalculationViewSet):
    authentication_classes = [MeasurementApiKeyAuthentication]
    permission_classes = [IsAuthenticated]
    create_serializer_class = MeasurementOrderSerializer

    def get_one_c_credentials(self):
        user = getattr(settings, 'MEASUREMENT_ONE_C_USER', '')
        password = getattr(settings, 'MEASUREMENT_ONE_C_PASSWORD', '')
        if not user or not password:
            raise MeasurementOneCNotConfigured()
        return user, password

    def get_one_c_url(self):
        # Temporary fixed destination for the measurement integration test stage.
        return 'http://192.168.50.50/oknastyle_vmm/hs/gp-obmen/'

    def get_idempotency_key(self, request):
        raw = request.headers.get('Idempotency-Key', '')
        try:
            key = uuid.UUID(raw)
        except (ValueError, TypeError, AttributeError):
            raise serializers.ValidationError({'Idempotency-Key': 'Потрібен UUID. Повторний запит надсилайте з тим самим UUID.'})
        # Keep independent callers from sharing cached responses with each other.
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f'measurement-order:{request.user.pk}:{key}'))

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
