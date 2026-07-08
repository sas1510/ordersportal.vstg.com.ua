# # transactions/serializers.py

# from rest_framework import serializers


# class MessageCreateSerializer(serializers.Serializer):
#     transaction_type_id = serializers.IntegerField()
#     base_transaction_guid = serializers.UUIDField(required=False, allow_null=True)
#     message = serializers.CharField()
#     # writer_guid = serializers.UUIDField(required=False, allow_null=True)


# class CalculationCreateSerializer(serializers.Serializer):
#     order_number = serializers.CharField()
#     items_count = serializers.IntegerField(min_value=1)
#     comment = serializers.CharField(required=False, allow_blank=True)

#     delivery_address_guid = serializers.CharField(
#         required=False, allow_null=True
#     )

    
#     delivery_address_coordinates = serializers.DictField(
#         required=False, allow_null=True
#     )


#     client_address = serializers.DictField(
#         required=False, allow_null=True
#     )

#     file = serializers.DictField()





# from rest_framework import serializers
# from .models import ChatMessage

# class ChatMessageSerializer(serializers.ModelSerializer):
#     author_name = serializers.CharField(source='author.username', read_only=True)

#     class Meta:
#         model = ChatMessage
#         fields = ['id', 'chat_id', 'author_name', 'text', 'timestamp', 'is_read']



from rest_framework import serializers
from .models import ChatMessage


class PhotoFileSerializer(serializers.Serializer):
    """
    Серіалізатор для обробки файлів та фотографій у форматі Base64.
    """
    fileName = serializers.CharField(required=True)
    fileDataB64 = serializers.CharField(required=True)


class MessageCreateSerializer(serializers.Serializer):
    transaction_type_id = serializers.IntegerField()
    base_transaction_guid = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField()
    # writer_guid = serializers.UUIDField(required=False, allow_null=True)


class CalculationCreateSerializer(serializers.Serializer):
    order_number = serializers.CharField(required=False, allow_blank=True, default="")
    items_count = serializers.IntegerField(min_value=1)
    comment = serializers.CharField(required=False, allow_blank=True, default="")
    
    delivery_address_guid = serializers.UUIDField(required=False, allow_null=True)
    
    # Використовуємо DictField, якщо фронтенд передає об'єкт виду {"lat": 50.45, "lng": 30.52}
    delivery_address_coordinates = serializers.DictField(
        required=False, allow_null=True, default=dict
    )
    
    # Використовуємо DictField для структурованої адреси клієнта
    client_address = serializers.DictField(
        required=False, allow_null=True, default=dict
    )
    
    # Головний файл розрахунку (ТЗ, кошторис тощо)
    file = PhotoFileSerializer() 
    
    # Масив додаткових фотографій (може бути пустим)
    photos = serializers.ListField(
        child=PhotoFileSerializer(),
        required=False,
        default=[]
    )


class ChatMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'chat_id', 'author_name', 'text', 'timestamp', 'is_read']
