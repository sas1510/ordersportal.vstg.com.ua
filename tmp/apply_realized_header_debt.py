import os
import sys
import re
from pathlib import Path
from decimal import Decimal
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection, transaction
backup = (root / 'database/procedures/backups/GetDealerAdvanceBalance_V3_before_realized_debt_20261013.sql').read_text(encoding='utf-8')
def normalize(text):
    return re.sub(r'\s+', ' ', re.sub(r'^(CREATE|ALTER)\s+', '', text.strip(), flags=re.I)).strip()
with transaction.atomic():
    with connection.cursor() as cursor:
        cursor.execute("SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(N'dbo.GetDealerAdvanceBalance_V3')")
        original = cursor.fetchone()[0]
        if normalize(original) != normalize(backup):
            raise RuntimeError('Live procedure differs from saved backup. Nothing changed.')
        updated = original
        changes = [
            ('R.RouteStatus IS NOT NULL\n                AND PD.Summa > 0', '(R.RouteStatus IS NOT NULL OR ISNULL(S.SummaRealization, 0) > 0)\n                AND PD.Summa > 0'),
            ('WHEN R.RouteStatus IS NULL\n                     AND AV.Summa > 0', 'WHEN R.RouteStatus IS NULL\n                     AND ISNULL(S.SummaRealization, 0) <= 0\n                     AND AV.Summa > 0'),
            ('WHEN R.RouteStatus IS NULL\n                     AND AV.Summa IS NULL', 'WHEN R.RouteStatus IS NULL\n                     AND ISNULL(S.SummaRealization, 0) <= 0\n                     AND AV.Summa IS NULL'),
        ]
        updated = updated.replace('\r\n', '\n')
        for before, after in changes:
            if updated.count(before) != 1:
                raise RuntimeError('Unexpected SQL shape. Nothing changed.')
            updated = updated.replace(before, after)
        updated = re.sub(r'^\s*(CREATE|ALTER)\s+PROCEDURE', 'ALTER PROCEDURE', updated, count=1, flags=re.I)
        cursor.execute(updated)
        for contractor, expected in [('90F074867AD9D52411E73630E6E547EC', Decimal('1570489.37')), ('814274867AD9D52511EDA7A09056E09D', Decimal('19751.00'))]:
            cursor.execute('EXEC dbo.GetDealerAdvanceBalance_V3 @Контрагент=%s', [bytes.fromhex(contractor)])
            debt = Decimal(str(cursor.fetchone()[0]))
            if debt != expected:
                raise RuntimeError(f'Unexpected total {debt}; transaction rolled back.')
            print('Verified debt:', debt, flush=True)
print('Applied; permanent order/payment data unchanged.')
