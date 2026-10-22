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
name='GetWDSCodes_ByContractor'
args=[guid_to_1c_bin('1e1714d8-8a2d-11e1-ac0a-002590633bb3'),'2026-09-30','2026-10-22']
def verify():
    with connection.cursor() as c:
        c.cursor.timeout=45
        started=time.perf_counter()
        c.execute('EXEC dbo.GetWDSCodes_ByContractor @Контрагент=%s,@DateFrom=%s,@DateTo=%s',args)
        count=0
        while True:
            if c.description: count+=len(c.fetchall())
            if not c.nextset():break
        print('WDS VERIFIED',count,'rows',round(time.perf_counter()-started,2),'seconds',flush=True)
try:
    verify()
    sys.exit()
except Exception as exc:
    print('CURRENT ERROR',str(exc),flush=True)
    if '--diagnose-only' in sys.argv:
        sys.exit(2)
    if '7436' not in str(exc) and '7377' not in str(exc):raise
with connection.cursor() as c:
    c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
    original=c.fetchone()[0]
    if not original:raise RuntimeError('Definition inaccessible')
    stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
    backup=root/f'database/procedures/backups/{name}_before_remote_adapter_{stamp}.sql'
    with backup.open('x',encoding='utf-8',newline='') as f:f.write(original)
    print('BACKUP',backup.name,flush=True)
    pattern=r'\bWITH\s*\(\s*(?:INDEX\s*\([^()]*\)\s*,?\s*|FORCESEEK\s*,?\s*|FORCESCAN\s*,?\s*)+\)'
    candidate,count=re.subn(pattern,'',original,flags=re.I)
    if not count:raise RuntimeError('Unrecognized hints; no changes applied')
    candidate=re.sub(r'OPTION\s*\(\s*FORCE\s+ORDER\s*,\s*LOOP\s+JOIN\s*,\s*RECOMPILE\s*\)','OPTION (RECOMPILE)',candidate,flags=re.I)
    candidate=re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROC(?:EDURE)?\b','ALTER PROCEDURE',candidate,count=1,flags=re.I)
with transaction.atomic():
    with connection.cursor() as c:
        c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
        if c.fetchone()[0]!=original:raise RuntimeError('Concurrent SQL change')
        c.execute(candidate)
    verify()
print('COMMITTED; no WDS data modified.',flush=True)
(root/f'database/procedures/{name}_linked_server.sql').write_text(candidate,encoding='utf-8')
