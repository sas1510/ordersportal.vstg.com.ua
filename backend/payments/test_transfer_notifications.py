from contextlib import nullcontext
import os
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import UUID
import requests
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from .transfer_notifications import send_transfer_notification, queue_transfer_notification, manager_telegram_id

@override_settings(TELEGRAM_BOT_TOKEN='test-token', FRONTEND_URL='https://portal.example/', FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID='')
@patch.dict(os.environ, {'NOTIFICATION_TELEGRAM_BOT_TOKEN': 'notification-test-token'})
class TransferNotificationTests(SimpleTestCase):
    def item(self):
        return SimpleNamespace(pk=7, contractor_guid=UUID('9056e09d-a7a0-11ed-8142-74867ad9d525'), manager_notification_status='pending', manager_notified_at=None, amount=Decimal('15115.00'), currency='UAH', comment='Передано водію', created_at=timezone.now(), author=SimpleNamespace(full_name='Тестовий дилер', username='dealer'), save=Mock())

    def run_send(self, item, chat=123, response=None, error=None):
        with patch('payments.transfer_notifications.transaction.atomic', return_value=nullcontext()), patch('payments.transfer_notifications.FundsTransferSubmission.objects.select_for_update') as query, patch('payments.transfer_notifications.manager_telegram_id', return_value=chat) as lookup, patch('payments.transfer_notifications.requests.post', return_value=response, side_effect=error) as post:
            query.return_value.select_related.return_value.filter.return_value.first.return_value = item
            result = send_transfer_notification(7)
        return result, post, lookup

    def test_sends_amount_dealer_comment_and_history_link(self):
        item = self.item()
        result, post, _ = self.run_send(item, response=SimpleNamespace(status_code=200, json=lambda: {'ok': True}))
        self.assertEqual(result, 'sent')
        payload = post.call_args.kwargs['json']
        self.assertEqual(post.call_args.args[0], 'https://api.telegram.org/botnotification-test-token/sendMessage')
        self.assertEqual(payload['chat_id'], 123)
        self.assertIn('15 115,00 грн', payload['text'])
        self.assertIn('Тестовий дилер', payload['text'])
        self.assertIn('Передано водію', payload['text'])
        self.assertIn('contractor=9056e09d', payload['reply_markup']['inline_keyboard'][0][0]['url'])
        self.assertIsNotNone(item.manager_notified_at)

    def test_processed_submission_not_sent_twice(self):
        item = self.item(); item.manager_notification_status = 'sent'
        result, post, lookup = self.run_send(item)
        self.assertEqual(result, 'already_processed')
        post.assert_not_called(); lookup.assert_not_called()

    def test_no_manager_telegram_skips_without_sending_elsewhere(self):
        item = self.item()
        result, post, _ = self.run_send(item, chat=None)
        self.assertEqual(result, 'skipped'); post.assert_not_called()

    def test_timeout_records_failure_without_retrying(self):
        item = self.item()
        result, post, _ = self.run_send(item, error=requests.Timeout())
        self.assertEqual(result, 'failed')
        self.assertEqual(post.call_count, 1)
        self.assertIsNone(item.manager_notified_at)

    def test_telegram_rejection_logs_reason_without_bot_token(self):
        response = SimpleNamespace(status_code=403, json=lambda: {
            'ok': False, 'error_code': 403, 'description': 'Forbidden: bot was blocked by the user',
        })
        with self.assertLogs('payments.transfer_notifications', level='WARNING') as logs:
            result, post, _ = self.run_send(self.item(), response=response)
        self.assertEqual(result, 'failed')
        self.assertEqual(post.call_count, 1)
        self.assertIn('bot was blocked', '\n'.join(logs.output))
        self.assertNotIn('test-token', '\n'.join(logs.output))

    def test_broker_failure_does_not_fail_submission(self):
        with patch('payments.tasks.notify_manager_of_funds_transfer.apply_async', side_effect=RuntimeError('offline')):
            queue_transfer_notification(7)

    def test_recipient_comes_from_dealer_manager(self):
        with patch('payments.transfer_notifications.connection') as connection:
            cursor = connection.cursor.return_value.__enter__.return_value
            cursor.fetchone.side_effect = [(bytes(16),), ('Manager', 123)]
            self.assertEqual(manager_telegram_id('9056e09d-a7a0-11ed-8142-74867ad9d525'), 123)
        self.assertIn('GetManagerByContractor', cursor.execute.call_args_list[0].args[0])
        self.assertIn('GetTelegramID', cursor.execute.call_args_list[1].args[0])

    @override_settings(FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID='716230412')
    def test_sends_to_manager_and_confirmed_copy_recipient(self):
        result, post, _ = self.run_send(self.item(), response=SimpleNamespace(status_code=200, json=lambda: {'ok': True}))
        self.assertEqual(result, 'sent')
        self.assertEqual([call.kwargs['json']['chat_id'] for call in post.call_args_list], [123, 716230412])

    @override_settings(FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID='716230412')
    def test_same_manager_and_copy_recipient_only_sent_once(self):
        result, post, _ = self.run_send(self.item(), chat=716230412, response=SimpleNamespace(status_code=200, json=lambda: {'ok': True}))
        self.assertEqual(result, 'sent')
        self.assertEqual(post.call_count, 1)

    @override_settings(FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID='716230412')
    def test_copy_sent_even_without_manager_telegram(self):
        result, post, _ = self.run_send(self.item(), chat=None, response=SimpleNamespace(status_code=200, json=lambda: {'ok': True}))
        self.assertEqual(result, 'sent')
        self.assertEqual(post.call_args.kwargs['json']['chat_id'], 716230412)

    @override_settings(FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID='716230412')
    def test_manager_failure_does_not_prevent_copy(self):
        item = self.item()
        result, post, _ = self.run_send(item, error=[requests.Timeout(), SimpleNamespace(status_code=200, json=lambda: {'ok': True})])
        self.assertEqual(result, 'partial')
        self.assertEqual(post.call_count, 2)
        self.assertIsNone(item.manager_notified_at)
