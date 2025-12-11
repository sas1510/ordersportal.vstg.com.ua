# api/urls.py

from django.urls import path
from . import views  
from django.urls import path
from .views import get_payment_status_view, get_dealer_payment_page_data_view, get_dealer_advance_balance


urlpatterns = [
    path('get_payment_status_view/', get_payment_status_view, name='get_payment_status_view'),
    path('get_dealer_payment_page_data/', get_dealer_payment_page_data_view, name='get_dealer_payment_page_data_view'),
    path("full-ledger/", get_payment_status_view, name="get_dealer_full_ledger"),
    path("get_dealer_advance_balance/", get_dealer_advance_balance, name="get_dealer_advance_balance"),

]