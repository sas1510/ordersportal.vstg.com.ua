# views.py
from rest_framework import viewsets
from .models import UploadFile
from .serializers import UploadFileSerializer
from backend.permissions import IsAdminOrReadOnly

class UploadFileViewSet(viewsets.ModelViewSet):
    queryset = UploadFile.objects.all().order_by('-create_date')
    serializer_class = UploadFileSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        instance.delete()
