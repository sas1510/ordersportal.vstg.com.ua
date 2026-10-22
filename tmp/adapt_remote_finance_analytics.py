import os,sys,re,time
from pathlib import Path
from datetime import datetime
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection,transaction
from utils.BinToGuid1C import bin_to_guid_1c

names=['GetDealerFullLedger_3','GetContractorUnifiedAnalyticsV2','GetContractorUnifiedAnalytics','GetPortalDealerComparisonAnalyticsV2','GetPortalDealerComparisonAnalytics']
changes=[]
stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
with connection.cursor() as c:
    c.execute('EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID=%s',[302])
    fields=[x[0] for x in c.description]
    dealer=dict(zip(fields,c.fetchone()))
    contractor=bytes(dealer['ContractorID'])
    while c.nextset(): pass
    for name in names:
        c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
        row=c.fetchone()
        if not row or not row[0]: raise RuntimeError('Missing definition '+name)
        original=row[0]
        path=root/f'database/procedures/backups/{name}_before_remote_adapter_{stamp}.sql'
        with path.open('x',encoding='utf-8',newline='') as f:f.write(original)
        pattern=r'\bWITH\s*\(\s*(?:INDEX\s*\([^()]*\)\s*,?\s*|FORCESEEK\s*,?\s*|FORCESCAN\s*,?\s*)+\)'
        candidate,count=re.subn(pattern,'',original,flags=re.I)
        candidate=re.sub(r'OPTION\s*\(\s*FORCE\s+ORDER\s*,\s*LOOP\s+JOIN\s*,\s*RECOMPILE\s*\)','OPTION (RECOMPILE)',candidate,flags=re.I)
        candidate=re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROC(?:EDURE)?\b','ALTER PROCEDURE',candidate,count=1,flags=re.I)
        if re.search(r'\bFORCESEEK\b|\bFORCESCAN\b',candidate,flags=re.I):raise RuntimeError('Unrecognized hint form '+name)
        changes.append((name,original,candidate))
        print('BACKUP',path.name,'removed',count,'hints',flush=True)

with transaction.atomic():
    with connection.cursor() as c:
        c.cursor.timeout=45
        for name,original,candidate in changes:
            c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
            if c.fetchone()[0]!=original:raise RuntimeError('Concurrent change')
            c.execute(candidate)
        for name in ['GetDealerFullLedger_3','GetABCProductionTimelinessByContractorV2','GetContractorUnifiedAnalyticsV2','GetPortalDealerComparisonAnalyticsV2']:
            args=([contractor,'2026-10-01','2026-10-22'] if name in ['GetDealerFullLedger_3','GetABCProductionTimelinessByContractorV2'] else ['2026-10-01','2026-10-22',str(bin_to_guid_1c(contractor)) if 'Comparison' in name else contractor])
            started=time.perf_counter()
            c.execute('EXEC dbo.'+name+' %s,%s,%s',args)
            rows=0
            while True:
                if c.description:rows+=len(c.fetchall())
                if not c.nextset():break
            print('VERIFIED',name,rows,'rows',round(time.perf_counter()-started,2),'seconds',flush=True)
print('COMMITTED; no financial data modified.',flush=True)
for name,original,candidate in changes:
    (root/f'database/procedures/{name}_linked_server.sql').write_text(candidate,encoding='utf-8')
