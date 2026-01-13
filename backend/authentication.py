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

class OneCApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            return None

        api_key = api_key.strip().lower()
        
        # settings.ONE_C_API_KEYS вже є списком завдяки cast=Csv()
        allowed_keys = [key.strip().lower() for key in settings.ONE_C_API_KEYS if key]

        for valid_key in allowed_keys:
            if secrets.compare_digest(api_key, valid_key):
                # Повертаємо (None, "1C_API_KEY")
                # None — бо користувача (User) немає
                # "1C_API_KEY" — потрапить у request.auth
                return (None, "1C_API_KEY")

        return None

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
