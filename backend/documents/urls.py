from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UploadFileViewSet

router = DefaultRouter()
router.register(r'upload-files', UploadFileViewSet, basename='upload-files')

urlpatterns = [
    path('', include(router.urls)),
]
