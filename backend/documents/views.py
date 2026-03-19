from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from .models import UploadFile
from .serializers import UploadFileSerializer
import base64, os
from rest_framework.permissions import BasePermission, SAFE_METHODS

class AllowViewOnlyForAllUpdateCreateAdminManager(BasePermission):
    """
    Перегляд доступний всім, додавання та редагування лише admin/manager.
    Видалення дозволене всім (якщо потрібно можна обмежити теж).
    """
    def has_permission(self, request, view):
        # GET, HEAD, OPTIONS — дозволені всім
        if request.method in SAFE_METHODS:
            return True
        # POST (створення), PUT/PATCH (редагування) — лише admin/manager
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return request.user.is_authenticated and request.user.groups.filter(name__in=['admin', 'manager']).exists()
        # DELETE — можна дозволити всім або обмежити
        return False

# --- ViewSet ---
class UploadFileViewSet(viewsets.ModelViewSet):
    queryset = UploadFile.objects.all().order_by('-create_date')
    serializer_class = UploadFileSerializer
    permission_classes = [AllowViewOnlyForAllUpdateCreateAdminManager]

    def perform_create(self, serializer):
        file_name = self.request.data.get('file_name', '')
        file_base64 = self.request.data.get('file_base64', '')
        file_extension = self.request.data.get('file_extension', '')

        serializer.save(
            author=self.request.user,
            file_name=file_name,
            file_base64=file_base64,
            file_extension=file_extension
        )

    def perform_update(self, serializer):
        file_name = self.request.data.get('file_name', None)
        file_base64 = self.request.data.get('file_base64', None)
        file_extension = self.request.data.get('file_extension', None)

        update_fields = {}
        if file_name is not None:
            update_fields['file_name'] = file_name
        if file_base64 is not None:
            update_fields['file_base64'] = file_base64
        if file_extension is not None:
            update_fields['file_extension'] = file_extension

        serializer.save(author=self.request.user, **update_fields)

    def perform_destroy(self, instance):
        instance.delete()

    def handle_exception(self, exc):
        response = super().handle_exception(exc)
        if response.status_code == 403:
            response.data = {
                "detail": "Доступ заборонено. Тільки адміністратори та менеджери можуть виконувати цю дію."
            }
        return response
