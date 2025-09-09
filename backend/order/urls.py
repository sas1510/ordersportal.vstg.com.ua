# backend/orders/urls.py
from django.urls import path
from .views import CreateOrderView, LastOrderNumberView

urlpatterns = [
    path("create/", CreateOrderView.as_view(), name="create-order"),
    path("last-order-number/", LastOrderNumberView.as_view(), name="last-order-number"),
]
