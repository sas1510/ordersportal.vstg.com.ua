from rest_framework import serializers
from .models import Video

class VideoContentSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source="added_by.username", read_only=True)

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'url', 'description',
            'created_at', 'added_by', 'added_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'added_by', 'added_by_name']
