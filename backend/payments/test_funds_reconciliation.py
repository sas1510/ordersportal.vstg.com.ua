from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch, MagicMock

from django.test import SimpleTestCase
from .funds_reconciliation import allocate_receipts, normalize_currency, reconcile_submissions
from rest_framework.test import APIRequestFactory, force_authenticate
from .reconciliation_views import reconcile_transfer_history


def submission(pk=1, amount='100', currency='UAH', transfer_date=date(2026, 10, 20)):
    return SimpleNamespace(pk=pk, amount=Decimal(amount), currency=currency,
        transfer_date=transfer_date, created_at=datetime(2026, 10, 20, tzinfo=timezone.utc))


def receipt(guid='a', amount='100', currency='UAH', day='2026-10-20'):
    return {'guid': guid, 'number': 'ПК1', 'date': day, 'amount': amount, 'currency': currency}


class AllocationTests(SimpleTestCase):
    def test_exact(self):
        state = allocate_receipts([submission()], [receipt()])[1]
        self.assertEqual(state['status'], 'received')
        self.assertEqual(state['amount'], Decimal('100'))

    def test_partial_and_multiple_receipts(self):
        self.assertEqual(allocate_receipts([submission()], [receipt(amount='40')])[1]['status'], 'partial')
        self.assertEqual(allocate_receipts([submission()], [receipt(amount='40'), receipt('b', '60')])[1]['status'], 'received')

    def test_duplicate_receipt_is_not_counted_twice(self):
        self.assertEqual(allocate_receipts([submission()], [receipt(), receipt()])[1]['amount'], Decimal('100'))

    def test_two_submissions_share_receipt_once(self):
        states = allocate_receipts([submission(2), submission(1)], [receipt(amount='150')])
        self.assertEqual(states[1]['status'], 'received')
        self.assertEqual(states[2]['status'], 'partial')
        self.assertEqual(sum(s['amount'] for s in states.values()), Decimal('150'))

    def test_surplus_requires_review(self):
        self.assertEqual(allocate_receipts([submission()], [receipt(amount='120')])[1]['status'], 'mismatch')

    def test_wrong_currency_is_not_received(self):
        state = allocate_receipts([submission()], [receipt(currency='EUR')])[1]
        self.assertEqual(state['status'], 'mismatch')
        self.assertEqual(state['amount'], 0)

    def test_before_transfer_not_counted(self):
        self.assertEqual(allocate_receipts([submission()], [receipt(day='2026-10-19')])[1]['status'], 'pending')

    def test_missing_date_not_confirmed(self):
        self.assertEqual(allocate_receipts([submission(transfer_date=None)], [receipt()])[1]['status'], 'pending')

    def test_unposted_receipt_disappears_on_recheck(self):
        self.assertEqual(allocate_receipts([submission()], [])[1]['status'], 'pending')

    def test_zero_receipt_requires_review(self):
        self.assertEqual(allocate_receipts([submission()], [receipt(amount='0')])[1]['status'], 'mismatch')

    def test_currency_codes(self):
        for code, expected in [('980', 'UAH'), ('978', 'EUR'), ('840', 'USD')]:
            self.assertEqual(normalize_currency(code), expected)
        self.assertEqual(normalize_currency('unknown'), '')

    @patch('payments.funds_reconciliation.logger')
    @patch('payments.funds_reconciliation.transaction.atomic')
    @patch('payments.funds_reconciliation.FundsTransferSubmission')
    @patch('payments.funds_reconciliation.load_route_receipts', side_effect=RuntimeError('source unavailable'))
    def test_source_error_preserves_saved_snapshot(self, load, model, atomic, logger):
        row = submission()
        row.contractor_guid, row.routing_guid = 'dealer', 'route'
        row.funds_status, row.received_amount = 'received', Decimal('100')
        row.save = MagicMock()
        queryset = MagicMock()
        queryset.order_by.return_value.__getitem__.return_value = [row]
        model.objects.filter.return_value.select_for_update.return_value.order_by.return_value = [row]
        result = reconcile_submissions(queryset)
        self.assertEqual(result['errors'], 1)
        self.assertEqual(result['checked'], 0)
        row.save.assert_not_called()
        self.assertEqual(row.funds_status, 'received')


class ReconciliationAccessTests(SimpleTestCase):
    def test_dealer_cannot_start_reconciliation(self):
        request = APIRequestFactory().post('/api/payments/funds-transfers/reconcile/')
        force_authenticate(request, user=SimpleNamespace(role='dealer', is_authenticated=True))
        self.assertEqual(reconcile_transfer_history(request).status_code, 403)

    @patch('payments.reconciliation_views.reconcile_submissions')
    @patch('payments.reconciliation_views.history_queryset')
    def test_manager_uses_scoped_history(self, history, reconcile):
        scoped = MagicMock()
        history.return_value = (scoped, {})
        reconcile.return_value = {'checked': 1, 'errors': 0}
        request = APIRequestFactory().post('/api/payments/funds-transfers/reconcile/?contractor=dealer')
        force_authenticate(request, user=SimpleNamespace(role='manager', is_authenticated=True))
        response = reconcile_transfer_history(request)
        self.assertEqual(response.status_code, 200)
        reconcile.assert_called_once_with(scoped)


class HistoryReconciliationTests(SimpleTestCase):
    @patch('payments.transfer_submissions.serialize_submission')
    @patch('payments.funds_reconciliation.reconcile_submissions')
    @patch('payments.transfer_submissions.PageNumberPagination')
    @patch('payments.transfer_submissions.history_queryset')
    def test_history_reconciles_visible_page_and_returns_refreshed_data(self, history, paginator, reconcile, serialize):
        from rest_framework.response import Response
        from .transfer_submissions import transfer_submissions
        queryset = MagicMock()
        history.return_value = (queryset, {})
        old, refreshed = SimpleNamespace(pk=7), SimpleNamespace(pk=7, funds_status='received')
        paginator.return_value.paginate_queryset.return_value = [old]
        paginator.return_value.get_paginated_response.side_effect = lambda rows: Response({'results': rows})
        queryset.filter.return_value.__iter__.return_value = iter([refreshed])
        reconcile.return_value = {'errors': 0}
        serialize.side_effect = lambda row, names: {'status': row.funds_status}
        request = APIRequestFactory().get('/api/payments/funds-transfers/')
        force_authenticate(request, user=SimpleNamespace(role='dealer', is_authenticated=True))
        response = transfer_submissions(request)
        reconcile.assert_called_once_with(queryset.filter.return_value, max_groups=20)
        queryset.filter.assert_any_call(pk__in=[7])
        self.assertEqual(response.data['results'], [{'status': 'received'}])
        self.assertEqual(response.data['reconciliation_warning'], '')

    @patch('payments.funds_reconciliation.reconcile_submissions')
    @patch('payments.transfer_submissions.PageNumberPagination')
    @patch('payments.transfer_submissions.history_queryset')
    def test_empty_history_does_not_query_receipts(self, history, paginator, reconcile):
        from rest_framework.response import Response
        from .transfer_submissions import transfer_submissions
        history.return_value = (MagicMock(), {})
        paginator.return_value.paginate_queryset.return_value = []
        paginator.return_value.get_paginated_response.return_value = Response({'results': []})
        request = APIRequestFactory().get('/api/payments/funds-transfers/')
        force_authenticate(request, user=SimpleNamespace(role='manager', is_authenticated=True))
        self.assertEqual(transfer_submissions(request).status_code, 200)
        reconcile.assert_not_called()
