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
from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.GuidToBin1C import guid_to_1c_bin

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


class Guid1CBinaryField(serializers.Field):
    def to_representation(self, value):
        if value is None:
            return None
        return bin_to_guid_1c(value)  # 👉 повертає 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

    def to_internal_value(self, data):
        if not data:
            return None
        return guid_to_1c_bin(data)



class CompleteRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'password',
            'full_name',
            'phone_number',
            'email',


            # 👁️ READ-ONLY для фронту
            'role',
            'expire_date',
            'username'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True},
            'expire_date': {'read_only': True},
            'username' : {'read_only': True}
        }

    def update(self, instance, validated_data):
        # 🔐 пароль
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # ✏️ дозволені поля
        for field in ['full_name', 'phone_number', 'email']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        # ✅ реєстрація завершена
        instance.is_active = True
        instance.save()

        return instance


from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True,
        help_text="Поточний пароль користувача"
    )
    new_password = serializers.CharField(
        write_only=True,
        help_text="Новий пароль"
    )
