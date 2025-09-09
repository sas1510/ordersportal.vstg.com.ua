# # backend/orders/serializers.py
# from rest_framework import serializers
# from .models import OrdersUnified

# class OrdersUnifiedSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OrdersUnified
#         fields = "__all__"
# backend/orders/serializers.py
from rest_framework import serializers
from .models import OrdersUnified

class OrdersUnifiedCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdersUnified
        fields = [
            "order_number",
            "customer_id",
            "order_number_contructions",
            "file",
            "description",
            "create_date",
            "last_message_time",
        ]
        read_only_fields = ["create_date", "last_message_time"]
