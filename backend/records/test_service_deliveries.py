from datetime import datetime
from unittest import TestCase
from unittest.mock import patch, MagicMock
from .service_deliveries import attach_service_deliveries

class ServiceDeliveryTests(TestCase):
    @patch("records.service_deliveries.connection")
    def test_empty_does_not_query(self, connection):
        rows = [{"ClaimOrderNumber": None}]
        self.assertIs(attach_service_deliveries(rows), rows)
        connection.cursor.assert_not_called()

    @patch("records.service_deliveries.connection")
    def test_scoped_posted_routes_and_unmatched(self, connection):
        cursor = MagicMock()
        connection.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchall.side_effect = [[(bytes.fromhex("9ceb4cd98f08e56d11f17090c0521afa"), "70-123", datetime(2026, 11, 17, 12))], [("70-123", 2, 100, "грн", "Подтверждено")]]
        rows = [{"ClaimOrderNumber": "70-123"}, {"ClaimOrderNumber": "71-456"}]
        attach_service_deliveries(rows)
        sql, params = cursor.execute.call_args_list[0].args
        self.assertIn("Z.Номер IN (%s,%s)", sql)
        self.assertIn("Z.Проведен = 0x01", sql)
        self.assertIn("Z.ПометкаУдаления = 0x00", sql)
        self.assertNotIn("Z.Номер LIKE", sql)
        self.assertEqual(params, ["70-123", "71-456", "1900-01-01"])
        self.assertEqual(rows[0]["PlannedDeliveryDateTime"], datetime(2026, 11, 17, 12))
        self.assertTrue(rows[0]["DeliveryOrderGuid"])
        self.assertIsNone(rows[1]["PlannedDeliveryDateTime"])

        self.assertEqual(rows[0]["DeliveryOrderCount"], 2)
