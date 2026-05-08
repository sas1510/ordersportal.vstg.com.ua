# media/serializers.py

from rest_framework import serializers
from .models import MediaResource, MediaCategory
import base64

class MediaResourceSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField() 
    file_base64 = serializers.CharField(write_only=True, required=False, allow_null=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    
    # Поля категорій
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MediaResource
        fields = [
            'id', 'titles', 'category', 'category_name', 'descriptions', 
            'created_at', 'author', 'resource_type', 'resource_type_display',
            'urls', 'file_base64', 'file_extension', 'image_url'
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
    # ЛОГІКА ДЛЯ GET (ЧИТАННЯ)
    # =========================================================
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Перетворення бінарних даних файлу в Base64 для фронтенду
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
        
        if file_base64:
            try:
                if ';base64,' in file_base64:
                    _, file_base64 = file_base64.split(';base64,')

                decoded_file = base64.b64decode(file_base64)
                data['file_data'] = decoded_file
            except Exception:
                raise serializers.ValidationError({"file_base64": "Невірний формат Base64."})
        
        return data

    # =========================================================
    # ВАЛІДАЦІЯ
    # =========================================================
    def validate(self, data):
        resource_type = data.get('resource_type')
        # Якщо це оновлення (PATCH/PUT), беремо тип з існуючого об'єкта
        if not resource_type and self.instance:
            resource_type = self.instance.resource_type

        # 1. Валідація назв ( titles має бути об'єктом і мати хоча б UA версію )
        titles = data.get('titles')
        if titles is not None:
            if not isinstance(titles, dict) or not titles.get('ua'):
                raise serializers.ValidationError({"titles": "Поле 'titles' має містити як мінімум українську назву {'ua': '...'}"})

        # 2. Логіка залежно від типу ресурсу
        if resource_type in [
            MediaResource.ResourceType.YOUTUBE, 
            MediaResource.ResourceType.TIKTOK, 
            MediaResource.ResourceType.INSTA, 
            MediaResource.ResourceType.FB
        ]:
            urls = data.get('urls')
            # Перевіряємо, чи є хоча б одне посилання в JSON об'єкті
            if not urls or not any(urls.values()):
                raise serializers.ValidationError({"urls": "Для відео-ресурсів потрібно додати хоча б одне посилання у форматі {'ua': 'url'}"})
            
            # Очищуємо поля файлів, якщо це відео
            data['file_base64'] = None 
            data['file_extension'] = None
            if self.instance or 'file_data' in data:
                data['file_data'] = None 

        elif resource_type == MediaResource.ResourceType.FILE:
            is_creating = self.instance is None
            has_new_file = 'file_base64' in data and data['file_base64'] is not None

            if is_creating or has_new_file:
                if not data.get('file_base64') or not data.get('file_extension'):
                    raise serializers.ValidationError({
                        "file_base64": "Для завантаження файлу 'file_base64' та 'file_extension' є обов'язковими."
                    })
            # Очищуємо посилання, якщо це файл
            data['urls'] = {}

        return data

    # =========================================================
    # CREATE / UPDATE
    # =========================================================
    def create(self, validated_data):
        if validated_data.get('resource_type') == MediaResource.ResourceType.FILE:
            validated_data = self._decode_file(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get('file_base64'):
            validated_data = self._decode_file(validated_data)
        return super().update(instance, validated_data)

class MediaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaCategory
        fields = ['id', 'name', 'description']