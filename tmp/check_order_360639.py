import os
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s, @DateFrom=%s, @DateTo=%s, @DealerGroup=NULL", [2, '2026-07-14', '2026-10-12'])
    columns = [column[0] for column in cursor.description]
    for row in cursor.fetchall():
        item = dict(zip(columns, row))
        if str(item.get('OrderNumber') or '').strip() == '01-360639':
            print(json.dumps({key: value for key, value in item.items() if any(token in key.lower() for token in ['date', 'stage', 'number', 'ready', 'delay', 'quantity'])}, default=str, ensure_ascii=False))
