# backend/orders/urls.py
from django.urls import path
from .views import CreateOrderView, LastOrderNumberView, CustomerOrdersView, AddOrderMessageView, OrderMessagesView

urlpatterns = [
    path("create/", CreateOrderView.as_view(), name="create-order"),
    path("last-order-number/", LastOrderNumberView.as_view(), name="last-order-number"),
    path("customer-orders/", CustomerOrdersView.as_view(), name="customer-orders"),
    path('orders/<int:order_id>/messages/', OrderMessagesView.as_view(), name='order-messages'),
    path("orders/<int:order_id>/add-message/", AddOrderMessageView.as_view(), name="add-order-message"),
]
