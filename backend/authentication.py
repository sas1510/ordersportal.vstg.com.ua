import secrets
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
import secrets
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

import backend.authentication_schema

# authentication.py
from rest_framework.authentication import BaseAuthentication
from django.conf import settings
import secrets

import secrets
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from users.models import CustomUser
from users.models import UserApiKey


class OneCApiKeyAuthentication(BaseAuthentication):
    """
    Аутентифікація через API key з БД
    """

    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            return None  # ❗ даємо шанс JWT

        api_key = api_key.strip()

        try:
            key_obj = (
                UserApiKey.objects
                .select_related("user")
                .get(api_key=api_key, is_active=True)
            )
        except UserApiKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API key")

        # 🔒 перевірка терміну дії
        if key_obj.expire_date and key_obj.expire_date < timezone.now():
            raise AuthenticationFailed("API key expired")

        user = key_obj.user
        if not user or not user.is_active:
            raise AuthenticationFailed("User inactive")

        # можна оновлювати last_used_at
        key_obj.last_used_at = timezone.now()
        key_obj.save(update_fields=["last_used_at"])

        # 👇 КЛЮЧОВЕ
        return (user, "1C_API_KEY")

# class OneCApiKeyAuthentication(BaseAuthentication):
#     """
#     Authentication via X-API-KEY for 1C (HARDCODE TEST)
#     """

#     TEST_KEY = "1c-key-b1905a9b-141c-b2kfe-11f0-5b04d19ff86c-2025"

#     def authenticate(self, request):
#         api_key = request.headers.get("X-API-KEY")

#         print("HEADER API KEY:", api_key)

#         if not api_key:
#             return None  # ⬅️ даємо шанс JWT

#         api_key = api_key.strip().lower()
#         test_key = self.TEST_KEY.lower()

#         if secrets.compare_digest(api_key, test_key):
#             print("✅ API KEY MATCHED")
#             return (AnonymousUser(), "1C_API_KEY")

#         print("❌ API KEY INVALID")
#         raise AuthenticationFailed("Invalid API key")
