from django.urls import path
from .views import (
    check_order_exists, 
    get_additional_order_nomenclature, 
    AdditionalViewSet
)

urlpatterns = [
    path('create_additional_orders/', AdditionalViewSet.as_view({'post': 'create'}), name='create_additional_orders'),
    path('check_order/', check_order_exists, name='check_order_exists'),
    path('additional_order_nomenclature/', get_additional_order_nomenclature, name='get_additional_order_nomenclature'),
]