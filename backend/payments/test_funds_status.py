from decimal import Decimal
from uuid import UUID
from django.test import SimpleTestCase
from django.utils import timezone
from users.models import CustomUser
from .models import FundsTransferSubmission
from .transfer_submissions import serialize_submission, TransferInput


class FundsStatusTests(SimpleTestCase):
    def item(self):
        return FundsTransferSubmission(
            id=7, contractor_guid=UUID(int=1), amount=Decimal('100.00'),
            author=CustomUser(username='dealer', full_name='Дилер'), created_at=timezone.now(),
        )

    def test_new_submission_waits_for_reconciliation_independently_of_telegram(self):
        item = self.item()
        item.manager_notification_status = 'sent'
        data = serialize_submission(item)
        self.assertEqual(data['funds_status'], 'pending')
        self.assertEqual(data['funds_status_label'], 'Очікує надходження')
        self.assertIsNone(data['received_amount'])
        self.assertIsNone(data['funds_checked_at'])
        self.assertEqual(data['cash_receipts'], [])

    def test_partial_receipt_preserves_amount_and_document_references(self):
        item = self.item()
        item.funds_status = 'partial'
        item.received_amount = Decimal('50.00')
        item.funds_checked_at = timezone.now()
        item.cash_receipts = [{'guid': str(UUID(int=2)), 'number': 'ПКО0001'}]
        data = serialize_submission(item)
        self.assertEqual(data['received_amount'], '50.00')
        self.assertEqual(data['funds_status_label'], 'Частково отримано')
        self.assertEqual(data['cash_receipts'], item.cash_receipts)
        self.assertIsNotNone(data['funds_checked_at'])

    def test_dealer_input_does_not_accept_reconciliation_fields(self):
        fields = TransferInput().fields
        for name in ('funds_status', 'received_amount', 'funds_checked_at', 'cash_receipts'):
            self.assertNotIn(name, fields)
