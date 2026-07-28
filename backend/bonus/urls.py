from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BonusProductViewSet

router = DefaultRouter()
router.register(r'bonus-products', BonusProductViewSet, basename='bonus-products')

urlpatterns = [
    path('', include(router.urls)),
]
