# serializers.py
from rest_framework import serializers
from .models import UploadFile

class UploadFileSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    file_path = serializers.CharField(required=True)  # тут можна замінити на FileField, якщо буде завантаження файлу

    class Meta:
        model = UploadFile
        fields = '__all__'
        read_only_fields = ['author', 'create_date']

    def get_author(self, obj):
        return {
            "id": obj.author.id if obj.author else None,
            "first_last_name": obj.author.first_last_name if obj.author else "Невідомо"
        }
