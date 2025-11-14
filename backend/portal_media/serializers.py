# media/serializers.py

from rest_framework import serializers
from .models import MediaResource
from backend.users.models import CustomUser 
import base64
from django.core.files.base import ContentFile

class MediaResourceSerializer(serializers.ModelSerializer):
    # Визначаємо 'author' як SerializerMethodField, як було раніше
    author = serializers.SerializerMethodField() 
    file_base64 = serializers.CharField(write_only=True, required=False, allow_null=True)
    # Видаляємо author_details (він більше не потрібен)
    # file_base64 = serializers.CharField(write_only=True, required=False, allow_null=True) 
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)

    class Meta:
        model = MediaResource
        fields = [
            'id', 'title', 'description', 'created_at',
            'author', # ПОВИННО БУТИ ТУТ!
            'resource_type', 'resource_type_display',
            'url', 'file_base64', 'file_extension',
        ]
        read_only_fields = [
            'id', 'created_at', 
            'resource_type_display'
            # Видаляємо 'author' та 'author_details' з read_only_fields
        ]

    # НОВИЙ/ВИПРАВЛЕНИЙ метод get_author
    def get_author(self, obj):
        # Логіка, що відповідає старому UploadFileSerializer
        return {
            "id": obj.author.id if obj.author else None,
            "full_name": obj.author.full_name if obj.author else "Невідомо"
        }

    # =========================================================
    # ЛОГІКА ДЛЯ GET (ЧИТАННЯ) - Перетворення бінарних даних у Base64
    # =========================================================
    def to_representation(self, instance):
        """
        Конвертуємо бінарні дані (file_data) у Base64 для GET-відповіді,
        якщо це ресурс типу FILE, щоб фронтенд міг завантажити файл.
        """
        representation = super().to_representation(instance)
        
        # Перевіряємо, чи це ресурс типу ФАЙЛ і чи існують бінарні дані
        if instance.resource_type == MediaResource.ResourceType.FILE and instance.file_data:
            try:
                # Конвертуємо байтові дані BinaryField у Base64 рядок
                base64_data = base64.b64encode(instance.file_data).decode('utf-8')
                
                # Повертаємо Base64 рядок у тому ж полі, яке фронтенд очікує: file_base64
                representation['file_base64'] = base64_data
            except Exception:
                representation['file_base64'] = None 
                
        else:
            # Для відео та інших типів, поле file_base64 не повертаємо
            representation['file_base64'] = None
            
        return representation

    # =========================================================
    # ДОПОМІЖНІ МЕТОДИ
    # =========================================================

    def get_author_details(self, obj):
        if obj.author:
            return {
                "id": obj.author.id,
                "full_name": obj.author.full_name or obj.author.username
            }
        return {"id": None, "full_name": "Невідомо"}

    def _decode_file(self, data):
        """Helper to decode Base64 data and set file_data field."""
        # Витягуємо Base64 для обробки, щоб воно не потрапило в save()
        file_base64 = data.pop('file_base64', None)
        file_extension = data.get('file_extension')
        
        if file_base64 and file_extension:
            try:
                # 1. Extract the actual base64 string (remove optional data URL prefix)
                if ';base64,' in file_base64:
                    header, file_base64 = file_base64.split(';base64,')

                # 2. Decode the Base64 string into raw bytes
                decoded_file = base64.b64decode(file_base64)
                
                # 3. Assign the binary data to the model field 'file_data'
                data['file_data'] = decoded_file
                
            except Exception:
                raise serializers.ValidationError({"file_base64": "Невірний формат Base64."})
        
        # Якщо file_base64 порожнє, але було надіслано (наприклад, при PATCH), 
        # ми нічого не робимо, залишаючи file_data незмінним.
        elif 'file_base64' in data and not file_base64:
             pass 
        
        return data

    # =========================================================
    # ЛОГІКА ДЛЯ ВАЛІДАЦІЇ
    # =========================================================

    def validate(self, data):
        # Визначаємо тип (з запиту або з існуючого об'єкта при PATCH)
        resource_type = data.get('resource_type')
        if not resource_type and self.instance:
            resource_type = self.instance.resource_type
        
        # ВАЖЛИВО: У validate ми перевіряємо лише логіку, декодування робимо в create/update.
        
        if resource_type in (MediaResource.ResourceType.YOUTUBE, MediaResource.ResourceType.TIKTOK):
            if not data.get('url'):
                raise serializers.ValidationError({"url": "Для типу 'Відео' поле 'url' є обов'язковим."})
            
            # Очищуємо поля файлу
            data['file_base64'] = None 
            data['file_extension'] = None
            if self.instance or 'file_data' in data:
                data['file_data'] = None 

        elif resource_type == MediaResource.ResourceType.FILE:
            is_creating = self.instance is None
            has_base64_file = 'file_base64' in data and data['file_base64'] is not None

            # При створенні, або при оновленні з новим файлом, перевіряємо обидва поля
            if is_creating or has_base64_file:
                if not has_base64_file or not data.get('file_extension'):
                    raise serializers.ValidationError({
                        "file_base64": "Для типу 'Файл' поля 'file_base64' та 'file_extension' є обов'язковими."
                    })

            # Очищуємо поле URL
            data['url'] = None
        
        return data

    # =========================================================
    # ЛОГІКА ДЛЯ CREATE/UPDATE (ЗАПИС)
    # =========================================================

    def create(self, validated_data):
        # 2. Додаємо логіку декодування для POST запитів
        validated_data = self._decode_file(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # 2. Додаємо логіку декодування для PUT/PATCH запитів
        
        # Декодуємо та встановлюємо file_data лише якщо file_base64 було надано у запиті
        if 'file_base64' in validated_data:
            validated_data = self._decode_file(validated_data)
        
        return super().update(instance, validated_data)