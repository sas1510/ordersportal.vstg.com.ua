# media/serializers.py

from rest_framework import serializers
from .models import MediaResource, MediaCategory
from users.models import CustomUser 
import base64

class MediaResourceSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField() 
    file_base64 = serializers.CharField(write_only=True, required=False, allow_null=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    
    # Нові поля для категорій
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MediaResource
        fields = [
            'id', 'title', 'category', 'category_name', 'description', 
            'created_at', 'author', 'resource_type', 'resource_type_display',
            'url', 'file_base64', 'file_extension',
        ]
        read_only_fields = [
            'id', 'created_at', 'resource_type_display', 'category_name'
        ]

    def get_author(self, obj):
        if not obj.author:
            return {"id": None, "full_name": "Невідомо"}
        return {
            "id": obj.author.id,
            "full_name": getattr(obj.author, 'full_name', obj.author.username) or "Невідомо"
        }

    # =========================================================
    # ЛОГІКА ДЛЯ GET (ЧИТАННЯ) - Перетворення бінарних даних у Base64
    # =========================================================
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if instance.resource_type == MediaResource.ResourceType.FILE and instance.file_data:
            try:
                base64_data = base64.b64encode(instance.file_data).decode('utf-8')
                representation['file_base64'] = base64_data
            except Exception:
                representation['file_base64'] = None 
        else:
            representation['file_base64'] = None
            
        return representation

    # =========================================================
    # ДОПОМІЖНІ МЕТОДИ
    # =========================================================

    def _decode_file(self, data):
        """Декодування Base64 та запис у file_data."""
        file_base64 = data.pop('file_base64', None)
        file_extension = data.get('file_extension')
        
        if file_base64 and file_extension:
            try:
                if ';base64,' in file_base64:
                    header, file_base64 = file_base64.split(';base64,')

                decoded_file = base64.b64decode(file_base64)
                data['file_data'] = decoded_file
            except Exception:
                raise serializers.ValidationError({"file_base64": "Невірний формат Base64."})
        
        return data

    # =========================================================
    # ЛОГІКА ДЛЯ ВАЛІДАЦІЇ
    # =========================================================

    def validate(self, data):
        resource_type = data.get('resource_type')
        if not resource_type and self.instance:
            resource_type = self.instance.resource_type
        
        if resource_type in (MediaResource.ResourceType.YOUTUBE, MediaResource.ResourceType.TIKTOK):
            if not data.get('url'):
                raise serializers.ValidationError({"url": "Для відео поле 'url' є обов'язковим."})
            
            data['file_base64'] = None 
            data['file_extension'] = None
            if self.instance or 'file_data' in data:
                data['file_data'] = None 

        elif resource_type == MediaResource.ResourceType.FILE:
            is_creating = self.instance is None
            has_base64_file = 'file_base64' in data and data['file_base64'] is not None

            if is_creating or has_base64_file:
                if not has_base64_file or not data.get('file_extension'):
                    raise serializers.ValidationError({
                        "file_base64": "Для файлу 'file_base64' та 'file_extension' є обов'язковими."
                    })
            data['url'] = None
        
        return data

    # =========================================================
    # ЛОГІКА ДЛЯ CREATE/UPDATE (ЗАПИС)
    # =========================================================

    def create(self, validated_data):
        validated_data = self._decode_file(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'file_base64' in validated_data:
            validated_data = self._decode_file(validated_data)
        return super().update(instance, validated_data)
    


class MediaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaCategory
        fields = ['id', 'name', 'description']