"""User-authorized read-only data access grant; requires SQL administrative rights."""
import os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection, transaction

try:
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("""
            EXEC [oknastyle_biV2].sys.sp_executesql N'
                IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name=N''newportal'')
                    CREATE USER [newportal] FOR LOGIN [newportal];
                GRANT CONNECT TO [newportal];
                GRANT SELECT ON SCHEMA::[dbo] TO [newportal];
            ';
            """)
    print('GRANT COMMITTED',flush=True)
except Exception as exc:
    print('GRANT FAILED; transaction rolled back:',str(exc),flush=True)
    sys.exit(1)

with connection.cursor() as cursor:
    cursor.execute('EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID=%s',[302])
    count=0
    while True:
        if cursor.description: count+=len(cursor.fetchall())
        if not cursor.nextset(): break
    print('Dealer list verified:',count,'rows',flush=True)
