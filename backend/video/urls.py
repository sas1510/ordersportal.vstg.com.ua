from rest_framework.routers import DefaultRouter
from .views import VideoContentViewSet

router = DefaultRouter()
router.register(r'video', VideoContentViewSet, basename='video')

urlpatterns = router.urls
