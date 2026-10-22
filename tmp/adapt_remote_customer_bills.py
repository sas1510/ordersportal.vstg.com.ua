"""User-authorized linked-server compatibility fix for dealer bills."""
import os,sys,re,time
from pathlib import Path
from datetime import datetime
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection,transaction
from utils.GuidToBin1C import guid_to_1c_bin

name='GetCustomerBillsByContractorAndDates'
stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
with connection.cursor() as c:
    c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
    row=c.fetchone()
    if not row or not row[0]:raise RuntimeError('Missing procedure definition')
    original=row[0]
    backup=root/f'database/procedures/backups/{name}_before_remote_adapter_{stamp}.sql'
    with backup.open('x',encoding='utf-8',newline='') as f:f.write(original)
    print('BACKUP',backup.name,flush=True)
    pattern=r'\bWITH\s*\(\s*(?:INDEX\s*\([^()]*\)\s*,?\s*|FORCESEEK\s*,?\s*|FORCESCAN\s*,?\s*)+\)'
    candidate,count=re.subn(pattern,'',original,flags=re.I)
    candidate=re.sub(r'OPTION\s*\(\s*FORCE\s+ORDER\s*,\s*LOOP\s+JOIN\s*,\s*RECOMPILE\s*\)','OPTION (RECOMPILE)',candidate,flags=re.I)
    candidate=re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROC(?:EDURE)?\b','ALTER PROCEDURE',candidate,count=1,flags=re.I)
    if not count:raise RuntimeError('No recognized incompatible hints; no changes applied')
    if re.search(r'\bFORCESEEK\b|\bFORCESCAN\b',candidate,flags=re.I):raise RuntimeError('Unrecognized hint remains')
    print('REMOVED',count,'hints',flush=True)

with transaction.atomic():
    with connection.cursor() as c:
        c.cursor.timeout=45
        c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
        if c.fetchone()[0]!=original:raise RuntimeError('Concurrent SQL change')
        c.execute(candidate)
        started=time.perf_counter()
        c.execute('EXEC dbo.GetCustomerBillsByContractorAndDates @ContractorBin=%s,@DateFrom=%s,@DateTo=%s',[guid_to_1c_bin('371e3142-294b-11ea-80dd-74867ad9d525'),'2026-08-02','2026-10-30'])
        sets=[]
        while True:
            if c.description:sets.append(len(c.fetchall()))
            if not c.nextset():break
        print('VERIFIED result set counts',sets,'seconds',round(time.perf_counter()-started,2),flush=True)
print('COMMITTED; no bills/payments modified.',flush=True)
(root/f'database/procedures/{name}_linked_server.sql').write_text(candidate,encoding='utf-8')
