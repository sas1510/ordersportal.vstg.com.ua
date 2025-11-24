# api/urls.py

from django.urls import path
from . import views  

urlpatterns = [
    path('get_payment_status_view/', views.get_payment_status_view, name='get_payment_status_view'),

]