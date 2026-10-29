import io
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase
from openpyxl import load_workbook
from rest_framework.test import APIRequestFactory, force_authenticate
from .views import get_payment_status_view, export_payment_status_excel


class CashFlowV4Tests(SimpleTestCase):
    def setUp(self):
        self.sale = dict(Date=datetime(2026, 10, 23, 8, 54), DeltaRow=Decimal('-1441'),
            FlowDirection='Витрата', FinalDogovorName='Основний', DealType='Реалізація',
            DocumentType='Реалізація', DocumentNumber='sale-1', RealizationOrderNumbers='15-04162, 45-179234', CumSaldoStart=Decimal('130296'),
            CumSaldo=Decimal('128855'), OrderNumber=None, OrderAmount=None, OrderBalance=None,
            PaymentStatus=0, RealizationAmount=Decimal('1441'), DayOpeningSaldo=Decimal('130296'),
            DayClosingSaldo=Decimal('221465'))
        self.payment = dict(self.sale, FlowDirection='Прихід', DocumentType='ППВход',
            DealType='Оплата по заказу', DocumentNumber='payment-1', DeltaRow=Decimal('30876'),
            RealizationAmount=0, CumSaldoStart=Decimal('121642'), CumSaldo=Decimal('152518'))
        for name, value in [('finance_access_denied_response', None),
                            ('get_maintenance_json_response', None),
                            ('resolve_contractor', (b'1'*16, 'contractor'))]:
            p = patch('payments.views.'+name, return_value=value);p.start();self.addCleanup(p.stop)
        p = patch('payments.views.connection');self.connection=p.start();self.addCleanup(p.stop)
        self.cursor=self.connection.cursor.return_value.__enter__.return_value
        self.cols=list(self.sale)
        self.cursor.description=[(name,) for name in self.cols]
        self.rows=[tuple(data[col] for col in self.cols) for data in [self.sale,self.payment]]
        self.cursor.fetchall.return_value=self.rows
        self.cursor.fetchmany.side_effect=[self.rows, []]

    def request(self):
        req=APIRequestFactory().get('/api/payments/test/', {'date_from':'2026-10-23','date_to':'2026-10-23'})
        force_authenticate(req,user=SimpleNamespace(pk=1,is_authenticated=True,username='dealer',role='dealer'))
        return req

    def test_api_returns_sql_day_balances_and_realization_amount(self):
        import json
        response=get_payment_status_view(self.request())
        self.assertEqual(response.status_code,200)
        self.assertIn('GetDealerFullLedger_4',self.cursor.execute.call_args.args[0])
        values=json.loads(response.content)
        self.assertEqual(Decimal(str(values[0]['DayOpeningSaldo'])),Decimal('130296'))
        self.assertEqual(Decimal(str(values[0]['RealizationAmount'])),Decimal('1441'))

    def test_excel_realization_is_contract_expense_but_not_a_payment(self):
        response=export_payment_status_excel(self.request())
        self.assertEqual(response.status_code,200)
        values=list(load_workbook(io.BytesIO(response.content),read_only=True).active.values)
        headers=list(values[0]);sale=values[1];payment=values[2]
        self.assertEqual(sale[headers.index('У т. ч. реалізації')],1441)
        self.assertEqual(sale[headers.index('Розхід')],1441)
        self.assertIn(sale[headers.index('Оплата')],(None,''))
        self.assertEqual(payment[headers.index('Прихід')],30876)
        self.assertIn(sale[headers.index('Документ')],(None,''))
        self.assertEqual(sale[headers.index('№ зам.')],'15-04162, 45-179234')
