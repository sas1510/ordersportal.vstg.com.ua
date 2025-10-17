from rest_framework import serializers
from .models import UploadFile

class UploadFileSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = UploadFile
        fields = '__all__'
        read_only_fields = ['author', 'create_date', 'file_extension']

    def get_author(self, obj):
        return {
            "id": obj.author.id if obj.author else None,
            "full_name": obj.author.full_name if obj.author else "Невідомо"
        }
