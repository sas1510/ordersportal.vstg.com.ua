from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from django.test import SimpleTestCase
from .notification_cleanup import cleanup_portal_notifications

class CleanupTests(SimpleTestCase):
    def test_only_expired_deliveries_and_read_automatic_reminders(self):
        now = datetime(2026, 10, 12, 12, tzinfo=timezone.utc)
        with patch("records.notification_cleanup.timezone.now", return_value=now), patch("records.notification_cleanup.DeliveryNotificationReceipt.objects") as deliveries, patch("records.notification_cleanup.ChatMessage.objects") as messages:
            deliveries.filter.return_value.delete.return_value = (2, {})
            messages.filter.return_value.filter.return_value.delete.return_value = (3, {})
            self.assertEqual(cleanup_portal_notifications.run(), {"deliveries": 2, "notifications": 3})
            deliveries.filter.assert_called_once_with(delivery_key__lt="2026-10-05T00:00")
            messages.filter.assert_called_once_with(is_notification=True, is_read=True, event_type="ORDER_STUCK_REMINDER")
            messages.filter.return_value.filter.assert_any_call(notification_read_at__lt=now - timedelta(days=7))
