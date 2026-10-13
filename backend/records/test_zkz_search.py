from django.test import SimpleTestCase
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
from rest_framework.test import APIRequestFactory, force_authenticate
from .zkz_search import number_variants, find_order_for_zkz

class ZkzSearchTests(SimpleTestCase):
    def test_exact_number_with_or_without_hyphen(self):
        self.assertEqual(number_variants("01363339"), ("01-363339", "01363339"))
        self.assertEqual(number_variants(" № 04-87501 "), ("04-87501", "0487501"))

    def test_partial_or_sql_input_rejected(self):
        for value in ("01-", "363339", "01-1", "01-363339' OR 1=1"):
            with self.assertRaises(ValueError):
                number_variants(value)

    def test_missing_order_searches_six_years(self):
        request = APIRequestFactory().get("/orders/zkz-search/", {"number": "04-87501"})
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role="admin"))
        cursor = MagicMock()
        cursor.fetchall.return_value = []
        with patch("records.zkz_search.connection") as connection, patch("records.zkz_search.timezone.localdate", return_value=date(2026, 10, 12)):
            connection.cursor.return_value.__enter__.return_value = cursor
            response = find_order_for_zkz(request)
        self.assertEqual(response.status_code, 404)
        parameters = cursor.execute.call_args.args[1]
        self.assertEqual(parameters[:4], ["04-87501", "0487501", date(2020, 10, 12), date(2026, 10, 13)])

    def test_inaccessible_order_not_returned(self):
        request = APIRequestFactory().get("/orders/zkz-search/", {"number": "04-87501"})
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role="dealer"))
        with patch("records.zkz_search.connection") as connection, patch("records.zkz_search.bin_to_guid_1c", return_value="order-guid"), patch("records.zkz_search.ensure_order_action_access", side_effect=PermissionError):
            connection.cursor.return_value.__enter__.return_value.fetchall.return_value = [(bytes(16), "04-87501")]
            response = find_order_for_zkz(request)
        self.assertEqual(response.status_code, 404)
