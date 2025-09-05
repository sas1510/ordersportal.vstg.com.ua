from rest_framework import viewsets
from .models import Document
from .serializers import DocumentSerializer
from backend.permissions import IsAdminOrReadOnly

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        serializer.save(author=self.request.user)


    def perform_destroy(self, instance):
        instance.delete()
