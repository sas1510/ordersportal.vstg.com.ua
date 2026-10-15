from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .deliveries_pdf import deliveries_pdf

class DeliveryPdfOptionsTests(SimpleTestCase):
    def request(self, include):
        request = APIRequestFactory().post('/deliveries-pdf/', {'include_amounts': include, 'rows': [{'day': '2026-10-14', 'number': '01-364152', 'count': 1}]}, format='json')
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))
        return request

    def test_disabled_option_reaches_generator(self):
        with patch('records.deliveries_pdf.build_deliveries_pdf', return_value=b'%PDF') as build:
            response = deliveries_pdf(self.request(False))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(build.call_args.kwargs['include_amounts'])

    def test_rejects_non_boolean_option(self):
        with patch('records.deliveries_pdf.build_deliveries_pdf') as build:
            response = deliveries_pdf(self.request('false'))
        self.assertEqual(response.status_code, 400)
        build.assert_not_called()
