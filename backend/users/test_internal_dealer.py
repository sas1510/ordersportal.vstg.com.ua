import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.authentication import JWTAuthentication

from .internal_dealer import PortalJWTAuthentication, enforce_internal_dealer_readonly


class InternalDealerAccessTests(SimpleTestCase):
    def setUp(self):
        self.user = SimpleNamespace(role="internal_dealer", user_id_1C=b"x" * 16)
        self.factory = APIRequestFactory()

    def test_business_mutations_are_denied(self):
        for method in ("post", "put", "patch", "delete"):
            request = getattr(self.factory, method)("/api/calculations/create/", {})
            with self.subTest(method=method), self.assertRaises(PermissionDenied):
                enforce_internal_dealer_readonly(request, self.user)

    def test_reads_and_logout_are_allowed(self):
        for request in (self.factory.get("/api/order/get_orders_info/"),
                        self.factory.post("/api/logout/")):
            enforce_internal_dealer_readonly(request, self.user)

    def test_regular_dealer_actions_are_unchanged(self):
        enforce_internal_dealer_readonly(
            self.factory.post("/api/calculations/create/", {}),
            SimpleNamespace(role="customer"),
        )

    def test_jwt_authentication_enforces_policy(self):
        request = self.factory.post("/api/calculations/create/", {})
        with patch.object(JWTAuthentication, "authenticate", return_value=(self.user, object())):
            with self.assertRaises(PermissionDenied):
                PortalJWTAuthentication().authenticate(request)

    def test_unowned_order_file_is_denied(self):
        request = self.factory.get("/api/order/11111111-1111-1111-1111-111111111111/files/")
        with patch("utils.contractor.ensure_order_action_access", side_effect=PermissionError):
            with self.assertRaises(PermissionDenied):
                enforce_internal_dealer_readonly(request, self.user)

    def test_websocket_cannot_send_messages(self):
        from chat.consumers.consumers import ChatConsumer
        consumer = SimpleNamespace(user=self.user, send_error=AsyncMock())
        asyncio.run(ChatConsumer.receive(consumer, '{"message":"must not be sent"}'))
        consumer.send_error.assert_awaited_once()

    def test_internal_orders_use_dedicated_procedure(self):
        from records.views import get_orders_by_period_and_contractor
        cursor = MagicMock()
        cursor.description = [("OrderID_GUID",)]
        cursor.fetchall.return_value = []
        with patch("records.views.get_maintenance_state", return_value={"enabled": False}), \
                patch("records.views.connection") as connection:
            connection.cursor.return_value.__enter__.return_value = cursor
            result = get_orders_by_period_and_contractor(
                "2026-11-01", "2026-11-05", b"x" * 16, internal_dealer=True,
            )
        self.assertEqual(result, [])
        sql, params = cursor.execute.call_args.args
        self.assertIn("GetInternalDealerOrdersByPeriod", sql)
        self.assertEqual(params[2], b"x" * 16)


    def test_client_order_number_groups_orders_at_top_level(self):
        from records.views import get_orders_by_period_and_contractor
        base = {
            "IsOrderOnly": True, "ClientOrderNumber": " CLIENT-125 ",
            "Currency": "EUR", "OrderStage": "Confirmed",
            "ContractorID": b"x" * 16, "ConstructionsCount": 2,
            "CalcConstructionsCount": 2, "OrderSum": 100, "PaidAmount": 0,
        }
        rows = [
            dict(base, CalcID_GUID="11111111-1111-1111-1111-111111111111",
                 OrderID_GUID="11111111-1111-1111-1111-111111111111", OrderNumber="70-10001"),
            dict(base, CalcID_GUID="22222222-2222-2222-2222-222222222222",
                 OrderID_GUID="22222222-2222-2222-2222-222222222222", OrderNumber="70-10002",
                 ConstructionsCount=3),
        ]
        columns = list(rows[0])
        cursor = MagicMock()
        cursor.description = [(column,) for column in columns]
        cursor.fetchall.return_value = [tuple(row[column] for column in columns) for row in rows]
        with patch("records.views.get_maintenance_state", return_value={"enabled": False}), \
                patch("records.views.connection") as connection, \
                patch("records.views.attach_34_order_bindings", side_effect=lambda cards: cards):
            connection.cursor.return_value.__enter__.return_value = cursor
            result = get_orders_by_period_and_contractor(
                "2026-11-01", "2026-11-05", b"x" * 16, internal_dealer=True,
            )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["number"], "CLIENT-125")
        self.assertEqual(result[0]["orderCountInCalc"], 2)
        self.assertEqual(result[0]["constructionsQTY"], 5)


    def test_edit_permission_allows_business_actions(self):
        self.user.internal_dealer_can_edit = True
        for method in ("post", "put", "patch", "delete"):
            request = getattr(self.factory, method)("/api/calculations/create/", {})
            enforce_internal_dealer_readonly(request, self.user)

    def test_edit_permission_does_not_bypass_document_ownership(self):
        self.user.internal_dealer_can_edit = True
        request = self.factory.delete("/api/calculations/11111111-1111-1111-1111-111111111111/delete/")
        with patch("users.dealer_preview.dealer_owns_document", return_value=False):
            with self.assertRaises(PermissionDenied):
                enforce_internal_dealer_readonly(request, self.user)
