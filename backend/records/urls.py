# api/urls.py

from django.urls import path
from . import views  # Переконайтеся, що імпорт коректний
from .views import order_files_view, download_order_file,  create_message, CreateCalculationViewSet, get_dealer_addresses, wds_codes_by_contractor, get_messages, download_calculation_file, confirm_order, DeleteCalculationView
from .views import ProductionStatisticsView, DealerDetailedStatisticsView, DealerFullAnalyticsView, OrdersDealerStatisticsView

create_calculation = CreateCalculationViewSet.as_view({
    "post": "create"
})


urlpatterns = [
    # Визначаємо URL для виклику функції complaints_view
    path('complaints/get_reclamation_info/', views.complaints_view, name='reclamation_data'),
    path('order/get_orders_info/', views.api_get_orders, name='get_order_info'),
    path('additional_orders/get_additional_orders_info/', views.additional_orders_view, name='get_additional_orders_info'),
    path('additional_orders/get_additional_orders_info_all/', views.get_additional_orders_info_all, name='get_additional_orders_info_all'),
    path('complaints/get_reclamation_info_all/', views.complaints_view_all_by_month, name='get_reclamation_info_all'),
    path('order/get_orders_info_all/', views.orders_view_all_by_month, name='get_orders_info_all'),
    path('messages/create/', views.create_message, name='create_message'),
    path("order/<str:order_guid>/files/", order_files_view), # без логіки дилер
    path("order/<str:order_guid>/files/<str:file_guid>/download/", download_order_file, name="download_order_file"),
    path("calculations/create/", create_calculation), #  без логіки дилер
    path("dealer-addresses/", get_dealer_addresses, name="get_dealer_addresses"), #  без логіки дилер
    path("get_wds_codes/", wds_codes_by_contractor, name="get_wds_codes"), #  без логіки дилер
    path("messages/", get_messages, name="get-messages"),
    path("calculations/<str:calc_guid>/files/<str:file_guid>/download/", download_calculation_file, name="download_calculation_file"),
    path('orders/<uuid:order_id>/confirm/', confirm_order, name='confirm-order'),
    path("calculations/<uuid:calculation_guid>/delete/", DeleteCalculationView.as_view(),name="delete-calculation",),
    path("production-statistics/", ProductionStatisticsView.as_view()),
    path("kpi-statistics/", DealerDetailedStatisticsView.as_view()),
    path("full-statistics/", DealerFullAnalyticsView.as_view()),
    path("order-statistics/", OrdersDealerStatisticsView.as_view()),

]

