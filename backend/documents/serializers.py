from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    file = serializers.FileField(required=False, allow_null=True)  # ✨ ключове

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

    def get_author(self, obj):
        return {
            "id": obj.author.id if obj.author else None,
            "first_last_name": obj.author.first_last_name if obj.author else "Невідомо"
        }
