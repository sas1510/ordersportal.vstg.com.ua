# transactions/serializers.py

from rest_framework import serializers


class MessageCreateSerializer(serializers.Serializer):
    transaction_type_id = serializers.IntegerField()
    base_transaction_guid = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField()
    # writer_guid = serializers.UUIDField(required=False, allow_null=True)


class CalculationCreateSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    items_count = serializers.IntegerField(min_value=1)
    comment = serializers.CharField(required=False, allow_blank=True)

    delivery_address_guid = serializers.CharField(
        required=False, allow_null=True
    )

    
    delivery_address_coordinates = serializers.DictField(
        required=False, allow_null=True
    )


    client_address = serializers.DictField(
        required=False, allow_null=True
    )

    file = serializers.DictField()



from rest_framework import serializers
from .models import UserDashboardConfig

class UserDashboardConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDashboardConfig
        fields = ['config', 'layout_name', 'updated_at']