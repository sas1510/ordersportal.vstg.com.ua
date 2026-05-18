# import logging
from urllib.parse import parse_qs
from django.utils import timezone
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from backend.utils.logging_setup import logger
from jwt import ExpiredSignatureError

User = get_user_model()
# logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_jwt(token_key):
    try:
        token = AccessToken(token_key)
        user = User.objects.get(id=token['user_id'])
        return user
    
    except ExpiredSignatureError:

        return None
        
    except Exception as e:
        
        # logger.error(f"JWT AUTH ERROR: {str(e)}", extra={
        #     'tags': {
        #         'action': 'get_user_from_jwt (socket)'
        #     }
        # })
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
            logger.warning(f"--- WS AUTH: Key inactive ({key_string[:5]}...) ---", extra={
                    'tags': {
                        'action': 'get_user_from_api_key (socket)'
                    
                    }
                })
            return None

        api_key_obj.last_used_at = timezone.now()
        api_key_obj.save(update_fields=['last_used_at'])

        return api_key_obj.user
    except Exception as e:
       
        logger.error(f"--- WS AUTH DATABASE ERROR: {str(e)} ---", extra={
                    'tags': {
                        'action': 'get_user_from_api_key (socket)'
                    
                    }
                })
        return None

class HybridAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # 1. ДЕБАГ (дивимось у sudo journalctl -u daphne -f)
        headers = dict(scope.get('headers', []))
        query_string = scope.get('query_string', b'').decode()
        path = scope.get('path', 'unknown')

        # print(f"--- NEW WS CONNECTION ATTEMPT ---")
        # print(f"DEBUG RAW HEADERS: {headers.keys()}")
        # print(f"DEBUG QUERY STRING: {query_string}")

        query_params = parse_qs(query_string)
        token_param = query_params.get('token', [None])[0]
        api_key_param = query_params.get('api_key', [None])[0]

        # Шукаємо заголовок (пробуємо різні варіанти написання)
        api_key_header = (
            headers.get(b'x-api-key', b'') or 
            headers.get(b'http-x-api-key', b'')
        ).decode()

        # logger.info(f"WS Attempt: Path='{path}' | HasToken: {bool(token_param)} | HasApiKey: {bool(api_key_header or api_key_param)}")

        scope['user'] = AnonymousUser()


        try:
            # Логіка ідентифікації
            if token_param:

                user = await get_user_from_jwt(token_param)

                if user:
                # print(f"Attempting JWT Auth with: {token_param[:10]}...")
                    scope['user'] = await get_user_from_jwt(token_param) or AnonymousUser()
                    # logger.info(f"WS Auth Success: JWT User='{user.username}' (id={user.id})")
                # else:
                    # logger.warning(f"WS Auth Failed: Invalid JWT token", extra={
                    # 'tags': {
                    #     'action': 'HybridAuthMiddleware (socket)'
                    
                    # }
                # })

            elif api_key_header or api_key_param:
                key_to_use = api_key_header or api_key_param
                source = "Header" if api_key_header else "URL"
                masked_key = f"{key_to_use[:4]}***"
                
                # logger.debug(f"WS Auth: Trying API Key from {source} ({masked_key})")
                user = await get_user_from_api_key(key_to_use)
                if user:
                    scope['user'] = user
                    # logger.info(f"WS Auth Success: API Key User='{user.username}' (Source: {source})")
                # else:
                #     logger.warning(f"WS Auth Failed: Invalid API Key from {source}", extra={
                #     'tags': {
                #         'action': 'HybridAuthMiddleware (socket)'
                    
                #     }
                # })

            else:
                None
                # logger.info("WS Auth: No credentials provided, proceeding as Anonymous")

            
            # elif api_key_header:
            #     print(f"Attempting Header API Key: {api_key_header[:5]}...")
            #     scope['user'] = await get_user_from_api_key(api_key_header) or AnonymousUser()
                
            # elif api_key_param:
            #     print(f"Attempting URL API Key: {api_key_param[:5]}...")
            #     scope['user'] = await get_user_from_api_key(api_key_param) or AnonymousUser()
        except Exception as e:
            # Важливо зловити помилку тут, щоб не "покласти" весь сервіс Daphne
            logger.error(f"WS Auth Critical Error: {str(e)}", exc_info=True, extra={
                    'tags': {
                        'action': 'HybridAuthMiddleware (socket)'
                    
                    }
                })
            scope['user'] = AnonymousUser()

        # if isinstance(scope['user'], AnonymousUser):
            # logger.debug(f"WS Connection proceeding with AnonymousUser")

        return await self.app(scope, receive, send)