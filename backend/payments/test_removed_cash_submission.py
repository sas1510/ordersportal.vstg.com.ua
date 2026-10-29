from django.apps import apps
from django.db.migrations.loader import MigrationLoader
from django.test import SimpleTestCase
from django.urls import Resolver404, resolve
from backend.celery_app import app


class RemovedCashSubmissionTests(SimpleTestCase):
    def test_removed_endpoints_no_longer_resolve(self):
        for suffix in ['', 'routes/', 'reconcile/', 'export-pdf/', '1/photo/']:
            with self.subTest(suffix=suffix), self.assertRaises(Resolver404):
                resolve('/api/payments/funds-transfers/' + suffix)

    def test_normal_payment_and_cashflow_endpoints_remain(self):
        for suffix in ['get_payment_status_view/', 'get_dealer_payment_page_data/',
                       'create_invoice/', 'make_payment_from_advance/', 'export_payment_status_excel/']:
            with self.subTest(suffix=suffix):
                self.assertIsNotNone(resolve('/api/payments/' + suffix))

    def test_removed_model_is_not_registered(self):
        with self.assertRaises(LookupError):
            apps.get_model('payments', 'FundsTransferSubmission')

    def test_historical_migrations_still_load_and_latest_state_removes_model(self):
        state = MigrationLoader(None).project_state([('payments', '0006_remove_funds_transfer_submission')])
        self.assertNotIn(('payments', 'fundstransfersubmission'), state.models)

    def test_no_removed_periodic_jobs_are_configured(self):
        names = {value['task'] for value in app.conf.beat_schedule.values()}
        self.assertFalse(names & {'reconcile_funds_transfers', 'enqueue_pending_funds_transfer_notifications'})
