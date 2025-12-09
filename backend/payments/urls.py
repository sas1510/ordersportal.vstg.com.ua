# api/urls.py

from django.urls import path
from . import views  
from django.urls import path
from .views import get_payment_status_view


urlpatterns = [
    path('get_payment_status_view/', views.get_payment_status_view, name='get_payment_status_view'),
    path("full-ledger/", get_payment_status_view, name="get_dealer_full_ledger"),

]