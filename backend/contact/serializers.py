from rest_framework import serializers
from .models import HelpServiceLog, HelpServiceContact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpServiceContact
        fields = '__all__'


from rest_framework import serializers
from .models import HelpServiceLog

class HelpServiceLogSerializer(serializers.ModelSerializer):
    # Дані з пов’язаних моделей
    contact_name = serializers.CharField(source='contact.contact_name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone', read_only=True)
    contact_department = serializers.CharField(source='contact.department', read_only=True)
    contact_email = serializers.CharField(source='contact.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)  # ✅ номер клієнта

    class Meta:
        model = HelpServiceLog
        fields = [
            'id',
            'create_date',
            'success',
            'call_type',
            'contact_name',
            'contact_phone',
            'contact_email',
            'contact_department',
            'full_name',
            'user_email',
            'user_phone',  # нове поле
        ]
