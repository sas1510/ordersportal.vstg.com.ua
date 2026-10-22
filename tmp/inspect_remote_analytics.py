import os,sys,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
names=['GetDealerFullLedger_3','GetABCProductionTimelinessByContractorV2','GetABCProductionTimelinessByContractor','GetContractorUnifiedAnalyticsV2','GetContractorUnifiedAnalytics','GetPortalDealerComparisonAnalyticsV2','GetPortalDealerComparisonAnalytics']
with connection.cursor() as c:
    for name in names:
        c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
        row=c.fetchone()
        if not row: continue
        sql=row[0] or ''
        print(name,'FORCESEEK',sql.upper().count('FORCESEEK'),flush=True)
        c.execute('SELECT name,TYPE_NAME(user_type_id) FROM sys.parameters WHERE object_id=OBJECT_ID(%s) ORDER BY parameter_id',['dbo.'+name])
        print(c.fetchall(),flush=True)
