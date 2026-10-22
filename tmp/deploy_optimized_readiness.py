"""User-authorized atomic deployment of the benchmarked readiness block only."""
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

stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
names = ['GetOrdersMonthWithCalculations8', 'GetCalculationsWithOrdersByYearAndContractor7']
changes = []

def normalize(sql):
    sql = re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+', '', sql, count=1, flags=re.I)
    return re.sub(r'\s+', ' ', sql).strip()

with connection.cursor() as cursor:
    for name in names:
        cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
        original = cursor.fetchone()[0]
        baseline = (root / f'database/procedures/backups/{name}_before_full_readiness_20261021_164253.sql').read_text(encoding='utf-8')
        if not original or normalize(original) != normalize(baseline):
            raise RuntimeError('Live definition differs from benchmark baseline: ' + name)
        backup = root / f'database/procedures/backups/{name}_before_optimized_readiness_{stamp}.sql'
        with backup.open('x', encoding='utf-8', newline='') as file:
            file.write(original)
        print('BACKUP', backup.name, flush=True)
        local = (root / f'database/procedures/{name}.sql').read_text(encoding='utf-8')
        marker = '    -- Full readiness, one indexed production read; cosmetic kits excluded.'
        start = local.index(marker)
        end = local.index('    DROP TABLE IF EXISTS #SalesDocs;', start)
        block = local[start:end]
        if 'IX_RequiredItems' not in block or 'IX_ProducedItems' not in block:
            raise RuntimeError('Missing benchmarked indexes')
        candidate = original.replace('\r\n', '\n')
        start = candidate.index('    DROP TABLE IF EXISTS #ProdReports;')
        end = candidate.index('    DROP TABLE IF EXISTS #SalesDocs;', start)
        candidate = candidate[:start] + block + candidate[end:]
        candidate = re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE', 'ALTER PROCEDURE', candidate, count=1, flags=re.I)
        changes.append((name, original, candidate))

with transaction.atomic():
    with connection.cursor() as cursor:
        for name, original, candidate in changes:
            cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
            if cursor.fetchone()[0] != original:
                raise RuntimeError('Concurrent definition change; aborting')
            cursor.execute(candidate)
            cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
            if normalize(cursor.fetchone()[0]) != normalize(candidate):
                raise RuntimeError('Definition verification failed: ' + name)
            print('APPLIED AND VERIFIED', name, flush=True)
        cursor.execute('EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s,@DateFrom=%s,@DateTo=%s', [302,'2026-10-01','2026-10-21'])
        count = 0
        while True:
            if cursor.description:
                count += len(cursor.fetchall())
            if not cursor.nextset():
                break
        print('SMOKE TEST', count, 'rows', flush=True)
print('COMMITTED both optimized procedures; no business data changed.', flush=True)
