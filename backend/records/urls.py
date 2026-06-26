# api/urls.py

from django.urls import path
from . import views  # Переконайтеся, що імпорт коректний
from .views import get_user_notifications, get_notifications_count, mark_notifications_as_read,  order_files_view, download_order_file, CreateCalculationViewSet, get_dealer_addresses, wds_codes_by_contractor, get_messages, download_calculation_file, confirm_order, DeleteCalculationView, mark_single_notification_as_read, get_calc_files, download_calc, send_support_notification_to_telegram, telegram_webhook
from .views import ProductionStatisticsView, DealerDetailedStatisticsView, DealerFullAnalyticsView, OrdersDealerStatisticsView, PartnerDebtsView


from django.urls import path
from .views import PortalManagerReportView


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
    path("order/<str:order_guid>/files/", order_files_view), 
    path("order/<str:order_guid>/files/<str:file_guid>/download/", download_order_file, name="download_order_file"), #log stopped here
    path("calculations/create/", create_calculation),
    path("dealer-addresses/", get_dealer_addresses, name="get_dealer_addresses"), 
    path("get_wds_codes/", wds_codes_by_contractor, name="get_wds_codes"), 
    path("messages/", get_messages, name="get-messages"),
    path("calculations/<str:calc_guid>/files/<str:file_guid>/download/", download_calculation_file, name="download_calculation_file"),
    path('orders/<uuid:order_id>/confirm/', confirm_order, name='confirm-order'),  # +- log
    path("calculations/<uuid:calculation_guid>/delete/", DeleteCalculationView.as_view(),name="delete-calculation",),
    path("production-statistics/", ProductionStatisticsView.as_view()), #without log
    path("kpi-statistics/", DealerDetailedStatisticsView.as_view()),#without log
    path("full-statistics/", DealerFullAnalyticsView.as_view()),#without log
    path("order-statistics/", OrdersDealerStatisticsView.as_view()),#without log
    path('partner-debts/', PartnerDebtsView.as_view(), name='partner-debts'),
    path('notifications/', get_user_notifications, name='user-notifications'),
    path('notifications/count/', get_notifications_count, name='notifications-count'),
    path('notifications/mark-read/', mark_notifications_as_read, name='notifications-mark-read'),
    path('notifications/<int:pk>/mark-read/', views.mark_single_notification_as_read, name='single-notification-mark-read'),
    path('portal-managers/', PortalManagerReportView.as_view(), name='portal-managers-report'),
    path('orders/<uuid:order_guid>/files/', get_calc_files, name='get_calc_files'),
    
    path('orders/<uuid:order_guid>/files/<uuid:file_guid>/download_calc/', download_calc, name='download_calc'),
    path(
        "support/telegram/send/",
        send_support_notification_to_telegram,
        name="send_support_notification_to_telegram"
    ),
    path("telegram/webhook/", telegram_webhook),
]

