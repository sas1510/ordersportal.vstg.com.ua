import base64
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.response import Response

from .measurement_auth import MeasurementApiKeyAuthentication
from .measurement_serializers import MeasurementOrderSerializer
from .measurement_orders import MeasurementOrderViewSet
from .views import CreateCalculationViewSet


def payload():
    return {'user_id': 78, 'items_count': 2, 'file': {'fileName': 'measurement.pdf', 'fileDataB64': base64.b64encode(b'%PDF-1.4\n%%EOF').decode()}}


@override_settings(ONE_C_URL='https://production.invalid/hs/service/', ONE_C_USER='live-user', ONE_C_PASSWORD='live-pass')
class MeasurementOrderTests(SimpleTestCase):
    @override_settings(ONE_C_URL='https://production.invalid/hs/service/')
    def test_measurement_posts_to_configured_live_1c(self):
        upstream = SimpleNamespace(ok=True, text='{}', status_code=200, json=lambda: {'success': True})
        with patch('records.views.requests.post', return_value=upstream) as post:
            MeasurementOrderViewSet()._send_to_1c({'calculations': [{}]})
        self.assertEqual(post.call_args.args[0], 'https://production.invalid/hs/service/')
        self.assertEqual(post.call_args.kwargs['headers']['Query'], 'CreateCalculation')
        self.assertEqual(CreateCalculationViewSet().get_one_c_url(), 'https://production.invalid/hs/service/')

    def test_order_number_is_optional(self):
        for extra, expected in [({}, ''), ({'order_number': ''}, ''), ({'order_number': 'ZAMIR-125'}, 'ZAMIR-125')]:
            with self.subTest(extra=extra):
                serializer = MeasurementOrderSerializer(data={**payload(), **extra})
                self.assertTrue(serializer.is_valid(), serializer.errors)
                self.assertEqual(serializer.validated_data['order_number'], expected)

    def test_accepts_larger_pdf_and_photo(self):
        data = payload()
        data['file']['fileDataB64'] = base64.b64encode(b'%PDF-' + b'x' * (11 * 1024 * 1024)).decode()
        data['photos'] = [{'fileName': 'photo.jpg', 'fileDataB64': base64.b64encode(b'\xff\xd8\xff' + b'x' * (6 * 1024 * 1024)).decode()}]
        serializer = MeasurementOrderSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_pdf_above_twenty_mib_and_photo_above_ten(self):
        for kind, limit, prefix, name in [('file', 20, b'%PDF-', 'a.pdf'), ('photos', 10, b'\xff\xd8\xff', 'a.jpg')]:
            data = payload()
            attachment = {'fileName': name, 'fileDataB64': base64.b64encode(prefix + b'x' * (limit * 1024 * 1024)).decode()}
            data[kind] = attachment if kind == 'file' else [attachment]
            self.assertFalse(MeasurementOrderSerializer(data=data).is_valid())

    def test_minimal_pdf_without_photos(self):
        serializer = MeasurementOrderSerializer(data=payload())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['photos'], [])

    def test_rejects_invalid_files(self):
        for name, content in [('a.zkz', b'%PDF-1.4'), ('a.pdf', b'not a PDF')]:
            data = payload()
            data['file'] = {'fileName': name, 'fileDataB64': base64.b64encode(content).decode()}
            self.assertFalse(MeasurementOrderSerializer(data=data).is_valid())
        data['file']['fileDataB64'] = 'not base64!'
        self.assertFalse(MeasurementOrderSerializer(data=data).is_valid())

    def test_rejects_point_override_and_conflicting_delivery(self):
        for extra in [{'contractor_guid': str(uuid.uuid4())}, {'delivery_is_pickup': True, 'client_address': {'city': 'Test'}}]:
            self.assertFalse(MeasurementOrderSerializer(data={**payload(), **extra}).is_valid())

    @override_settings(MEASUREMENT_API_KEY='integration-test')
    def test_key_is_checked_before_user_lookup(self):
        request = SimpleNamespace(headers={'X-API-KEY': 'wrong'}, data={'user_id': 78})
        with patch('records.measurement_auth.CustomUser.objects.get') as lookup:
            with self.assertRaises(AuthenticationFailed):
                MeasurementApiKeyAuthentication().authenticate(request)
            lookup.assert_not_called()

    @override_settings(MEASUREMENT_API_KEY='')
    def test_unconfigured_integration_is_denied(self):
        with self.assertRaises(AuthenticationFailed):
            MeasurementApiKeyAuthentication().authenticate(SimpleNamespace(headers={'X-API-KEY': 'anything'}))

    @override_settings(MEASUREMENT_API_KEY='integration-test')
    def test_internal_id_selects_dealer(self):
        user = SimpleNamespace(pk=78, role='dealer', expire_date=None, user_id_1C=b'1' * 16)
        request = SimpleNamespace(headers={'X-API-KEY': 'integration-test'}, data={'user_id': 78})
        with patch('records.measurement_auth.CustomUser.objects.get', return_value=user) as lookup:
            self.assertEqual(MeasurementApiKeyAuthentication().authenticate(request), (user, '1C_API_KEY'))
            lookup.assert_called_once_with(pk=78, is_active=True)

    @override_settings(MEASUREMENT_API_KEY='integration-test')
    def test_staff_cannot_be_mistaken_for_a_contractor(self):
        request = SimpleNamespace(headers={'X-API-KEY': 'integration-test'}, data={'user_id': 78})
        user = SimpleNamespace(role='manager', expire_date=None, user_id_1C=b'1' * 16)
        with patch('records.measurement_auth.CustomUser.objects.get', return_value=user):
            with self.assertRaises(PermissionDenied):
                MeasurementApiKeyAuthentication().authenticate(request)

    def test_replay_key_is_required_and_scoped_to_user(self):
        view = MeasurementOrderViewSet()
        request = SimpleNamespace(headers={}, user=SimpleNamespace(pk=78))
        with self.assertRaises(ValidationError):
            view.get_idempotency_key(request)
        request.headers['Idempotency-Key'] = str(uuid.uuid4())
        first = view.get_idempotency_key(request)
        self.assertEqual(first, view.get_idempotency_key(request))
        request.user.pk = 79
        self.assertNotEqual(first, view.get_idempotency_key(request))

    def test_empty_address_is_supplied_to_1c(self):
        data = {'calculations': [{}]}
        with patch.object(CreateCalculationViewSet, '_send_to_1c', return_value={'success': True}) as send:
            MeasurementOrderViewSet()._send_to_1c(data)
        sent = send.call_args.args[0]['calculations'][0]
        self.assertEqual(sent['orders'], [])
        self.assertIsNone(sent['address']['addressGUID'])

    def test_success_response_excludes_base64_and_has_real_guid(self):
        request = SimpleNamespace(headers={'Idempotency-Key': str(uuid.uuid4())}, user=SimpleNamespace(pk=78, user_id_1C=b'1' * 16))
        upstream = Response({'success': True, 'calculation_guid': str(uuid.uuid4()), 'payload_sent_to_1c': {'file': 'base64'}, '_measurement_telegram': {'status': 'sent'}}, status=201)
        with patch.object(CreateCalculationViewSet, 'create', return_value=upstream), patch('records.measurement_orders.record_measurement_notification'):
            response = MeasurementOrderViewSet().create(request)
        self.assertEqual(response.data['portal_user_id'], 78)
        self.assertNotIn('payload_sent_to_1c', response.data)
        self.assertNotIn('_measurement_telegram', response.data)


    @override_settings(MEASUREMENT_ONE_C_USER='old-test-user', MEASUREMENT_ONE_C_PASSWORD='old-test-pass', ONE_C_USER='', ONE_C_PASSWORD='')
    def test_missing_live_credentials_never_fall_back_to_old_test(self):
        from .measurement_orders import MeasurementOneCNotConfigured
        with self.assertRaises(MeasurementOneCNotConfigured):
            MeasurementOrderViewSet().get_one_c_credentials()

    def test_live_credentials_are_used_in_authorization_header(self):
        upstream = SimpleNamespace(ok=True, text='{}', status_code=200, json=lambda: {'success': True})
        with patch('records.views.requests.post', return_value=upstream) as post:
            MeasurementOrderViewSet()._send_to_1c({'calculations': [{}]})
        self.assertEqual(post.call_args.kwargs['headers']['Authorization'], 'Basic ' + base64.b64encode(b'live-user:live-pass').decode())


    @override_settings(MEASUREMENT_API_KEY='integration-test')
    def test_all_staff_roles_are_forbidden_from_submitting_orders(self):
        for role in ['admin', 'manager', 'region_manager', 'branch_manager', 'branches_director', 'director']:
            user = SimpleNamespace(pk=123, role=role, expire_date=None, user_id_1C=b'1' * 16)
            request = SimpleNamespace(headers={'X-API-KEY': 'integration-test'}, data={'user_id': 123})
            with patch('records.measurement_auth.CustomUser.objects.get', return_value=user):
                with self.assertRaisesMessage(PermissionDenied, 'Ви не дилер. Створення заявки недоступне.'):
                    MeasurementApiKeyAuthentication().authenticate(request)


    def test_idempotency_results_are_isolated_by_destination(self):
        request = SimpleNamespace(headers={'Idempotency-Key': str(uuid.uuid4())}, user=SimpleNamespace(pk=78))
        with override_settings(ONE_C_URL='https://old-test.invalid/'):
            old_key = MeasurementOrderViewSet().get_idempotency_key(request)
        with override_settings(ONE_C_URL='https://live.invalid/'):
            self.assertNotEqual(old_key, MeasurementOrderViewSet().get_idempotency_key(request))
