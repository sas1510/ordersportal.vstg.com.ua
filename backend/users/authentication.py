# accounts/authentication.py
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import ExternalAPIKey

class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return None  # нехай інші Authentication Class спробують

        try:
            key_obj = ExternalAPIKey.objects.get(key=api_key, is_active=True)
        except ExternalAPIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid or inactive API key")

        # Авторизація проходить, але користувача немає (для сервісів це норм)
        return (None, None)
