import unittest
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from .services import agent


class OptionalOpenAITests(SimpleTestCase):
    @override_settings(OPENAI_API_KEY='')
    def test_missing_key_does_not_create_client(self):
        with patch.object(agent, 'OpenAI') as client:
            with self.assertRaises(agent.AIChatNotConfigured):
                agent.run_agent(None, '', [])
            client.assert_not_called()

    @override_settings(OPENAI_API_KEY='test-key')
    def test_configured_key_is_passed_to_client(self):
        with patch.object(agent, 'OpenAI', side_effect=RuntimeError('stop before network')) as client:
            with self.assertRaisesRegex(RuntimeError, 'stop before network'):
                agent.run_agent(None, '', [])
            client.assert_called_once_with(api_key='test-key')
