"""Explicit deployment workflow: snapshot live definitions, patch only readiness, atomic apply."""
import os
import re
import sys
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection, transaction

names = ['GetOrdersMonthWithCalculations8', 'GetCalculationsWithOrdersByYearAndContractor7']
stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_dir = root / 'database/procedures/backups'
backup_dir.mkdir(exist_ok=True)
changes = []
with connection.cursor() as cursor:
    for name in names:
        cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
        original = cursor.fetchone()[0]
        if not original:
            raise RuntimeError('Missing definition: ' + name)
        backup_path = backup_dir / f'{name}_before_full_readiness_{stamp}.sql'
        with backup_path.open('x', encoding='utf-8', newline='') as stream:
            stream.write(original)
        print('BACKUP', backup_path, flush=True)
        local = (root / f'database/procedures/{name}.sql').read_text(encoding='utf-8')
        block = re.search(r'    -- (?:Full readiness)[\s\S]+?\n       \);', local)
        if not block:
            raise RuntimeError('Readiness validation block not found')
        candidate = original.replace('\r\n', '\n')
        if 'Full readiness' in candidate:
            raise RuntimeError('Already patched; aborting to prevent duplicate changes')
        candidate, count = re.subn(r'SUM\(OPP\._Fld10543\) AS ProducedTotal,', 'SUM(CASE WHEN OPP._Fld10548RRef = 0x99B8002590633BB311E177FF631F08AD THEN OPP._Fld10543 ELSE 0 END) AS ProducedTotal,', candidate)
        if count != 1:
            raise RuntimeError('Unexpected ProducedTotal shape')
        candidate, count = re.subn(r'AND OPP\._Fld10548RRef\s*=\s*0x99B8002590633BB311E177FF631F08AD', 'AND OPP._Fld10548RRef NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5, 0x99DC002590633BB311E22E3A03435ED0, 0xA7009E14FF7CCB2E424091FF00E66DDA)', candidate)
        if count != 1:
            raise RuntimeError('Unexpected production item filter')
        candidate, count = re.subn(r'(CREATE CLUSTERED INDEX\s+IX_ProdReports_OrderID\s+ON #ProdReports\(ЗаказРезерв\);)', lambda match: match[0] + '\n\n' + block[0], candidate)
        if count != 1:
            raise RuntimeError('Unexpected production index')
        candidate = re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE', 'ALTER PROCEDURE', candidate, count=1, flags=re.I)
        changes.append((name, original, candidate))
        print('PREPARED', name, flush=True)

if '--apply' not in sys.argv:
    print('Dry run only; no database changes.')
    sys.exit()

with transaction.atomic():
    with connection.cursor() as cursor:
        for name, original, candidate in changes:
            cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
            if cursor.fetchone()[0] != original:
                raise RuntimeError('Live definition changed; aborting')
            cursor.execute(candidate)
            print('ALTERED', name, flush=True)
        # Execute both procedures to catch runtime SQL errors before committing.
        cursor.execute('EXEC dbo.GetCalculationsWithOrdersByYearAndContractor7 @DateFrom=%s,@DateTo=%s,@Contractor_ID=%s', ['2026-10-12','2026-10-13',bytes.fromhex('00000000000000000000000000000000')])
        while cursor.nextset():
            pass
        cursor.execute('EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s,@DateFrom=%s,@DateTo=%s', [302,'2026-10-12','2026-10-13'])
        count = 0
        while True:
            if cursor.description:
                count += len(cursor.fetchall())
            if not cursor.nextset():
                break
        print('SMOKE TEST rows', count, flush=True)
print('COMMITTED both procedures; business data unchanged.', flush=True)
