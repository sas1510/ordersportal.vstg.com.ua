from rest_framework import serializers
from .models import HelpServiceContact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpServiceContact
        fields = '__all__'
