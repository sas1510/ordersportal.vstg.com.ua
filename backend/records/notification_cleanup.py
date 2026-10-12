import logging
from datetime import timedelta
from zoneinfo import ZoneInfo
from celery import shared_task
from django.utils import timezone
from .models import DeliveryNotificationReceipt, ChatMessage

logger = logging.getLogger(__name__)

@shared_task(name="cleanup_portal_notifications")
def cleanup_portal_notifications():
    now = timezone.now()
    oldest = now.astimezone(ZoneInfo("Europe/Kyiv")).date() - timedelta(days=7)
    deliveries, _ = DeliveryNotificationReceipt.objects.filter(delivery_key__lt=f"{oldest.isoformat()}T00:00").delete()
    automatic = ChatMessage.objects.filter(is_notification=True, is_read=True, event_type="ORDER_STUCK_REMINDER")
    automatic.filter(notification_read_at__isnull=True).update(notification_read_at=now)
    notifications, _ = automatic.filter(notification_read_at__lt=now - timedelta(days=7)).delete()
    logger.info("Portal notification cleanup: deliveries=%s automatic=%s", deliveries, notifications)
    return {"deliveries": deliveries, "notifications": notifications}
