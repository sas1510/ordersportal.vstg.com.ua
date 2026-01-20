# api/urls.py

from django.urls import path
from . import views  
from django.urls import path
from .views import get_payment_status_view, get_dealer_payment_page_data_view, get_dealer_advance_balance, export_payment_status_excel, dealer_bills_add_info_view, customer_bills_view


urlpatterns = [
    path('get_payment_status_view/', get_payment_status_view, name='get_payment_status_view'),
    path('get_dealer_payment_page_data/', get_dealer_payment_page_data_view, name='get_dealer_payment_page_data_view'),
    # path("full-ledger/", get_payment_status_view, name="get_dealer_full_ledger"),
    path("get_dealer_advance_balance/", get_dealer_advance_balance, name="get_dealer_advance_balance"),
    path("export_payment_status_excel/", export_payment_status_excel , name="export_payment_status_excel"),
    path("dealers/profile/", dealer_bills_add_info_view , name="dealer_bills_add_info_view"),
    path("dealers/bills/", customer_bills_view, name="customer_bills_view" ),

]