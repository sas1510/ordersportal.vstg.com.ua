from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from io import BytesIO
from datetime import datetime

from django.test import SimpleTestCase
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate

from .customer_bill_items import customer_bill_items_view, goods_totals


class CustomerBillItemsTests(SimpleTestCase):
    def setUp(self):
        self.owner = bytes.fromhex("9B5A90B11C14DEB211F058083DC6E0BC")
        self.bill = "4bd2d9e6-cde8-11f1-9cfa-4cd98f08e56d"
        for name, result in (("resolve_contractor", (self.owner, "owner")),
                             ("finance_access_denied_response", None),
                             ("get_maintenance_json_response", None)):
            mock = patch("payments.customer_bill_items." + name, return_value=result)
            mock.start()
            self.addCleanup(mock.stop)
        mock = patch("payments.customer_bill_items.connection")
        self.connection = mock.start()
        self.addCleanup(mock.stop)
        self.cursor = self.connection.cursor.return_value.__enter__.return_value

    def request(self, params):
        request = APIRequestFactory().get("/api/payments/dealers/bill-items/", params)
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, role="dealer"))
        return request

    def test_stored_amounts_are_summed_without_recalculating_or_grouping_rows(self):
        items = [dict(Amount=Decimal("0.11"), VATAmount=Decimal("0.02"), Price="0.04", Quantity=3),
                 dict(Amount=Decimal("0.21"), VATAmount=Decimal("0.04"), Price="0.07", Quantity=3)]
        self.assertEqual(goods_totals(items), {"LineCount": 2, "GoodsAmount": "0.32", "VATAmount": "0.06"})

    def test_guessed_bill_of_another_contractor_returns_404(self):
        self.cursor.description = [("BillGuid",)]
        self.cursor.fetchall.return_value = []
        response = customer_bill_items_view(self.request({"bill": self.bill}))
        self.assertEqual(response.status_code, 404)
        self.cursor.execute.assert_called_once()
        sql, params = self.cursor.execute.call_args.args
        self.assertIn("d.Контрагент = %s AND d.Ссылка = %s", sql)
        self.assertEqual(params[0], self.owner)

    def test_pdf_download_does_not_bypass_invoice_ownership(self):
        self.cursor.description = [("BillGuid",)]
        self.cursor.fetchall.return_value = []
        response = customer_bill_items_view(self.request({"bill": self.bill, "download": "pdf"}))
        self.assertEqual(response.status_code, 404)
        self.cursor.execute.assert_called_once()

    def test_pdf_download_is_an_attachment_with_private_cache(self):
        self.cursor.description = [("BillNumber",), ("Amount",), ("VATAmount",)]
        self.cursor.fetchall.side_effect = [[("test", Decimal("1"), Decimal("0"))], [("test", Decimal("1"), Decimal("0"))]]
        with patch("payments.customer_bill_pdf.build_customer_bill_pdf", return_value=BytesIO(b"%PDF-test")):
            response = customer_bill_items_view(self.request({"bill": self.bill, "download": "pdf"}))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/pdf")
            self.assertIn("attachment", response["Content-Disposition"])
            self.assertEqual(response["Cache-Control"], "private, no-store")
            self.assertEqual(b"".join(response.streaming_content), b"%PDF-test")
            response.close()

    def test_multipage_pdf_contains_ukrainian_text_and_last_row(self):
        from pypdf import PdfReader
        from .customer_bill_pdf import build_customer_bill_pdf
        document = dict(BillNumber="ТЕСТ-21", Currency="EUR", BillDate=datetime(2026, 10, 22), IsPosted=1,
                        ContractorName="Контрагент <Тест> & партнери", Comment="Доставка <узгоджена> & перевірена\nДругий рядок", DocumentAmount=Decimal("100"), SumIncludesVAT=0)
        items = [dict(LineNumber=i, ItemName="Металопластикові вікна з комплектуючими", Characteristic="500 × 600", ProductionCharacteristic=f"Z01-{i}",
                      Quantity=Decimal("1"), Coefficient=Decimal("1"), Unit="шт", Price=Decimal("1"), ManualDiscountPercent=Decimal("0"),
                      AutoDiscountPercent=Decimal("0"), Amount=Decimal("1"), VATAmount=Decimal("0")) for i in range(1, 101)]
        reader = PdfReader(build_customer_bill_pdf(document, items, goods_totals(items)))
        self.assertGreater(len(reader.pages), 1)
        text = "\n".join(page.extract_text() for page in reader.pages)
        self.assertIn("Контрагент <Тест> & партнери", text)
        self.assertIn("Доставка <узгоджена> & перевірена", text)
        self.assertIn("Другий рядок", text)
        self.assertNotIn("1С", text)
        self.assertIn("Z01-100", text)
        self.assertIn("100,00 EUR", text)
        for page in reader.pages:
            self.assertIn("Номенклатура", page.extract_text())

    def test_detail_enforces_owner_in_both_header_and_items_queries(self):
        self.cursor.description = [("Amount",), ("VATAmount",)]
        self.cursor.fetchall.side_effect = [[(Decimal("0.32"), Decimal("0.06"))],
                                              [(Decimal("0.11"), Decimal("0.02")), (Decimal("0.21"), Decimal("0.04"))]]
        response = customer_bill_items_view(self.request({"bill": self.bill}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["totals"]["GoodsAmount"], "0.32")
        self.assertEqual(len(response.data["items"]), 2)
        for call in self.cursor.execute.call_args_list:
            self.assertIn("d.Контрагент = %s AND d.Ссылка = %s", call.args[0])
            self.assertEqual(call.args[1][0], self.owner)

    def test_finance_denial_stops_before_query(self):
        with patch("payments.customer_bill_items.finance_access_denied_response", return_value=Response(status=403)):
            response = customer_bill_items_view(self.request({"bill": self.bill}))
        self.assertEqual(response.status_code, 403)
        self.connection.cursor.assert_not_called()

    def test_reversed_period_is_rejected(self):
        response = customer_bill_items_view(self.request({"date_from": "2026-11-01", "date_to": "2026-10-01"}))
        self.assertEqual(response.status_code, 400)
        self.cursor.execute.assert_not_called()

    def test_list_is_scoped_and_paged_with_inclusive_end_date(self):
        self.cursor.fetchone.return_value = (51,)
        self.cursor.description = [("BillNumber",)]
        self.cursor.fetchall.return_value = [("invoice",)]
        response = customer_bill_items_view(self.request({"date_from": "2026-10-01", "date_to": "2026-10-31", "page": "2"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 51)
        sql, params = self.cursor.execute.call_args.args
        self.assertIn("d.Контрагент = %s", sql)
        self.assertIn("OFFSET %s ROWS FETCH NEXT 50 ROWS ONLY", sql)
        self.assertEqual(params[0], self.owner)
        self.assertEqual(params[2].isoformat(), "2026-11-01")
        self.assertEqual(params[3], 50)
