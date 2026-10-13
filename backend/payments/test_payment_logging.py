import json
from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from .payment_logging import log_payment_refusal

class PaymentLoggingTests(SimpleTestCase):
    def test_refusal_contains_actor_order_amount_and_reason(self):
        with patch('payments.payment_logging.logger.warning') as warning:
            log_payment_refusal(user=SimpleNamespace(id=167, username='test'), contract='contract', payments=[{'order_id': 'order', 'amount': 11715}], amount=11715, reason='Відмова')
        record = json.loads(warning.call_args.args[0])
        self.assertEqual(record['user_id'], 167)
        self.assertEqual(record['payments'], [{'order_id': 'order', 'amount': '11715'}])
        self.assertEqual(record['reason'], 'Відмова')
        self.assertEqual(warning.call_args.kwargs['extra']['tags']['component'], 'payment_audit')
