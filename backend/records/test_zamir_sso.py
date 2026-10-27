import base64
import hashlib
import hmac
import json
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import Mock, patch
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from .zamir_sso import ZamirTicketView, ZamirProfileView


@override_settings(MEASUREMENT_API_KEY='test-integration-key')
class ZamirTicketTests(SimpleTestCase):
    def user(self, **changes):
        return SimpleNamespace(**dict(dict(pk=78, is_authenticated=True, is_active=True,
            role='admin', expire_date=None, email='dealer@example.com', email_confirmed=True,
            full_name='Іван Петренко', username='dealer'), **changes))

    def ticket(self, user):
        request = APIRequestFactory().get('/api/zamir/ticket/?user_id=999')
        force_authenticate(request, user=user)
        return ZamirTicketView.as_view()(request)

    def test_signature_payload_expiry_and_no_cache(self):
        with patch('records.zamir_sso.time.time', return_value=1000):
            response = self.ticket(self.user())
        self.assertEqual(response.status_code, 200)
        data, signature = response.data['ticket'].split('.')
        self.assertNotIn('=', data)
        self.assertEqual(signature, hmac.new(b'test-integration-key', data.encode('ascii'), hashlib.sha256).hexdigest())
        decoded = json.loads(base64.urlsafe_b64decode(data + '=' * (-len(data) % 4)))
        self.assertEqual(decoded['user_id'], 78)
        self.assertEqual(decoded['email'], 'dealer@example.com')
        self.assertEqual(decoded['name'], 'Іван Петренко')
        self.assertEqual(decoded['exp'], 1060)
        self.assertTrue(decoded['nonce'])
        self.assertIn('no-store', response['Cache-Control'])

    def test_admin_ticket_uses_own_portal_id(self):
        response = self.ticket(self.user(pk=123, role='admin'))
        self.assertEqual(response.status_code, 200)
        data = response.data['ticket'].split('.')[0]
        decoded = json.loads(base64.urlsafe_b64decode(data + '=' * (-len(data) % 4)))
        self.assertEqual(decoded['user_id'], 123)

    def test_all_non_admin_roles_are_denied(self):
        for role in ['dealer', 'customer', 'manager', 'region_manager', 'regionalManager', 'branch_manager', 'branches_director', 'director']:
            with self.subTest(role=role):
                self.assertEqual(self.ticket(self.user(role=role)).status_code, 403)

    def test_nonce_is_unique(self):
        self.assertNotEqual(self.ticket(self.user()).data['ticket'], self.ticket(self.user()).data['ticket'])

    def test_inactive_expired_and_unknown_roles_are_denied(self):
        for changes in [dict(role='unknown'), dict(is_active=False), dict(expire_date=timezone.now() - timedelta(seconds=1))]:
            self.assertEqual(self.ticket(self.user(**changes)).status_code, 403)

    def test_email_required(self):
        for email in ['', 'broken']:
            self.assertEqual(self.ticket(self.user(email=email)).status_code, 400)

    @override_settings(MEASUREMENT_API_KEY='')
    def test_missing_key_disables_ticket(self):
        self.assertEqual(self.ticket(self.user()).status_code, 503)

    def test_api_key_cannot_replace_dealer_jwt(self):
        request = APIRequestFactory().get('/api/zamir/ticket/', HTTP_X_API_KEY='test-integration-key')
        self.assertEqual(ZamirTicketView.as_view()(request).status_code, 401)


class ZamirEmailProfileTests(ZamirTicketTests):
    def profile(self, user, data=None):
        factory = APIRequestFactory()
        request = factory.get('/api/zamir/profile/') if data is None else factory.post('/api/zamir/profile/', data, format='json')
        force_authenticate(request, user=user)
        return ZamirProfileView.as_view()(request)

    def test_empty_and_invalid_email_require_prompt(self):
        for email in ['', 'invalid']:
            response = self.profile(self.user(email=email))
            self.assertTrue(response.data['email_required'])
        self.assertFalse(self.profile(self.user()).data['email_required'])

    def test_email_saved_only_on_current_user_and_confirmed(self):
        user = self.user(email='', email_confirmed=True, save=Mock())
        with patch('records.zamir_sso.CustomUser.objects.filter') as query:
            query.return_value.exclude.return_value.exists.return_value = False
            response = self.profile(user, {'email': 'new@example.com', 'user_id': 999})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(user.pk, 78)
        self.assertEqual(user.email, 'new@example.com')
        self.assertTrue(user.email_confirmed)
        user.save.assert_called_once_with(update_fields=['email', 'email_confirmed'])

    def test_invalid_email_is_not_saved(self):
        user = self.user(save=Mock())
        self.assertEqual(self.profile(user, {'email': 'invalid'}).status_code, 400)
        user.save.assert_not_called()

    def test_email_already_used_is_rejected(self):
        user = self.user(save=Mock())
        with patch('records.zamir_sso.CustomUser.objects.filter') as query:
            query.return_value.exclude.return_value.exists.return_value = True
            response = self.profile(user, {'email': 'used@example.com'})
        self.assertEqual(response.status_code, 400)
        user.save.assert_not_called()

    def test_only_admin_can_check_or_update_zamir_email(self):
        self.assertEqual(self.profile(self.user(role='admin')).status_code, 200)
        for role in ['dealer', 'customer', 'manager', 'region_manager', 'branch_manager', 'branches_director', 'director']:
            user = self.user(role=role, save=Mock())
            self.assertEqual(self.profile(user).status_code, 403)
            self.assertEqual(self.profile(user, {'email': 'new@example.com'}).status_code, 403)
            user.save.assert_not_called()


    def test_unconfirmed_email_prompts_and_cannot_issue_ticket(self):
        user = self.user(email_confirmed=False)
        self.assertTrue(self.profile(user).data['email_required'])
        response = self.ticket(user)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['code'], 'email_required')

    def test_same_email_can_be_explicitly_confirmed(self):
        user = self.user(email_confirmed=False, save=Mock())
        with patch('records.zamir_sso.CustomUser.objects.filter') as query:
            query.return_value.exclude.return_value.exists.return_value = False
            response = self.profile(user, {'email': user.email})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.email_confirmed)
        user.save.assert_called_once_with(update_fields=['email', 'email_confirmed'])
        self.assertEqual(self.ticket(user).status_code, 200)
