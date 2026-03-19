from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user(token_key):
    try:
        token = AccessToken(token_key)
        return User.objects.get(id=token['user_id'])
    except TokenError:
        return None
    except Exception:
        return None


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope['query_string'].decode()
        query_params = parse_qs(query_string)

        token = query_params.get('token')

        if token:
            user = await get_user(token[0])
            scope['user'] = user if user else AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)