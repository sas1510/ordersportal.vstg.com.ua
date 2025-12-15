from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path('api/admin/', admin.site.urls),
    # path('api/', include('users.urls')),  # маршрути користувачів
    # path('api/file/', include('backend.documents.urls')), 
    # path('api/', include('records.urls')),
    # path('api/', include('backend.contact.urls')),
    # path('api/', include('backend.order.urls')),  
    # path('api/complaints/', include('backend.complaints.urls')),  
    

]

# # Додати media лише після того, як urlpatterns створений
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
