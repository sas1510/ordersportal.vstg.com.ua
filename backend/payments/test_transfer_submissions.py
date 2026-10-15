from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIRequestFactory, force_authenticate
from django.utils import timezone
from .transfer_submissions import TransferInput, contractor_scope, transfer_submissions, transfer_photo, transfer_history_pdf, history_queryset

class TransferTests(SimpleTestCase):
    def photo(self):
        stream = BytesIO()
        Image.new('RGB', (3, 3), 'white').save(stream, format='PNG')
        return SimpleUploadedFile('user-file.jpg', stream.getvalue(), content_type='image/png')

    def test_valid_photo_and_positive_amount(self):
        data = TransferInput(data={'amount': '123.45', 'photo': self.photo()})
        self.assertTrue(data.is_valid(), data.errors)
        self.assertEqual(str(data.validated_data['amount']), '123.45')
        self.assertEqual(data.validated_data['photo'].name, 'photo.png')
        self.assertEqual(data.validated_data['currency'], 'UAH')

    def test_rejects_invalid_image_zero_and_missing_photo(self):
        for values in [{'amount': '0', 'photo': self.photo()}, {'amount': '10'}, {'amount': '10', 'photo': SimpleUploadedFile('x.png', b'not an image')}]:
            self.assertFalse(TransferInput(data=values).is_valid())

    def test_other_supported_currency_can_be_selected(self):
        data = TransferInput(data={'amount': '10', 'currency': 'EUR', 'photo': self.photo()})
        self.assertTrue(data.is_valid(), data.errors)
        self.assertEqual(data.validated_data['currency'], 'EUR')

    def test_dealer_without_finance_access_denied(self):
        request = SimpleNamespace(user=SimpleNamespace(role='customer', permit_finance_info=False))
        with self.assertRaises(PermissionDenied):
            contractor_scope(request)

    def test_manager_unauthorized_contractor_denied(self):
        request = SimpleNamespace(user=SimpleNamespace(role='manager'))
        with patch('payments.transfer_submissions.resolve_contractor', side_effect=PermissionError('No access')):
            with self.assertRaises(PermissionDenied):
                contractor_scope(request)

    def test_region_manager_authorized_contractor(self):
        request = SimpleNamespace(user=SimpleNamespace(role='region_manager'))
        guid = '9056e09d-a7a0-11ed-8142-74867ad9d525'
        with patch('payments.transfer_submissions.resolve_contractor', return_value=(bytes(16), guid)):
            self.assertEqual(contractor_scope(request), UUID(guid))

    def test_submission_saves_validated_data_in_authenticated_scope(self):
        user = SimpleNamespace(id=167, role='customer', is_authenticated=True, full_name='Test dealer', username='dealer')
        request = APIRequestFactory().post('/payments/funds-transfers/', {'amount': '50.25', 'photo': self.photo(), 'comment': 'Передано'}, format='multipart')
        force_authenticate(request, user=user)
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        item = SimpleNamespace(pk=1, contractor_guid=guid, author=user, amount='50.25', currency='UAH', comment='Передано', created_at=timezone.now())
        with patch('payments.transfer_submissions.contractor_scope', return_value=guid), patch('payments.transfer_submissions.FundsTransferSubmission.objects.create', return_value=item) as create, patch('payments.transfer_submissions.transaction.on_commit') as on_commit:
            response = transfer_submissions(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(create.call_args.kwargs['contractor_guid'], guid)
        self.assertEqual(create.call_args.kwargs['author'], user)
        self.assertEqual(response.data['amount'], '50.25')
        on_commit.assert_called_once()

    def test_backoffice_cannot_submit_even_via_direct_post(self):
        for role in ('admin', 'manager', 'region_manager', 'branch_manager', 'branches_director'):
            request = APIRequestFactory().post('/payments/funds-transfers/', {'amount': '10'}, format='multipart')
            force_authenticate(request, user=SimpleNamespace(role=role, is_authenticated=True))
            with patch('payments.transfer_submissions.FundsTransferSubmission.objects.create') as create:
                response = transfer_submissions(request)
            self.assertEqual(response.status_code, 403)
            create.assert_not_called()

    def test_photo_lookup_is_scoped_and_private(self):
        user = SimpleNamespace(is_authenticated=True)
        request = APIRequestFactory().get('/payments/funds-transfers/1/photo/')
        force_authenticate(request, user=user)
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        photo = SimpleNamespace(name='private/test.png', open=lambda mode: BytesIO(b'photo'))
        scoped_query = object()
        with patch('payments.transfer_submissions.history_queryset', return_value=(scoped_query, {})), patch('payments.transfer_submissions.get_object_or_404', return_value=SimpleNamespace(photo=photo)) as lookup:
            response = transfer_photo(request, 1)
        lookup.assert_called_once_with(scoped_query, pk=1)
        self.assertEqual(response['Cache-Control'], 'private, no-store')
        response.close()

    def test_pdf_exports_all_rows_in_authenticated_contractor_scope(self):
        user = SimpleNamespace(is_authenticated=True, full_name='Dealer', username='dealer')
        request = APIRequestFactory().get('/payments/funds-transfers/export-pdf/')
        force_authenticate(request, user=user)
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        item = SimpleNamespace(contractor_guid=guid, created_at=timezone.now(), amount='15.00', currency='UAH', comment='Comment', author=user)
        with patch('payments.transfer_submissions.contractor_scope', return_value=guid), patch('payments.transfer_submissions.FundsTransferSubmission.objects.filter') as query, patch('records.deliveries_pdf.deliveries_font_path', return_value='font'), patch('payments.transfer_pdf.build_transfer_history_pdf', return_value=b'%PDF-test') as build:
            query.return_value.select_related.return_value.order_by.return_value.__getitem__.return_value = [item]
            response = transfer_history_pdf(request)
        query.assert_called_once_with(contractor_guid=guid)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertEqual(build.call_args.args[0][0]['amount'], '15.00')

    def test_manager_all_history_only_contains_accessible_dealers(self):
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        request = SimpleNamespace(user=SimpleNamespace(role='manager'), GET={'contractor': '__ALL__', 'sort': 'oldest'})
        with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[{'ContractorID': str(guid), 'ContractorName': 'Dealer'}]), patch('payments.transfer_submissions.FundsTransferSubmission.objects.filter') as query:
            _, names = history_queryset(request)
        query.assert_called_once_with(contractor_guid__in=[guid])
        query.return_value.select_related.return_value.order_by.assert_called_once_with('created_at', 'pk')
        self.assertEqual(names[guid], 'Dealer')

    def test_history_does_not_allow_outside_manager_scope(self):
        request = SimpleNamespace(user=SimpleNamespace(role='region_manager'), GET={'contractor': '9056e09d-a7a0-11ed-8142-74867ad9d525'})
        with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[]), patch('payments.transfer_submissions.FundsTransferSubmission.objects.filter') as query:
            with self.assertRaises(PermissionDenied):
                history_queryset(request)
        query.assert_not_called()

    def test_admin_all_history_includes_dealers_missing_from_directory(self):
        request = SimpleNamespace(user=SimpleNamespace(role='admin'), GET={'contractor': '__ALL__'})
        with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[]), patch('payments.transfer_submissions.FundsTransferSubmission.objects') as objects:
            history_queryset(request)
        objects.all.assert_called_once_with()
        objects.filter.assert_not_called()

    def test_admin_may_select_historical_dealer(self):
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        request = SimpleNamespace(user=SimpleNamespace(role='admin'), GET={'contractor': str(guid)})
        with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[]), patch('payments.transfer_submissions.FundsTransferSubmission.objects.filter') as query:
            history_queryset(request)
        query.assert_called_once_with(contractor_guid=guid)

    def test_branch_leader_only_sees_own_dealers(self):
        guid = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
        for role in ['branch_manager', 'branches_director']:
            request = SimpleNamespace(user=SimpleNamespace(role=role), GET={'contractor': '__ALL__'})
            with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[{'ContractorID': str(guid), 'ContractorName': 'Branch dealer'}]), patch('payments.transfer_submissions.FundsTransferSubmission.objects.filter') as query:
                history_queryset(request)
            query.assert_called_once_with(contractor_guid__in=[guid])

    def test_branch_leader_cannot_select_another_dealer(self):
        for role in ['branch_manager', 'branches_director']:
            request = SimpleNamespace(user=SimpleNamespace(role=role), GET={'contractor': '9056e09d-a7a0-11ed-8142-74867ad9d525'})
            with patch('payments.transfer_submissions.get_accessible_dealer_rows', return_value=[]):
                with self.assertRaises(PermissionDenied):
                    history_queryset(request)
