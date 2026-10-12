from types import SimpleNamespace
from unittest.mock import patch
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from .portal_error_alerts import report_error, send_alert


@override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "portal-error-tests"}})
class ErrorAlertTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    @patch("utils.portal_error_alerts.enqueue_alert")
    def test_safe_payload_and_duplicate_suppression(self, enqueue):
        with self.settings(PORTAL_ERROR_TELEGRAM_BOT_TOKEN="secret", PORTAL_ERROR_TELEGRAM_CHAT_ID="716230412"):
            req = SimpleNamespace(path="/api/messages/", method="POST", user=SimpleNamespace(is_authenticated=True, pk=302), body=b"password=secret")
            first = report_error(req, (ValueError, ValueError("private token secret"), None))
            self.assertEqual(report_error(req), first)
            report_error(SimpleNamespace(path="/api/messages/", method="POST"), (ValueError, ValueError("secret"), None))
            enqueue.assert_called_once()
            payload = enqueue.call_args.args[0]
            self.assertIn(first, payload)
            self.assertNotIn("secret", payload)

    @patch("requests.post")
    def test_telegram_destination_and_timeout(self, post):
        post.return_value.status_code = 200
        with self.settings(PORTAL_ERROR_TELEGRAM_BOT_TOKEN="test", PORTAL_ERROR_TELEGRAM_CHAT_ID="716230412"):
            send_alert("Test")
        self.assertEqual(post.call_args.kwargs["json"]["chat_id"], "716230412")
        self.assertEqual(post.call_args.kwargs["timeout"], 5)
