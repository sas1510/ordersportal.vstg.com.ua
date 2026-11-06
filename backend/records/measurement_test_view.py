"""Admin-only harness for the same measurement submission pipeline."""
from types import SimpleNamespace
from pathlib import PurePath
from urllib.parse import urlsplit
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from users.internal_dealer import PortalJWTAuthentication as JWTAuthentication

from .measurement_auth import MeasurementApiKeyAuthentication
from .measurement_orders import MeasurementOrderViewSet
from .measurement_serializers import decode_attachment
from .serializers import CalculationCreateSerializer
from .views import CreateCalculationViewSet, build_1c_payload, extract_calculation_guid
from utils.contractor import resolve_contractor


class MeasurementTestAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class MeasurementTestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [MeasurementTestAdminPermission]

    def get(self, request):
        return Response({
            'configured': bool(getattr(settings, 'MEASUREMENT_API_KEY', '')),
            'one_c_url': MeasurementOrderViewSet().get_one_c_url(),
        })

    def post(self, request):
        # The secret stays in this process. Authenticate and validate the selected
        # dealer using the exact same logic as the external integration endpoint.
        submission = SimpleNamespace(data=request.data, headers={
            'X-API-KEY': getattr(settings, 'MEASUREMENT_API_KEY', ''),
            'Idempotency-Key': request.headers.get('Idempotency-Key', ''),
        })
        submission.user, submission.auth = MeasurementApiKeyAuthentication().authenticate(submission)
        return MeasurementOrderViewSet().create(submission)


class AudioTestCalculationSerializer(CalculationCreateSerializer):
    def validate_file(self, value):
        extension = PurePath(value["fileName"]).suffix.lower()
        if extension not in {".mp3", ".m4a", ".wav", ".ogg", ".webm"}:
            raise ValidationError("Оберіть MP3, M4A, WAV, OGG або WebM.")
        decode_attachment(value["fileDataB64"], 10 * 1024 * 1024)
        return value


class AudioCalculationTestView(MeasurementTestView):
    def configured(self, request):
        return urlsplit("//" + request.get_host()).hostname in {"localhost", "127.0.0.1", "::1"}

    def get(self, request):
        return Response({"configured": self.configured(request)})

    def post(self, request):
        if not self.configured(request):
            return Response({"detail": "Тест аудіо доступний лише локально."}, status=403)
        serializer = AudioTestCalculationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            _, contractor = resolve_contractor(request, admin_param="contractor_guid")
        except (ValueError, PermissionError) as exc:
            return Response({"detail": str(exc)}, status=403)
        file = data["file"]
        payload = build_1c_payload(
            order_number=data.get("order_number") or "TEST-AUDIO",
            items_count=data["items_count"], comment="TEST AUDIO",
            contractor_guid=contractor, delivery_is_pickup=True,
            file_name=file["fileName"], file_b64=file["fileDataB64"],
        )
        result = CreateCalculationViewSet()._send_to_1c(payload)
        guid = extract_calculation_guid(result)
        if not guid or result.get("success") is False:
            return Response({"detail": "1С не підтвердила створення заявки.", "result_1c": result}, status=502)
        return Response({"success": True, "calculation_guid": str(guid), "file_name": file["fileName"]}, status=201)
