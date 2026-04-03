from django.urls import path
from .views import (
    check_order_exists, 
    get_additional_order_nomenclature, 

    get_issue_add_order,
    AdditionalOrderViewSet
)

urlpatterns = [
    path('save_additional_order/', AdditionalOrderViewSet.as_view({'post': 'create'}), name='save_additional_order'),
    path('check_order/', check_order_exists, name='check_order_exists'),
    path('additional_order_nomenclature/', get_additional_order_nomenclature, name='get_additional_order_nomenclature'),
    path('get_issue_additional_order/', get_issue_add_order, name='get_issue_add_order'),
]