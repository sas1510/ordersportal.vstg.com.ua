import os
import django
from django.core.asgi import get_asgi_application

# 1. Спочатку встановлюємо змінну оточення
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# 2. Ініціалізуємо Django (це важливо зробити до імпорту middleware)
django.setup()
django_asgi_app = get_asgi_application()

# 3. ТІЛЬКИ ТЕПЕР імпортуємо твоє
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.middleware import HybridAuthMiddleware  # Тепер він не видасть помилку
import chat.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": HybridAuthMiddleware(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})