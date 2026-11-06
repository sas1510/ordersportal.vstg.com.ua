from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase,override_settings
from rest_framework.response import Response
from .measurement_activity import report_measurement_attempt,report_measurement_success


@override_settings(PORTAL_ERROR_TELEGRAM_BOT_TOKEN='test',PORTAL_ERROR_TELEGRAM_CHAT_ID='716230412')
class MeasurementActivityTests(SimpleTestCase):
    def request(self):
        return SimpleNamespace(method='POST',user=SimpleNamespace(pk=7,full_name='SECRET_DEALER'),data={'order_number':'SECRET_ORDER','file':'SECRET_BASE64'})

    @patch('records.measurement_activity.enqueue_alert')
    def test_minimal_attempt_and_success_are_correlated_without_request_details(self,enqueue):
        request=self.request();report_measurement_attempt(request);report_measurement_attempt(request)
        self.assertEqual(enqueue.call_count,1)
        report_measurement_success(request,Response({'success':True,'calculation_guid':'SECRET_GUID'},status=201))
        self.assertEqual(enqueue.call_count,2)
        for call in enqueue.call_args_list:
            self.assertIn(request._measurement_attempt_id,call.args[0])
            self.assertNotIn('SECRET',call.args[0])
        self.assertIn('HTTP: 201',enqueue.call_args.args[0])

    @patch('records.measurement_activity.enqueue_alert')
    def test_failure_and_requests_without_attempt_do_not_emit_success(self,enqueue):
        request=self.request()
        report_measurement_success(request,Response({'success':True},status=201))
        report_measurement_attempt(request);enqueue.reset_mock()
        report_measurement_success(request,Response({'success':False},status=400))
        enqueue.assert_not_called()

    @patch('records.measurement_activity.enqueue_alert')
    @override_settings(PORTAL_ERROR_TELEGRAM_CHAT_ID='')
    def test_missing_configuration_does_not_block_request(self,enqueue):
        report_measurement_attempt(self.request());enqueue.assert_not_called()
