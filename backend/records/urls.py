# api/urls.py

from django.urls import path
from . import views  # РџРµСЂРµРєРѕРЅР°Р№С‚РµСЃСЏ, С‰Рѕ С–РјРїРѕСЂС‚ РєРѕСЂРµРєС‚РЅРёР№
from .views import get_user_notifications, get_notifications_count, mark_notifications_as_read,  order_files_view, download_order_file, CreateCalculationViewSet, get_dealer_addresses, wds_codes_by_contractor, get_messages, download_calculation_file, confirm_order, DeleteCalculationView, mark_single_notification_as_read, get_calc_files, download_calc, send_support_notification_to_telegram, send_faq_expert_request, telegram_webhook, get_support_chat_history, get_support_chat_attachment, download_support_chat_attachment, support_large_video_upload, mark_support_chat_as_read, UpdateCalculationView, confirm_order_by_number, get_all_manager_list
from .views import ProductionStatisticsView, DealerDetailedStatisticsView, DealerFullAnalyticsView, OrdersDealerStatisticsView, PartnerDebtsView, ProductionTimelinessByContractorView, ProductionUnifiedAnalyticsView, PortalDealerComparisonAnalyticsView, PortalAccessibleDealerReportsView


from django.urls import path
from .views import PortalManagerReportView
from .announcement_views import announcements, announcement_detail, cancel_scheduled_announcement, active_announcements, announcement_receipt, announcement_receipts
from .telegram_bot_views import (
    telegram_bot_link, telegram_bot_menu, telegram_bot_orders, telegram_bot_order_details, telegram_bot_order_files, telegram_bot_order_file_download, telegram_bot_reclamations, telegram_bot_additional_orders,
    telegram_bot_daily_report, telegram_bot_daily_recipients, telegram_bot_confirm_order, telegram_bot_admin_key, telegram_bot_cash_flow, telegram_bot_additional_order_files,
)


create_calculation = CreateCalculationViewSet.as_view({
    "post": "create"
})


urlpatterns = [
    path("announcements/", announcements, name="announcements"),
    path("announcements/active/", active_announcements, name="active-announcements"),
    path("announcements/<int:pk>/", announcement_detail, name="announcement-detail"),
    path("announcements/<int:pk>/cancel/", cancel_scheduled_announcement, name="cancel-scheduled-announcement"),
    path("announcements/<int:pk>/receipt/", announcement_receipt, name="announcement-receipt"),
    path("announcements/<int:pk>/receipts/", announcement_receipts, name="announcement-receipts"),
    path('telegram-bot/admin/key/', telegram_bot_admin_key, name='telegram_bot_admin_key'),
    path('telegram-bot/link/', telegram_bot_link, name='telegram_bot_link'),
    path('telegram-bot/menu/', telegram_bot_menu, name='telegram_bot_menu'),
    path('telegram-bot/orders/', telegram_bot_orders, name='telegram_bot_orders'),
    path('telegram-bot/orders/details/', telegram_bot_order_details, name='telegram_bot_order_details'),
    path('telegram-bot/order-files/', telegram_bot_order_files, name='telegram_bot_order_files'),
    path('telegram-bot/order-files/download/', telegram_bot_order_file_download, name='telegram_bot_order_file_download'),
    path('telegram-bot/reclamations/', telegram_bot_reclamations, name='telegram_bot_reclamations'),
    path('telegram-bot/additional-orders/', telegram_bot_additional_orders, name='telegram_bot_additional_orders'),
    path('telegram-bot/additional-order-files/', telegram_bot_additional_order_files, name='telegram_bot_additional_order_files'),
    path('telegram-bot/daily-report/', telegram_bot_daily_report, name='telegram_bot_daily_report'),
    path('telegram-bot/cash-flow/', telegram_bot_cash_flow, name='telegram_bot_cash_flow'),
    path('telegram-bot/daily-recipients/', telegram_bot_daily_recipients, name='telegram_bot_daily_recipients'),
    path('telegram-bot/orders/confirm/', telegram_bot_confirm_order, name='telegram_bot_confirm_order'),
    # Р’РёР·РЅР°С‡Р°С”РјРѕ URL РґР»СЏ РІРёРєР»РёРєСѓ С„СѓРЅРєС†С–С— complaints_view
    path('complaints/get_reclamation_info/', views.complaints_view, name='reclamation_data'),
    path('order/get_orders_info/', views.api_get_orders, name='get_order_info'),
    path('additional_orders/get_additional_orders_info/', views.additional_orders_view, name='get_additional_orders_info'),
    path('additional_orders/get_additional_orders_info_all/', views.get_additional_orders_info_all, name='get_additional_orders_info_all'),
    path('complaints/get_reclamation_info_all/', views.complaints_view_all_by_month, name='get_reclamation_info_all'),
    path('order/get_orders_info_all/', views.orders_view_all_by_month, name='get_orders_info_all'),
    path("order/<str:order_guid>/files/", order_files_view),
    path("order/<str:order_guid>/files/<str:file_guid>/download/", download_order_file, name="download_order_file"), #log stopped here
    path("calculations/create/", create_calculation),
    path("calculations/<uuid:calculation_guid>/update/", UpdateCalculationView.as_view(), name="update_calculation"),
    path("dealer-addresses/", get_dealer_addresses, name="get_dealer_addresses"),
    path("get_wds_codes/", wds_codes_by_contractor, name="get_wds_codes"),
    path("messages/", get_messages, name="get-messages"),
    path("calculations/<str:calc_guid>/files/<str:file_guid>/download/", download_calculation_file, name="download_calculation_file"),
    path('orders/<uuid:order_id>/confirm/', confirm_order, name='confirm-order'),  # +- log
    path("calculations/<uuid:calculation_guid>/delete/", DeleteCalculationView.as_view(),name="delete-calculation",),
    path("production-statistics/", ProductionStatisticsView.as_view()), #without log
    path("production-timeliness/", ProductionTimelinessByContractorView.as_view()),
    path("production-unified-analytics/", ProductionUnifiedAnalyticsView.as_view()),
    path("dealer-portal-comparison/", PortalDealerComparisonAnalyticsView.as_view()),
    path("dealer-portal-reports/", PortalAccessibleDealerReportsView.as_view()),
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
    path(
        "orders/confirm-order-by-number/",
        confirm_order_by_number,
        name="confirm_order_by_number",
    ),
    path('orders/<uuid:order_guid>/files/<uuid:file_guid>/download_calc/', download_calc, name='download_calc'),
    path(
        "support/telegram/send/",
        send_support_notification_to_telegram,
        name="send_support_notification_to_telegram"
    ),
    path(
        "support/faq-expert/send/",
        send_faq_expert_request,
        name="send_faq_expert_request",
    ),
    path("telegram/webhook/", telegram_webhook),
      path(
        "support/chat/history/",
        get_support_chat_history,
        name="get_support_chat_history"
    ),
    path(
        "support/chat/attachment/<int:attachment_id>/",
        get_support_chat_attachment,
        name="get_support_chat_attachment"
    ),
    path(
        "support/chat/attachment/<int:attachment_id>/download/",
        download_support_chat_attachment,
        name="download_support_chat_attachment"
    ),
    path(
        "support/chat/large-video-upload/",
        support_large_video_upload,
        name="support_large_video_upload"
    ),
    path(
        "support/chat/mark-read/",
        mark_support_chat_as_read,
        name="mark_support_chat_as_read"
    ),
    path(
        "managers/",
        get_all_manager_list,
        name="get_all_manager_list"
    ),
]
