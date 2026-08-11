# media/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MediaCategoryViewSet, MediaResourceViewSet

router = DefaultRouter()
router.register(r'media-resources', MediaResourceViewSet, basename='media-resources')
router.register(r'media-categories', MediaCategoryViewSet, basename='media-categories')

urlpatterns = [
    path('', include(router.urls)),
]
