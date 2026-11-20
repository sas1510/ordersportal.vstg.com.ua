from datetime import datetime
from decimal import Decimal
from unittest import TestCase
from unittest.mock import MagicMock, patch
from .complaint_compensation import attach_complaint_compensation


class ComplaintCompensationTests(TestCase):
    @patch("records.complaint_compensation.connection")
    def test_only_scoped_complaints_receive_posted_corrections(self, connection):
        guid = bytes.fromhex("9CFB4CD98F08E56D11F1DF4F26F26982")
        other = bytes.fromhex("9CFB4CD98F08E56D11F1DF4F26F26983")
        date = datetime(2026, 11, 19, 14, 54, 54)
        cursor = MagicMock()
        connection.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchall.side_effect = [[(guid, Decimal("1000"), date)], [(guid, "Не відвантажено", "00614 ")]]
        rows = [{"ComplaintGuid": memoryview(guid)}, {"ComplaintGuid": other}, {"AdditionalOrderGuid": guid}]
        self.assertIs(attach_complaint_compensation(rows), rows)
        sql, params = cursor.execute.call_args_list[0].args
        self.assertEqual(params, [guid.hex().upper(), other.hex().upper()])
        self.assertIn("D.Проведен=0x01", sql)
        self.assertIn("D.ПометкаУдаления=0x00", sql)
        self.assertIn("CONVERT(binary(16), %s, 2)", sql)
        self.assertEqual(rows[0]["DebtCorrectionAmount"], Decimal("1000"))
        self.assertEqual(rows[0]["DebtCorrectionDate"], date)
        self.assertEqual(rows[0]["ComplaintReasonName"], "Не відвантажено")
        self.assertEqual(rows[0]["StatusName"], "Вирішено")
        self.assertNotIn("StatusName", rows[1])
        self.assertEqual(rows[1]["DebtCorrectionAmount"], 0)
        self.assertIsNone(rows[1]["DebtCorrectionDate"])
        self.assertNotIn("DebtCorrectionAmount", rows[2])

    @patch("records.complaint_compensation.connection")
    def test_no_complaint_ids_does_not_query(self, connection):
        rows = [{"ClaimOrderNumber": "70-38908"}]
        attach_complaint_compensation(rows)
        connection.cursor.assert_not_called()
