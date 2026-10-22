"""Restore the exact pre-readiness deployment snapshots at the user's request."""
import os
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection, transaction

names = ['GetOrdersMonthWithCalculations8', 'GetCalculationsWithOrdersByYearAndContractor7']
snapshots = []
for name in names:
    path = root / f'database/procedures/backups/{name}_before_full_readiness_20261021_164253.sql'
    source = path.read_text(encoding='utf-8')
    if 'Full readiness' in source:
        raise RuntimeError('Unexpected snapshot: ' + str(path))
    sql = re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE', 'ALTER PROCEDURE', source, count=1, flags=re.I)
    snapshots.append((name, sql))

with transaction.atomic():
    with connection.cursor() as cursor:
        for name, sql in snapshots:
            cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
            current = cursor.fetchone()[0]
            if not current or 'Full readiness' not in current:
                raise RuntimeError('Live state differs from expected last deployment; aborting: ' + name)
            cursor.execute(sql)
            cursor.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)', ['dbo.' + name])
            actual = cursor.fetchone()[0]
            def normalized(value):
                return re.sub(r'\s+', ' ', re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+', '', value, count=1, flags=re.I)).strip()
            if normalized(actual) != normalized(sql):
                raise RuntimeError('Restoration verification failed: ' + name)
            print('RESTORED AND VERIFIED', name, flush=True)
print('COMMITTED: both prior definitions restored; no business data changed.')
