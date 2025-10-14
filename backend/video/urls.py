from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoContentViewSet

router = DefaultRouter()
router.register(r'', VideoContentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
