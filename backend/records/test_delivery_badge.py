from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .delivery_notifications import check_delivery_badge, read_delivery_badge

class DeliveryBadgeTests(SimpleTestCase):
    def setUp(self):
        self.enterContext(patch("records.delivery_notifications.timezone.now", return_value=datetime(2026, 11, 16, 10, tzinfo=timezone.utc)))
        self.user = SimpleNamespace(is_authenticated=True, id=1, role="admin")
        self.item = {"orderGuid": "cde510b7-0af5-11e3-99cd-002590633bb3", "delivery": "2026-11-17T12:00:00"}

    def call(self, view, data, user=None):
        request = APIRequestFactory().post("/badge/", data, format="json")
        force_authenticate(request, user=user or self.user)
        return view(request)

    @patch("records.delivery_notifications.DeliveryNotificationReceipt.objects")
    def test_unread_read_then_changed_date_and_user_isolation(self, receipts):
        stored = {}
        def create(**kwargs):
            key = (kwargs["user"].id, kwargs["order_guid"], kwargs["delivery_key"])
            if key not in stored:
                stored[key] = SimpleNamespace(pk=len(stored) + 1, shown_at=None)
            return stored[key], True
        receipts.get_or_create.side_effect = create
        self.assertEqual(self.call(check_delivery_badge, {"orders": [self.item, self.item]}).data["ids"], [1])
        stored[next(iter(stored))].shown_at = datetime.now(timezone.utc)
        self.assertEqual(self.call(check_delivery_badge, {"orders": [self.item]}).data["ids"], [])
        changed = {**self.item, "delivery": "2026-11-18T12:00:00"}
        self.assertEqual(self.call(check_delivery_badge, {"orders": [changed]}).data["ids"], [2])
        other = SimpleNamespace(is_authenticated=True, id=2, role="dealer")
        self.assertEqual(self.call(check_delivery_badge, {"orders": [self.item]}, other).data["ids"], [3])

    @patch("records.delivery_notifications.DeliveryNotificationReceipt.objects")
    def test_past_and_unassigned_not_unread_today_included(self, receipts):
        receipts.get_or_create.return_value = (SimpleNamespace(pk=7, shown_at=None), True)
        self.assertEqual(self.call(check_delivery_badge, {"orders": [{**self.item, "delivery": "2026-11-15T12:00:00"}, {**self.item, "delivery": None}]}).data["ids"], [])
        receipts.get_or_create.assert_not_called()
        self.assertEqual(self.call(check_delivery_badge, {"orders": [{**self.item, "delivery": "2026-11-16"}]}).data["ids"], [7])

    @patch("records.delivery_notifications.DeliveryNotificationReceipt.objects")
    def test_read_only_requested_receipts_for_current_user(self, receipts):
        receipts.filter.return_value.update.return_value = 1
        self.assertEqual(self.call(read_delivery_badge, {"ids": [9]}).data, {"marked": 1})
        receipts.filter.assert_called_once_with(user=self.user, pk__in=[9], shown_at__isnull=True)

    def test_invalid_payload_rejected(self):
        self.assertEqual(self.call(check_delivery_badge, {"orders": [{"orderGuid": "bad", "delivery": "2026-11-17"}]}).status_code, 400)
        self.assertEqual(self.call(read_delivery_badge, {"ids": [True]}).status_code, 400)
