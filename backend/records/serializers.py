# payments/serializers.py
from rest_framework import serializers
from .models import Message
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


class MessageSerializer(serializers.ModelSerializer):
    writer_guid = serializers.CharField(write_only=True, required=False)
    base_transaction_guid = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = [
            "id",
            "transaction_type",
            "message",
            "created_at",
            "writer_guid",
            "base_transaction_guid",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        writer_guid = validated_data.pop("writer_guid", None)
        base_guid = validated_data.pop("base_transaction_guid", None)

        if writer_guid:
            validated_data["writer_id"] = guid_to_1c_bin(writer_guid)

        if base_guid:
            validated_data["base_transaction_id"] = guid_to_1c_bin(base_guid)

        return super().create(validated_data)
