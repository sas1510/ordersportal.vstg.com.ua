from django.test import SimpleTestCase
from datetime import datetime, timezone
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
from rest_framework.test import APIRequestFactory, force_authenticate
from .delivery_notifications import normalize_delivery, check_delivery_notifications, delivery_cutoff


class DeliveryNotificationTests(SimpleTestCase):
    def test_non_dealers_do_not_get_notifications_or_create_records(self):
        for role in ("admin", "manager", "region_manager", "branch_manager"):
            request = APIRequestFactory().post("/check/", {"orders": []}, format="json")
            force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role=role))
            with patch("records.delivery_notifications.DeliveryNotificationState.objects") as states:
                self.assertEqual(check_delivery_notifications(request).data, {"deliveries": []})
                states.get_or_create.assert_not_called()

    def setUp(self):
        self.enterContext(patch("records.delivery_notifications.timezone.now", return_value=datetime(2026, 10, 12, tzinfo=timezone.utc)))
        self.enterContext(self.settings(DELIVERY_NOTIFICATION_START_DATE="2026-10-12"))

    def test_configurable_cutoff_and_retention(self):
        with self.settings(DELIVERY_NOTIFICATION_START_DATE="2026-10-15"):
            self.assertEqual(delivery_cutoff().isoformat(), "2026-10-15")
        with self.settings(DELIVERY_NOTIFICATION_START_DATE="2026-09-01"):
            self.assertEqual(delivery_cutoff().isoformat(), "2026-10-05")

    def item(self, date):
        return {"orderGuid": "cde510b7-0af5-11e3-99cd-002590633bb3", "number": "01-363339", "delivery": date}

    def test_pre_cutoff_is_ignored(self):
        self.assertIsNone(normalize_delivery(self.item("2026-10-11T23:59:00")))

    def test_cutoff_included_and_seconds_do_not_duplicate(self):
        self.assertEqual(normalize_delivery(self.item("2026-10-12T10:00:12"))["delivery"], "2026-10-12T10:00")

    def test_timezone_converted_to_kyiv(self):
        self.assertEqual(normalize_delivery(self.item("2026-10-11T22:00:00Z"))["delivery"], "2026-10-12T01:00")

    def test_without_time_and_unassigned(self):
        self.assertEqual(normalize_delivery(self.item("2026-10-14"))["delivery"], "2026-10-14T00:00")
        self.assertEqual(normalize_delivery(self.item(None))["delivery"], "")

    def test_baseline_then_notify_only_once_and_notify_changed_date(self):
        state = SimpleNamespace(pk=1, initialized=False, save=MagicMock())
        seen = set()
        stored = {}
        with patch("records.delivery_notifications.transaction.atomic", side_effect=nullcontext), patch("records.delivery_notifications.DeliveryNotificationState.objects") as states, patch("records.delivery_notifications.DeliveryNotificationReceipt.objects") as receipts:
            states.get_or_create.return_value = (state, True)
            states.select_for_update.return_value.get.return_value = state
            def exists(**kwargs):
                return SimpleNamespace(exists=lambda: any(guid == kwargs["order_guid"] for guid, key in seen))
            def create(**kwargs):
                key = (kwargs["order_guid"], kwargs["delivery_key"])
                created = key not in seen
                seen.add(key)
                if created:
                    stored[key] = SimpleNamespace(pk=len(stored) + 1, notify=kwargs["defaults"]["notify"], shown_at=None)
                return stored[key], created
            receipts.filter.side_effect = exists
            receipts.get_or_create.side_effect = create
            def call(date):
                request = APIRequestFactory().post("/check/", {"orders": [self.item(date)]}, format="json")
                force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role="customer"))
                return check_delivery_notifications(request).data["deliveries"]
            self.assertEqual(call("2026-10-08"), [])
            self.assertEqual(len(stored), 0)
            self.assertEqual(call(None), [])
            self.assertEqual(len(stored), 0)
            self.assertEqual(len(call("2026-10-14")), 1)
            self.assertEqual(len(call("2026-10-14")), 1)  # Remains pending until actually shown.
            for receipt in stored.values():
                if receipt.notify:
                    receipt.shown_at = "confirmed"
            self.assertEqual(call("2026-10-14"), [])
            self.assertEqual(len(call("2026-10-15")), 1)
            # A previously unseen order with a date from cutoff must notify too.
            seen.clear()
            stored.clear()
            state.initialized = False
            self.assertEqual(len(call("2026-10-14")), 1)
            receipt = next(iter(stored.values()))
            receipt.notify = False
            receipt.save = MagicMock()
            self.assertEqual(len(call("2026-10-14")), 1)
            receipt.save.assert_called_once_with(update_fields=["notify"])
