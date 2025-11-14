from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Video
from .serializers import VideoContentSerializer
from .permissions import IsAdminOrReadOnly


class VideoContentViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoContentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        # При створенні автоматично зберігаємо користувача
        serializer.save(added_by=self.request.user)
