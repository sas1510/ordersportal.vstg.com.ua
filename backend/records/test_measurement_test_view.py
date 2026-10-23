from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.response import Response
from .measurement_test_view import MeasurementTestView


class MeasurementTestPageAccessTests(SimpleTestCase):
    def test_anonymous_denied(self):
        response = MeasurementTestView.as_view()(APIRequestFactory().get('/test/'))
        self.assertEqual(response.status_code, 401)

    def test_manager_denied(self):
        request = APIRequestFactory().post('/test/', {}, format='json')
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role='manager'))
        self.assertEqual(MeasurementTestView.as_view()(request).status_code, 403)

    @override_settings(MEASUREMENT_API_KEY='server-secret')
    def test_admin_config_does_not_expose_key(self):
        request = APIRequestFactory().get('/test/')
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role='admin'))
        response = MeasurementTestView.as_view()(request)
        self.assertTrue(response.data['configured'])
        self.assertNotIn('server-secret', str(response.data))

    @override_settings(MEASUREMENT_API_KEY='server-secret')
    def test_admin_submission_uses_server_key_and_shared_pipeline(self):
        request = APIRequestFactory().post('/test/', {'user_id': 78}, format='json', HTTP_IDEMPOTENCY_KEY='test-uuid')
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role='admin'))
        dealer = SimpleNamespace(pk=78)
        with patch('records.measurement_test_view.MeasurementApiKeyAuthentication.authenticate', return_value=(dealer, '1C_API_KEY')) as auth:
            with patch('records.measurement_test_view.MeasurementOrderViewSet.create', return_value=Response({'success': True}, status=201)) as create:
                response = MeasurementTestView.as_view()(request)
        self.assertEqual(response.status_code, 201)
        submitted = auth.call_args.args[0]
        self.assertEqual(submitted.headers['X-API-KEY'], 'server-secret')
        self.assertEqual(submitted.headers['Idempotency-Key'], 'test-uuid')
        self.assertEqual(create.call_args.args[0].user.pk, 78)
