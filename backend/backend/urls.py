from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),  # твої маршрути користувачів
    # path('api/', include('documents.urls')),  # додай, якщо в тебе app documents
    # path('api/', include('video.urls')),
    # path('api/', include('contact.urls')),
    path('', include('order.urls')),  # додай, якщо в тебе app orders
    

]

# Додати media лише після того, як urlpatterns створений
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
