# media/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MediaResourceViewSet

router = DefaultRouter()
router.register(r'media-resources', MediaResourceViewSet, basename='media-resources')

urlpatterns = [
    path('', include(router.urls)),
]