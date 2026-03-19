
from django.urls import path
from .views import check_order_exists

urlpatterns = [
    path('check_order/', check_order_exists, name='check_order_exists'),
]
