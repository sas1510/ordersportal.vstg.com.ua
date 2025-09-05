from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, urgent_call_request

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
    path('urgent-call/', urgent_call_request, name='urgent-call'),
]
