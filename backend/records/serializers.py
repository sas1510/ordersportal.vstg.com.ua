# transactions/serializers.py

from rest_framework import serializers


class MessageCreateSerializer(serializers.Serializer):
    transaction_type_id = serializers.IntegerField()
    base_transaction_guid = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField()
    # writer_guid = serializers.UUIDField(required=False, allow_null=True)