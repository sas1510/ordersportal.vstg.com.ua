from unittest.mock import patch
from django.test import SimpleTestCase
from .services.manager_service import manager_telegram_id


class ManagerNotificationLookupTests(SimpleTestCase):
    @patch('records.services.manager_service.connections')
    def test_measurement_lookup_keeps_manager_and_telegram_resolution(self, connections):
        cursor = connections.__getitem__.return_value.cursor.return_value.__enter__.return_value
        cursor.fetchone.side_effect = [(b'1' * 16,), (b'1' * 16, '123456')]
        self.assertEqual(manager_telegram_id('11111111-2222-4333-8444-555555555555'), 123456)
        self.assertEqual(cursor.execute.call_count, 2)

    @patch('records.services.manager_service.connections')
    def test_missing_manager_returns_none(self, connections):
        cursor = connections.__getitem__.return_value.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        self.assertIsNone(manager_telegram_id('11111111-2222-4333-8444-555555555555'))
        self.assertEqual(cursor.execute.call_count, 1)
