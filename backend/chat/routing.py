# backend/chat/routing.py
from django.urls import re_path
from .consumers.consumers import ChatConsumer
from .consumers.notifications import NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<chat_id>[\w.-]+)/$', ChatConsumer.as_asgi()),
    # Змінюємо .as_view() на .as_asgi()
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()), 
]