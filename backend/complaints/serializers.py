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
            # "create_date",
            "issue",
            "solution",
            "user_id_1C",
            "web_number",
        ]
        read_only_fields = ["id"]

# serializers.py
from rest_framework import serializers
from .models import ComplaintPhoto2

# serializers.py
from rest_framework import serializers
from .models import ComplaintPhoto
import base64

class ComplaintPhotoSerializer(serializers.ModelSerializer):
    photo_base64 = serializers.SerializerMethodField()
    photo_ico_base64 = serializers.SerializerMethodField()  # нове поле для мініатюри

    class Meta:
        model = ComplaintPhoto
        fields = [
            "id", "photo_name", "photo_size", "upload_complete", 
            "complaint_id", "photo_base64", "photo_ico_base64"
        ]

    def get_photo_base64(self, obj):
        if obj.photo:
            return base64.b64encode(obj.photo).decode("utf-8")
        return None

    def get_photo_ico_base64(self, obj):
        if obj.photo_ico:  # передбачаємо, що в моделі є поле photo_ico
            return base64.b64encode(obj.photo_ico).decode("utf-8")
        return None
