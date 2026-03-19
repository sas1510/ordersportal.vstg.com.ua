from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from webpush.views import save_info

from utils.webpush_utils import custom_save_webpush

from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

# Створюємо обгортку, щоб DRF зрозумів JWT
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def webpush_wrapper(request):
    return custom_save_webpush(request)

urlpatterns = [
    path('admin/', admin.site.urls),
    # ИСПРАВЛЕНИЕ: Добавляем префикс 'api/' для маршрутов пользователей,
    # чтобы соответствовать запросу фронтенда /api/login/
    # Это решает ошибку "Not Found: /api/login/"
        # ===== API =====
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema")),
    path('api/', include('users.urls')), 
    # ИСПРАВЛЕНИЕ 2: Добавляем префикс 'api/' для маршрутов заказов,
    # чтобы устранить новую ошибку 404: /api/get_orders_info/
    # path('api/', include('backend.order.urls')),
    # path('api/complaints/', include('backend.complaints.urls')),  

    # path('', include('backend.users.urls')),  # твої маршрути користувачів
    # path('api/file/', include('backend.documents.urls')),  # додай, якщо в тебе app documents
    path('api/', include('records.urls')),
    path('api/', include('contact.urls')),
    path('api/', include('portal_media.urls')),  # додай, якщо в тебе app orders
    path('api/payments/', include('payments.urls')),  
    path('api/complaints/', include('reclamations.urls')),  
    path('api/additional_orders/', include('additional_order.urls')),  


    path('api/webpush/save_information/', csrf_exempt(webpush_wrapper), name='save_webpush_info'),
    path('api/webpush/', include('webpush.urls')),
    # path('complaints/', include('backend.complaints.urls')),  # додай, якщо в тебе app orders

    

]

# Додати media лише після того, як urlpatterns створений
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
