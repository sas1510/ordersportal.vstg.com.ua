import os
import sys
import re
import json
from decimal import Decimal
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection
from utils.GuidToBin1C import guid_to_1c_bin

contractor = bytes.fromhex(sys.argv[1].removeprefix('0x')) if len(sys.argv) > 1 else guid_to_1c_bin('9056e09d-a7a0-11ed-8142-74867ad9d525')
def output(label, value):
    print(label + ': ' + json.dumps(value, ensure_ascii=False, default=str), flush=True)
with connection.cursor() as cursor:
    cursor.execute('EXEC dbo.GetDealerAdvanceBalance_V3 @Контрагент=%s', [contractor])
    output('HEADER', dict(zip([col[0] for col in cursor.description], cursor.fetchone())))
    cursor.execute('EXEC dbo.GetDealerPaymentPageDataV2 @Contractor=%s', [contractor])
    columns = [col[0] for col in cursor.description]
    orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
    output('PAYMENT_COLUMNS', columns)
    output('PAYMENT_COUNT', len(orders))
    totals = {}
    seen = set()
    for row in orders:
        number = str(row.get('OrderNumber') or row.get('Number') or '').strip()
        key = row.get('OrderID_GUID') or row.get('OrderGUID') or row.get('OrderID') or number
        if number.startswith('34-') or key in seen:
            continue
        seen.add(key)
        debt = max(Decimal(0), Decimal(str(row.get('DebtAmount') or 0)))
        currency = row.get('CurrencyName') or row.get('Currency') or 'Unknown'
        totals[currency] = totals.get(currency, Decimal(0)) + debt
        if debt and len(sys.argv) == 1:
            output('PAYMENT_ORDER', {k: v for k, v in row.items() if any(s in k.lower() for s in ['number', 'debt', 'amount', 'sum', 'status', 'currency'])})
    output('PAYMENT_TOTAL', totals)
    cursor.execute("SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(N'dbo.GetDealerAdvanceBalance_V3')")
    definition = cursor.fetchone()[0]
    # Diagnostic copy: same temporary-table calculations, but return per-order
    # components instead of the final aggregate. No permanent data changes.
    batch = definition[definition.index('SET NOCOUNT ON;'):]
    batch = batch[:batch.index('-- 9.')]
    batch = re.sub(r'SELECT\s+@OrderDebt\s*=.*?FROM CalculatedDetails;', 'SELECT * FROM CalculatedDetails;', batch, flags=re.S)
    batch = batch.replace('IIF\n', 'IIF\n')
    batch = re.sub(r'(WITH CalculatedDetails AS\s*\(\s*SELECT)', r'\1 Z.OrderNumber, Z.OrderSum, PD.Summa AS SettlementBalance, AV.Summa AS AdvanceRegisterBalance, S.SummaRealization, R.RouteStatus,', batch, count=1)
    cursor.execute('DECLARE @Контрагент BINARY(16)=0x' + contractor.hex() + ';\n' + batch)
    while not cursor.description and cursor.nextset():
        pass
    columns = [col[0] for col in cursor.description]
    details = [dict(zip(columns, row)) for row in cursor.fetchall()]
    output('DETAIL_COLUMNS', columns)
    output('DETAIL_COUNT', len(details))
    if len(details) < 3:
        output('DETAIL_SAMPLE', details)
    total = Decimal(0)
    for row in details:
        debt = sum((Decimal(str(row.get(key) or 0)) for key in ['Debt', 'InWorkDebt', 'BezPeredOplaty']), Decimal(0))
        total += debt
        if debt and len(sys.argv) == 1:
            output('HEADER_ORDER', row)
    output('HEADER_DETAIL_TOTAL', total)
    by_number = {str(row['OrderNumber']).strip(): row for row in details}
    for order in orders:
        number = str(order['OrderNumber']).strip()
        row = by_number.get(number)
        header_debt = sum((Decimal(str(row.get(key) or 0)) for key in ['Debt', 'InWorkDebt', 'BezPeredOplaty']), Decimal(0)) if row else Decimal(0)
        page_debt = max(Decimal(0), Decimal(str(order.get('DebtAmount') or 0)))
        if page_debt != header_debt:
            output('DIFFERENCE', {'number': number, 'pageDebt': page_debt, 'headerDebt': header_debt, 'headerDetails': row})
