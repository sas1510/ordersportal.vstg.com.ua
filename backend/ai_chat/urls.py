from django.urls import path
from . import views

urlpatterns = [
    path('ai-chat/', views.chat_view, name='ai_chat'),
]