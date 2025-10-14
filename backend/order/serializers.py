# # backend/orders/serializers.py
# from rest_framework import serializers
# from .models import OrdersUnified

# class OrdersUnifiedSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OrdersUnified
#         fields = "__all__"
# backend/orders/serializers.py
from rest_framework import serializers
from .models import Order, Message

class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "order_number",
            "customer",
            "order_number_constructions",
            "file",
            "create_date",
            "author"
           
        ]
        read_only_fields = []



class OrderMessageSerializer(serializers.ModelSerializer):
    writer = serializers.StringRelatedField(read_only=True)  # якщо хочеш показувати автора

    class Meta:
        model = Message
        fields = ['id', 'order', 'writer', 'message', 'created_at']
