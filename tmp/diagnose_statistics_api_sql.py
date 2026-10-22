import os,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
from utils.BinToGuid1C import bin_to_guid_1c
from utils.GuidToBin1C import guid_to_1c_bin
contractor=guid_to_1c_bin('1e1714d8-8a2d-11e1-ac0a-002590633bb3')
for name,args in [
    ('GetABCProductionTimelinessByContractorV2',[contractor,'2026-10-01','2026-10-31']),
    ('GetContractorUnifiedAnalyticsV2',['2026-10-01','2026-10-31',contractor]),
    ('GetPortalDealerComparisonAnalyticsV2',['2026-10-01','2026-10-31',str(bin_to_guid_1c(contractor))]),
]:
    for mode in ['OFF','ON']:
        try:
            started=time.perf_counter()
            with connection.cursor() as c:
                c.cursor.timeout=45
                c.execute('SET ANSI_WARNINGS '+mode+'; EXEC dbo.'+name+' %s,%s,%s',args)
                counts=[]
                while True:
                    if c.description:counts.append(len(c.fetchall()))
                    if not c.nextset():break
            print(name,mode,'OK',counts,round(time.perf_counter()-started,2),'s',flush=True)
        except Exception as exc:print(name,mode,'ERROR',str(exc),flush=True)
