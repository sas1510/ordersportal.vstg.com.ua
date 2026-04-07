from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from django.views.decorators.csrf import csrf_exempt

from django.conf.urls import handler500


handler500 = 'backend.views.custom_error_500'

urlpatterns = [
    # path('api/admin/', admin.site.urls),
    # path('api/', include('users.urls')),  # маршрути користувачів
    # path('api/file/', include('backend.documents.urls')), 
    # path('api/', include('records.urls')),
    # path('api/', include('backend.contact.urls')),
    # path('api/', include('backend.order.urls')),  
    # path('api/complaints/', include('backend.complaints.urls')),  
    
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema")),
    # path('api/webpush/', csrf_exempt(include('webpush.urls'))),
    path('api/webpush/', include('webpush.urls')),
]

# # Додати media лише після того, як urlpatterns створений
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
