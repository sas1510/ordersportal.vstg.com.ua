from rest_framework import viewsets
from .models import Video
from .serializers import VideoContentSerializer
from backend.permissions import IsAdminOrReadOnly

class VideoContentViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoContentSerializer
    permission_classes = [IsAdminOrReadOnly]
