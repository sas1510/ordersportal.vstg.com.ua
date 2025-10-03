# backend/orders/urls.py
from django.urls import path
from .views import CreateOrderView, LastOrderNumberView, CustomerOrdersView, AddOrderMessageView, OrderMessagesView, get_order_payment_status, get_filtered_orders, get_orders_by_dealer_and_year, portal_view

urlpatterns = [
    path("create/", CreateOrderView.as_view(), name="create-order"),
    path("last-order-number/", LastOrderNumberView.as_view(), name="last-order-number"),
    path("customer-orders/", CustomerOrdersView.as_view(), name="customer-orders"),
    path('orders/<int:order_id>/messages/', OrderMessagesView.as_view(), name='order-messages'),
    path("orders/<int:order_id>/add-message/", AddOrderMessageView.as_view(), name="add-order-message"),
    path("get_order_payment_status/", get_order_payment_status, name="get_order_payment_status"),
    path("get_filtered_orders/", get_filtered_orders, name="get_filtered_orders"),
    path("get_orders_by_dealer_and_year/", get_orders_by_dealer_and_year, name="get_orders_by_dealer_and_year"),
    path("get_orders_info/", portal_view, name="get_orders_info"),
]
