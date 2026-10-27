from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from .measurement_orders import MeasurementOrderViewSet
from .measurement_auth import CustomUser
from .views import CreateCalculationViewSet


@override_settings(MEASUREMENT_API_KEY='test-key', ONE_C_USER='u', ONE_C_PASSWORD='p',
    ONE_C_URL='https://test.invalid/', PORTAL_ERROR_TELEGRAM_BOT_TOKEN='test-bot',
    PORTAL_ERROR_TELEGRAM_CHAT_ID='716230412',
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache', 'LOCATION': 'measurement-alert-tests'}})
class MeasurementFailureAlertTests(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.user = SimpleNamespace(pk=78, is_authenticated=True, is_active=True,
                                    role='dealer', expire_date=None, user_id_1C=b'1'*16)
        self.query_patcher = patch('records.measurement_auth.CustomUser.objects.get', return_value=self.user)
        self.query = self.query_patcher.start(); self.addCleanup(self.query_patcher.stop)
        self.alert_patcher = patch('records.measurement_alerts.enqueue_alert')
        self.alert = self.alert_patcher.start(); self.addCleanup(self.alert_patcher.stop)

    def call(self, data=None, key='test-key', upstream=None):
        request = APIRequestFactory().post('/api/integrations/measurement/orders/',
            data if data is not None else {'user_id': 78, 'order_number': 'zamir-8'},
            format='json', HTTP_X_API_KEY=key, HTTP_IDEMPOTENCY_KEY='f0756ecb-afb8-4112-8bbb-c5ac2344d6cb')
        with patch.object(CreateCalculationViewSet, 'create', return_value=upstream or Response({'error': 'upstream error'}, status=502)) as create:
            response = MeasurementOrderViewSet.as_view({'post': 'create'})(request)
        return response, create

    def text(self):
        return self.alert.call_args.args[0]

    def test_non_dealer_is_rejected_and_reported_before_create(self):
        self.user.role = 'manager'
        response, create = self.call()
        self.assertEqual(response.status_code, 403)
        self.assertIn('Ви не дилер', self.text())
        self.assertIn('78', self.text()); self.assertIn('zamir-8', self.text())
        create.assert_not_called()

    def test_dealer_without_contractor_is_reported(self):
        self.user.user_id_1C = None
        response, create = self.call()
        self.assertEqual(response.status_code, 403)
        self.assertIn('UserId1C', self.text()); create.assert_not_called()

    def test_missing_user_id_is_reported(self):
        response, create = self.call({'order_number': 'zamir-8'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('Не передано коректний ID', self.text())
        create.assert_not_called()

    def test_nonexistent_user_is_reported(self):
        self.query.side_effect = CustomUser.DoesNotExist
        response, create = self.call()
        self.assertEqual(response.status_code, 403)
        self.assertIn('не знайдено', self.text()); create.assert_not_called()

    def test_expired_access_is_reported(self):
        self.user.expire_date = timezone.now() - timedelta(seconds=1)
        response, create = self.call()
        self.assertEqual(response.status_code, 403)
        self.assertIn('Термін доступу', self.text()); create.assert_not_called()

    def test_invalid_key_is_reported_without_reading_untrusted_identifiers(self):
        response, create = self.call({'user_id': 999999, 'order_number': 'secret-order'}, key='secret-key')
        self.assertEqual(response.status_code, 401)
        self.assertIn('ключ', self.text())
        self.assertNotIn('secret', self.text()); self.assertNotIn('999999', self.text())
        create.assert_not_called()

    def test_upstream_failure_is_reported_without_response_secrets(self):
        response, create = self.call(upstream=Response({'error': 'SQL password=secret'}, status=502))
        self.assertEqual(response.status_code, 502)
        self.assertIn('HTTP: 502', self.text()); self.assertNotIn('secret', self.text())

    def test_same_failure_is_grouped_for_five_minutes(self):
        self.user.role = 'manager'
        self.call(); self.call()
        self.alert.assert_called_once()

    def test_notification_exception_cannot_change_original_response(self):
        self.alert.side_effect = RuntimeError('Bot unavailable')
        response, create = self.call()
        self.assertEqual(response.status_code, 502)

    def test_success_does_not_send_failure_alert(self):
        with patch('records.measurement_orders.record_measurement_notification'), \
             patch('records.measurement_orders.enqueue_alert'):
            response, create = self.call(upstream=Response({'success': True, 'calculation_guid': '8cd8d97c-d217-11f1-9cfa-4cd98f08e56d'}, status=201))
        self.assertEqual(response.status_code, 201)
        self.alert.assert_not_called()

    def test_invalid_json_is_reported_as_400_without_body(self):
        request = APIRequestFactory().post('/api/integrations/measurement/orders/',
            '{password=secret}', content_type='application/json', HTTP_X_API_KEY='test-key')
        response = MeasurementOrderViewSet.as_view({'post': 'create'})(request)
        self.assertEqual(response.status_code, 400)
        self.assertNotIn('secret', self.text())
