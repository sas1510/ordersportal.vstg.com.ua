import os,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
checks=[
 ('database states',"SELECT name,state_desc FROM sys.databases WHERE name IN ('portal_db','oknastyle','oknastyle_biV2')",None),
 ('dealer list', 'EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID=%s',[302]),
 ('orders', 'EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s,@DateFrom=%s,@DateTo=%s',[302,'2026-10-01','2026-10-22']),
]
for label,sql,params in checks:
    started=time.perf_counter()
    try:
        with connection.cursor() as c:
            c.execute(sql,params)
            count=0
            while True:
                if c.description:
                    rows=c.fetchall(); count+=len(rows)
                    if label=='database states': print(rows,flush=True)
                if not c.nextset(): break
        print(label,'OK',count,'rows',round(time.perf_counter()-started,2),'s',flush=True)
    except Exception as exc:
        print(label,'ERROR',str(exc),flush=True)
