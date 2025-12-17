# api/urls.py

from django.urls import path
from . import views  # Переконайтеся, що імпорт коректний
from .views import order_files_view, download_order_file,  create_message

urlpatterns = [
    # Визначаємо URL для виклику функції complaints_view
    path('get_reclamation_info/', views.complaints_view, name='reclamation_data'),
    path('get_orders_info/', views.api_get_orders, name='get_order_info'),
    path('get_additional_orders_info/', views.additional_orders_view, name='get_additional_orders_info'),
    path('create_message/', views.create_message, name='create_message'),
    path("order/<str:order_guid>/files/", order_files_view),
    path("order/<str:order_guid>/files/<str:file_guid>/<str:filename>/download/", download_order_file),
    
]

