import logging
from urllib.parse import parse_qs
from django.utils import timezone
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_jwt(token_key):
    try:
        token = AccessToken(token_key)
        user = User.objects.get(id=token['user_id'])
        return user
    except Exception as e:
        print(f"JWT AUTH ERROR: {str(e)}") # Це покаже чому саме (Expired, Invalid signature, etc)
        return None

@database_sync_to_async
def get_user_from_api_key(key_string):
    try:
        # Виправлено назву моделі: UserApiKey
        from users.models import UserApiKey
        
        api_key_obj = UserApiKey.objects.select_related('user').get(
            api_key=key_string,
            is_active=True
        )

        if api_key_obj.expire_date and api_key_obj.expire_date < timezone.now():
            print(f"--- WS AUTH: Ключ прострочений ({key_string[:5]}...) ---")
            return None

        # Оновлюємо статистику використання
        api_key_obj.last_used_at = timezone.now()
        api_key_obj.save(update_fields=['last_used_at'])

        return api_key_obj.user
    except Exception as e:
        # Якщо ключ не знайдено або інша помилка — побачимо в консолі
        print(f"--- WS AUTH DATABASE ERROR: {str(e)} ---")
        return None

class HybridAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # 1. ДЕБАГ (дивимось у sudo journalctl -u daphne -f)
        headers = dict(scope.get('headers', []))
        query_string = scope.get('query_string', b'').decode()
        
        print(f"--- NEW WS CONNECTION ATTEMPT ---")
        print(f"DEBUG RAW HEADERS: {headers.keys()}")
        print(f"DEBUG QUERY STRING: {query_string}")

        query_params = parse_qs(query_string)
        token_param = query_params.get('token', [None])[0]
        api_key_param = query_params.get('api_key', [None])[0]

        # Шукаємо заголовок (пробуємо різні варіанти написання)
        api_key_header = (
            headers.get(b'x-api-key', b'') or 
            headers.get(b'http-x-api-key', b'')
        ).decode()

        scope['user'] = AnonymousUser()

        # Логіка ідентифікації
        if token_param:
            print(f"Attempting JWT Auth with: {token_param[:10]}...")
            scope['user'] = await get_user_from_jwt(token_param) or AnonymousUser()
        
        elif api_key_header:
            print(f"Attempting Header API Key: {api_key_header[:5]}...")
            scope['user'] = await get_user_from_api_key(api_key_header) or AnonymousUser()
            
        elif api_key_param:
            print(f"Attempting URL API Key: {api_key_param[:5]}...")
            scope['user'] = await get_user_from_api_key(api_key_param) or AnonymousUser()

        print(f"FINAL USER: {scope['user']}")
        return await self.app(scope, receive, send)