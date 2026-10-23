"""Admin-only harness for the same measurement submission pipeline."""
from types import SimpleNamespace
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .measurement_auth import MeasurementApiKeyAuthentication
from .measurement_orders import MeasurementOrderViewSet


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
