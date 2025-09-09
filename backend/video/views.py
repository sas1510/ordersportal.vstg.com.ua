from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Video
from .serializers import VideoSerializer
from backend.permissions import IsAdminOrReadOnly

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoSerializer
    permission_classes = [IsAdminOrReadOnly]
