from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # ИСПРАВЛЕНИЕ: Добавляем префикс 'api/' для маршрутов пользователей,
    # чтобы соответствовать запросу фронтенда /api/login/
    # Это решает ошибку "Not Found: /api/login/"
        # ===== API =====
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema")),
    path('api/', include('backend.users.urls')), 
    # ИСПРАВЛЕНИЕ 2: Добавляем префикс 'api/' для маршрутов заказов,
    # чтобы устранить новую ошибку 404: /api/get_orders_info/
    # path('api/', include('backend.order.urls')),
    # path('api/complaints/', include('backend.complaints.urls')),  

    # path('', include('backend.users.urls')),  # твої маршрути користувачів
    # path('api/file/', include('backend.documents.urls')),  # додай, якщо в тебе app documents
    path('api/', include('backend.records.urls')),
    path('api/', include('backend.contact.urls')),
    path('api/', include('backend.portal_media.urls')),  # додай, якщо в тебе app orders
    path('api/payments/', include('backend.payments.urls')),  
    path('api/complaints/', include('backend.reclamations.urls')),  
    path('api/additional_orders/', include('backend.additional_order.urls')),  
    # path('complaints/', include('backend.complaints.urls')),  # додай, якщо в тебе app orders

    

]

# Додати media лише після того, як urlpatterns створений
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
