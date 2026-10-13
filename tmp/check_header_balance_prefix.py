import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(N'dbo.GetDealerAdvanceBalance_V3')")
    row = cursor.fetchone()
    definition = row[0] if row else ''
    import json
    print('SQL_JSON:' + json.dumps(definition))
