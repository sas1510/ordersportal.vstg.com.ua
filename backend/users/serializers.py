# # users/serializers.py
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
# from rest_framework import serializers
# from django.contrib.auth import get_user_model
# from .models import CustomUser, Invitation
# from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

# User = get_user_model()

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         # додаємо кастомні поля
#         token['role'] = user.role
#         token['username'] = user.username
#         token['full_name'] = user.full_name
#         return token




# class CompleteRegistrationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CustomUser
#         fields = [
#             'password', 'full_name', 'phone_number', 'username', 
#             'expire_date', 'email_confirmed', 'phone_number_confirmed',
#             'two_factor_enabled', 'access_failed_count', 'role', 'user_id_1C',
#             'auto_confirm_order', 'permit_finance_info'
#         ]
#         extra_kwargs = {'password': {'write_only': True}}

#     def update(self, instance, validated_data):
#         password = validated_data.pop('password', None)
#         if password:
#             instance.set_password(password)
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.enable = True
#         instance.save()
#         return instance
# users/serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Invitation # 'CustomUser' імпортується через get_user_model

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Додає 'role', 'username', 'full_name' до JWT токену.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Додаємо кастомні поля з нової моделі
        token['role'] = user.role
        token['username'] = user.username
        token['full_name'] = user.full_name
        return token


class CompleteRegistrationSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для оновлення користувача при завершенні реєстрації.
    """
    class Meta:
        model = User
        # ВИПРАВЛЕНО: Оновлено список полів відповідно до нової моделі
        fields = [
            'password', 
            'full_name', 
            'phone_number', 
            'username', 
            'expire_date', # Це поле є в новій моделі
            'role', 
            'user_id_1C',
            'permit_finance_info',
            'old_portal_id'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # ВИПРАВЛЕНО: 'enable' -> 'is_active'
        # Встановлюємо is_active=True, оскільки реєстрація завершена
        instance.is_active = True 
        instance.save()
        return instance