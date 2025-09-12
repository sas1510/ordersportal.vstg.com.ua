from rest_framework import serializers
from .models import Complaint, ComplaintPhoto

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            "id",
            "complaint_date",
            "order_number",
            "order_deliver_date",
            "order_define_date",
            "description",
            "urgent",
            "create_date",
            "issue",
            "solution",
        ]
        read_only_fields = ["id"]

class ComplaintPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintPhoto
        fields = [
            "id",
            "complaint",
            "photo",
            "photo_name",
            "upload_complete",
            "photo_ico",
            "photo_size",
        ]
        read_only_fields = ["id", "photo_ico", "upload_complete", "photo_size"]
