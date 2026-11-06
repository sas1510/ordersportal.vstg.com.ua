from unittest.mock import patch,Mock
from django.test import SimpleTestCase,override_settings
from utils.portal_error_alerts import send_alert


@override_settings(PORTAL_ERROR_TELEGRAM_BOT_TOKEN='old-token',PORTAL_ERROR_TELEGRAM_CHAT_ID='716230412',NOTIFICATION_TELEGRAM_BOT_TOKEN='portal-token')
class PersonalAlertBotFallbackTests(SimpleTestCase):
    @patch('requests.post')
    def test_unauthorized_bot_falls_back_only_to_same_chat(self,post):
        post.side_effect=[Mock(status_code=401),Mock(status_code=200)]
        self.assertTrue(send_alert('Attempt TEST'))
        self.assertEqual(post.call_count,2)
        self.assertEqual(post.call_args_list[0].kwargs['json'],post.call_args_list[1].kwargs['json'])
        self.assertIn('portal-token',post.call_args_list[1].args[0])

    @patch('requests.post')
    def test_success_or_ambiguous_error_never_causes_duplicate_send(self,post):
        for status in (200,500):
            post.reset_mock();post.return_value=Mock(status_code=status)
            send_alert('Attempt TEST')
            self.assertEqual(post.call_count,1)
