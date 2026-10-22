"""Back up and atomically adapt order procedures to linked-server sources."""
import os,sys,re,time
from datetime import datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection,transaction

names=['GetOrdersMonthWithCalculations8','GetCalculationsWithOrdersByYearAndContractor7']
stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
changes=[]
with connection.cursor() as c:
    for name in names:
        c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
        original=c.fetchone()[0]
        if not original: raise RuntimeError('Missing procedure definition')
        backup=root/f'database/procedures/backups/{name}_before_remote_adapter_{stamp}.sql'
        with backup.open('x',encoding='utf-8',newline='') as f: f.write(original)
        # Strip only table hints containing physical INDEX/FORCESEEK/FORCESCAN.
        # Keep query options and indexes on local temporary tables unchanged.
        removed=[]
        pattern=r'\bWITH\s*\(\s*(?:INDEX\s*\([^()]*\)\s*,?\s*|FORCESEEK\s*,?\s*|FORCESCAN\s*,?\s*)+\)'
        candidate=re.sub(pattern,lambda m: removed.append(m[0]) or '',original,flags=re.I)
        # Forced nested loops are suitable for local seeks, but can issue one
        # network request per row on a linked server. Let SQL choose joins.
        candidate=re.sub(r'OPTION\s*\(\s*FORCE\s+ORDER\s*,\s*LOOP\s+JOIN\s*,\s*RECOMPILE\s*\)', 'OPTION (RECOMPILE)', candidate, flags=re.I)
        candidate=re.sub(r'^\s*(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE','ALTER PROCEDURE',candidate,count=1,flags=re.I)
        if candidate.strip() == original.strip(): raise RuntimeError('No adaptation changes found: '+name)
        changes.append((name,original,candidate))
        print('BACKUP',backup.name,'removed hints',len(removed),flush=True)

with transaction.atomic():
    with connection.cursor() as c:
        c.cursor.timeout=45
        for name,original,candidate in changes:
            c.execute('SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(%s)',['dbo.'+name])
            if c.fetchone()[0]!=original: raise RuntimeError('Concurrent SQL change')
            c.execute(candidate)
            print('ALTERED',name,flush=True)
        started=time.perf_counter()
        c.execute('EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s,@DateFrom=%s,@DateTo=%s',[302,'2026-10-01','2026-10-22'])
        count=0
        while True:
            if c.description: count+=len(c.fetchall())
            if not c.nextset(): break
        print('ORDERS OK',count,'rows',round(time.perf_counter()-started,2),'seconds',flush=True)
        c.execute('EXEC dbo.GetCalculationsWithOrdersByYearAndContractor7 @DateFrom=%s,@DateTo=%s,@Contractor_ID=%s',['2026-10-01','2026-10-22',bytes.fromhex('00000000000000000000000000000000')])
        while c.nextset(): pass
        print('SECOND PROCEDURE OK',flush=True)
print('COMMITTED. No order/payment data modified.',flush=True)
# Preserve deployed SQL as an output artifact separate from old-server variants.
for name,original,candidate in changes:
    output=root/f'database/procedures/{name}_linked_server.sql'
    output.write_text(candidate,encoding='utf-8')
    print('DEPLOYED SQL',output.name,flush=True)
