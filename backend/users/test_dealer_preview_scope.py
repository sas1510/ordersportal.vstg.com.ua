from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied
from users.dealer_preview import get_preview_dealer_rows, check_scope
from utils.BinToGuid1C import bin_to_guid_1c


class DealerPreviewScopeTests(SimpleTestCase):
    def test_dealer_cannot_enumerate_other_dealers(self):
        with self.assertRaises(PermissionDenied):
            get_preview_dealer_rows(SimpleNamespace(role="internal_dealer", id=12))

    def test_internal_dealers_are_merged_without_duplicates(self):
        guid = b"x" * 16
        cursor = MagicMock()
        cursor.description = [("ContractorID",), ("ContractorName",)]
        cursor.fetchall.return_value = [(guid, "Internal dealer")]
        with patch("users.dealer_preview.get_accessible_dealer_rows", return_value=[]), patch("users.dealer_preview.get_dealer_scope_requester_ids", return_value=[7,7]), patch("users.dealer_preview.connection") as db:
            db.cursor.return_value.__enter__.return_value = cursor
            rows = get_preview_dealer_rows(SimpleNamespace(role="region_manager", id=7))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["DealerRole"], "internal_dealer")
        self.assertEqual(cursor.execute.call_args.args[1], [7])
        self.assertEqual(cursor.execute.call_count, 1)
        self.assertIn("MP.МенеджерПокупателя = Requester.UserId1C", cursor.execute.call_args.args[0])

    def test_preview_cannot_start_outside_returned_portfolio(self):
        actor = SimpleNamespace(role="region_manager", id=7)
        with patch("users.dealer_preview.get_preview_dealer_rows", return_value=[{"ContractorID": b"x" * 16}]):
            check_scope(actor, bin_to_guid_1c(b"x" * 16))
            with self.assertRaises(PermissionDenied):
                check_scope(actor, bin_to_guid_1c(b"y" * 16))
