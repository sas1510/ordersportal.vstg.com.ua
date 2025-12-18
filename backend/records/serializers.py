# payments/serializers.py
from rest_framework import serializers
from .models import Message
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "ID",
            "BaseTransactionID",
            "TransactionTypeID",
            "Message",
            "CreatedAt",
            "WriterID",
        ]
        read_only_fields = ("ID", "CreatedAt", "WriterID")

    def create(self, validated_data):
        request = self.context.get("request")

        # автоматично підставляємо автора
        validated_data["WriterID"] = request.user.id

        return super().create(validated_data)
