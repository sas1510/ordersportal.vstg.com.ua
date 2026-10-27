# api/urls.py

from django.urls import path
from . import views  
from django.urls import path
from .views import get_payment_status_view, get_dealer_payment_page_data_view, get_dealer_advance_balance, export_payment_status_excel, dealer_bills_add_info_view, customer_bills_view, create_invoice, create_invoice_v2, invoice_contractors_view, invoice_profile_v2_view, invoice_advance_contracts_view, invoice_settlements_view, make_payment_from_advance, get_partner_full_data_view
from .views import GetBillPDF
from .transfer_submissions import transfer_submissions, transfer_photo, transfer_history_pdf, transfer_routes

from .reconciliation_views import reconcile_transfer_history

urlpatterns = [
    path('funds-transfers/reconcile/', reconcile_transfer_history),
    path('funds-transfers/', transfer_submissions),
    path('funds-transfers/routes/', transfer_routes),
    path('funds-transfers/export-pdf/', transfer_history_pdf),
    path('funds-transfers/<int:pk>/photo/', transfer_photo),
    path('get_payment_status_view/', get_payment_status_view, name='get_payment_status_view'),
    path('get_dealer_payment_page_data/', get_dealer_payment_page_data_view, name='get_dealer_payment_page_data_view'),
    # path("full-ledger/", get_payment_status_view, name="get_dealer_full_ledger"),
    path("get_dealer_advance_balance/", get_dealer_advance_balance, name="get_dealer_advance_balance"),
    path("export_payment_status_excel/", export_payment_status_excel , name="export_payment_status_excel"),
    path("dealers/profile/", dealer_bills_add_info_view , name="dealer_bills_add_info_view"),
    path("dealers/bills/", customer_bills_view, name="customer_bills_view" ),
    path("create_invoice/", create_invoice, name="create_invoice" ),
    path("create_invoice_v2/", create_invoice_v2, name="create_invoice_v2"),
    path("invoice-contractors/", invoice_contractors_view, name="invoice_contractors"),
    path("invoice-profile-v2/", invoice_profile_v2_view, name="invoice_profile_v2"),
    path("invoice-advance-contracts/", invoice_advance_contracts_view, name="invoice_advance_contracts"),
    path("invoice-settlements/", invoice_settlements_view, name="invoice_settlements"),
    path("make_payment_from_advance/", make_payment_from_advance, name="make_payment_from_advance"),
    path("get_partner_full_data/", get_partner_full_data_view, name="get_partner_full_data_view"),
    path("get_bill_pdf/<str:bill_guid>/", GetBillPDF.as_view(), name="get_bill_pdf"),
]
