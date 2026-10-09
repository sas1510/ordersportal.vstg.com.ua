from types import SimpleNamespace
from unittest.mock import patch
from pathlib import Path
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .deliveries_pdf import deliveries_pdf, deliveries_font_path, PdfFontError, construction_total


class DeliveriesPdfTests(SimpleTestCase):
    def call(self, data, authenticated=True):
        request = APIRequestFactory().post("/deliveries-pdf/", data, format="json")
        if authenticated:
            force_authenticate(request, user=SimpleNamespace(is_authenticated=True))
        return deliveries_pdf(request)

    def test_requires_login(self):
        self.assertIn(self.call({"rows": []}, False).status_code, (401, 403))

    def test_rejects_invalid_rows(self):
        for rows in ([], [None], [{"day": "invalid", "time": "10:00"}]):
            self.assertEqual(self.call({"rows": rows}).status_code, 400)
        for count in ("NaN", "abc", "-1", "1.5"):
            self.assertEqual(self.call({"rows": [{"day": "2026-10-10", "time": "10:00", "count": count}]}).status_code, 400)

    def test_construction_total(self):
        self.assertEqual(construction_total([{"count": "3"}, {"count": "8"}, {"count": ""}]), 11)

    def test_font_path_does_not_depend_on_base_dir_layout(self):
        from . import deliveries_pdf as module
        expected = Path(module.__file__).resolve().parents[2] / "frontend/public/assets/fonts/Manrope/Manrope-Regular.ttf"
        with self.settings(BASE_DIR=expected.parents[5]), patch.object(Path, "is_file", lambda path: path == expected):
            self.assertEqual(deliveries_font_path(), expected)

    @patch("records.deliveries_pdf.build_deliveries_pdf", side_effect=PdfFontError("Missing font"))
    def test_font_failure_is_readable_response(self, build):
        response = self.call({"rows": [{"day": "2026-10-10", "time": "10:00"}]})
        self.assertEqual(response.status_code, 503)
        self.assertIn("шрифт", response.data["error"])

    @patch("records.deliveries_pdf.build_deliveries_pdf", return_value=b"%PDF-test")
    def test_delivery_without_time_is_exported(self, build):
        response = self.call({"rows": [{"day": "2026-10-08", "time": "", "number": "01-361866", "count": 1}]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(build.call_args.args[0][0]["time"], "")

    @patch("records.deliveries_pdf.build_deliveries_pdf", return_value=b"%PDF-test")
    def test_exports_filtered_payload(self, build):
        response = self.call({"rows": [{"day": "2026-10-10", "time": "10:00", "number": "45-179571", "calculation": "000106948", "dealer": "Дилер", "count": 3}]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertEqual(build.call_args.args[0][0]["count"], "3")
        self.assertEqual(build.call_args.args[0][0]["calculation"], "000106948")
