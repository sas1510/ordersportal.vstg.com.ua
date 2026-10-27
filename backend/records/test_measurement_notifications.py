import uuid
import requests
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase, override_settings
from rest_framework.response import Response
from .measurement_notifications import send_measurement_order_notification, record_measurement_notification, COPY_CHAT_ID
from .measurement_orders import MeasurementOrderViewSet
from .views import CreateCalculationViewSet


@override_settings(BOT_TOKEN='test-token', TELEGRAM_BOT_TOKEN='', NOTIFICATION_TELEGRAM_BOT_TOKEN='')
class MeasurementNotificationTests(SimpleTestCase):
    def _mock_alerts(self):
        alert_patcher = patch('records.measurement_orders.enqueue_alert')
        alert_patcher.start()
        self.addCleanup(alert_patcher.stop)

    def setUp(self):
        self._mock_alerts()
        self.item = SimpleNamespace(pk=1, status='succeeded', calculation_guid=uuid.uuid4(), contractor_guid=uuid.uuid4(),
            payload={'dealer': '<dealer>', 'items_count': 2, 'order_number': 'zamir-1'}, save=MagicMock())
        self.item.response_body = {'success': True, '_measurement_telegram': {'status': 'pending', 'deliveries': {}, 'contractor_guid': str(self.item.contractor_guid), 'payload': self.item.payload}}
        for name in ['records.measurement_notifications.transaction.atomic', 'records.measurement_notifications.CalculationIdempotencyRecord.objects']:
            p=patch(name); self.addCleanup(p.stop); mock=p.start()
            if name.endswith('.objects'): self.objects=mock
        p=patch.dict('os.environ', {'NOTIFICATION_TELEGRAM_BOT_TOKEN': ''});p.start();self.addCleanup(p.stop)
        self.objects.select_for_update.return_value.filter.return_value.first.return_value=self.item
        self.objects.select_for_update.return_value.get.return_value=self.item

    @patch('records.measurement_notifications.requests.post')
    @patch('records.measurement_notifications.manager_telegram_id', return_value=111)
    def test_manager_and_copy_only_once_on_parallel_or_replayed_task(self, manager, post):
        post.return_value=SimpleNamespace(status_code=200,json=lambda:{'ok': True})
        self.assertEqual(send_measurement_order_notification.run(1),'sent')
        self.assertEqual([call.kwargs['json']['chat_id'] for call in post.call_args_list],[111,COPY_CHAT_ID])
        self.assertNotIn('parse_mode',post.call_args.kwargs['json'])
        self.assertEqual(send_measurement_order_notification.run(1),'already_processed')
        self.assertEqual(post.call_count,2)
        self.assertEqual(self.item.status, 'succeeded')
        self.assertTrue(self.item.response_body['success'])

    @patch('records.measurement_notifications.requests.post')
    @patch('records.measurement_notifications.manager_telegram_id', return_value=COPY_CHAT_ID)
    def test_copy_is_not_duplicated_if_manager_is_copy_recipient(self, manager, post):
        post.return_value=SimpleNamespace(status_code=200,json=lambda:{'ok': True})
        self.assertEqual(send_measurement_order_notification.run(1),'sent')
        post.assert_called_once()

    @patch('records.measurement_notifications.requests.post')
    @patch('records.measurement_notifications.manager_telegram_id', side_effect=RuntimeError('lookup failed'))
    def test_copy_is_sent_even_if_manager_lookup_fails(self, manager, post):
        post.return_value=SimpleNamespace(status_code=200,json=lambda:{'ok': True})
        self.assertEqual(send_measurement_order_notification.run(1),'partial')
        self.assertEqual(post.call_args.kwargs['json']['chat_id'],COPY_CHAT_ID)

    @patch('records.measurement_notifications.requests.post')
    @patch('records.measurement_notifications.manager_telegram_id', return_value=111)
    def test_manager_timeout_does_not_block_copy_and_is_not_resent(self, manager, post):
        post.side_effect=[requests.Timeout(),SimpleNamespace(status_code=200,json=lambda:{'ok':True})]
        self.assertEqual(send_measurement_order_notification.run(1),'partial')
        self.assertEqual(send_measurement_order_notification.run(1),'already_processed')
        self.assertEqual(post.call_count,2)

    @patch('records.measurement_notifications.transaction.on_commit')
    def test_replayed_success_uses_same_outbox_and_does_not_requeue_processed(self, commit):
        self.item.response_body['_measurement_telegram']['status']='sent'
        request=SimpleNamespace(user=SimpleNamespace(pk=78,user_id_1C=b'1'*16,full_name='dealer'),data={'items_count':2})
        key=uuid.uuid4()
        record_measurement_notification(request,self.item.calculation_guid,key)
        self.assertEqual(self.objects.select_for_update.return_value.filter.call_args.kwargs['idempotency_key'],key)
        commit.assert_not_called()

    @patch('records.measurement_notifications.requests.post')
    def test_normal_portal_calculation_without_measurement_marker_is_not_sent(self, post):
        self.item.response_body = {'success': True}
        self.assertEqual(send_measurement_order_notification.run(1), 'already_processed')
        post.assert_not_called()



@override_settings(ONE_C_URL='https://test.invalid/', ONE_C_USER='u',ONE_C_PASSWORD='p')
class MeasurementNotificationHookTests(SimpleTestCase):
    def setUp(self):
        self._mock_alerts()

    def _mock_alerts(self):
        alert_patcher = patch('records.measurement_orders.enqueue_alert')
        alert_patcher.start()
        self.addCleanup(alert_patcher.stop)

    def request(self):
        return SimpleNamespace(headers={'Idempotency-Key':str(uuid.uuid4())},user=SimpleNamespace(pk=78,user_id_1C=b'1'*16),data={'items_count':2})

    @patch('records.measurement_orders.record_measurement_notification')
    def test_only_successful_measurement_response_records_notification(self, record):
        with patch.object(CreateCalculationViewSet,'create',return_value=Response({'error':'1C unavailable'},status=502)):
            MeasurementOrderViewSet().create(self.request())
        record.assert_not_called()
        guid=str(uuid.uuid4())
        with patch.object(CreateCalculationViewSet,'create',return_value=Response({'success':True,'calculation_guid':guid},status=201)):
            response=MeasurementOrderViewSet().create(self.request())
        self.assertEqual(response.status_code,201)
        record.assert_called_once()

    @patch('records.measurement_orders.record_measurement_notification',side_effect=RuntimeError('outbox unavailable'))
    def test_notification_failure_does_not_fail_created_order(self, record):
        with patch.object(CreateCalculationViewSet,'create',return_value=Response({'success':True,'calculation_guid':str(uuid.uuid4())},status=201)):
            self.assertEqual(MeasurementOrderViewSet().create(self.request()).status_code,201)

