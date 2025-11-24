from .views import AdditionalViewSet


from django.urls import path, include 

from .views import check_order_exists



urlpatterns = [

    path('check_order/', check_order_exists, name='check_order_exists'),
    path('create_additional_orders/', AdditionalViewSet.as_view({'post': 'create'}), name='create_additional_orders'),


]
