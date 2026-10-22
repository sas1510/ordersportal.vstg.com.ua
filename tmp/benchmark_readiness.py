"""Benchmark anonymous procedure bodies: no permanent SQL objects are changed."""
import os, sys, re, time
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection

def execute_body(cursor, source, declarations, params):
    body = re.split(r'\bAS\s*\n\s*BEGIN\b', source, maxsplit=1, flags=re.I)[1]
    started = time.perf_counter()
    cursor.execute(declarations + '\nBEGIN\n' + body)
    rows=[]
    while True:
        if cursor.description:
            fields=[x[0] for x in cursor.description]
            rows.extend(dict(zip(fields,row)) for row in cursor.fetchall())
        if not cursor.nextset(): break
    return time.perf_counter()-started,rows

with connection.cursor() as c:
    c.execute("SELECT Номер,Контрагент FROM [oknastyle_biV2].dbo.[Документы.ЗаказПокупателя] WHERE Номер IN (N'01-363988',N'45-179740',N'22-11851')")
    orders=c.fetchall()
    for name in ['GetCalculationsWithOrdersByYearAndContractor7','GetOrdersMonthWithCalculations8']:
        original=(root/f'database/procedures/backups/{name}_before_full_readiness_20261021_164253.sql').read_text(encoding='utf-8')
        optimized=(root/f'database/procedures/{name}.sql').read_text(encoding='utf-8')
        slow=original
        # Reconstruct the previously deployed, slower full-readiness variant.
        slow=re.sub(r'SUM\(OPP\._Fld10543\) AS ProducedTotal,','SUM(CASE WHEN OPP._Fld10548RRef=0x99B8002590633BB311E177FF631F08AD THEN OPP._Fld10543 ELSE 0 END) AS ProducedTotal,',slow)
        slow=re.sub(r'AND OPP\._Fld10548RRef\s*=\s*0x99B8002590633BB311E177FF631F08AD','AND OPP._Fld10548RRef NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5,0x99DC002590633BB311E22E3A03435ED0,0xA7009E14FF7CCB2E424091FF00E66DDA)',slow)
        check='''
        ;WITH Required AS (
          SELECT T.Ссылка AS OrderID,T.Номенклатура,T.ХарактеристикаНоменклатуры,SUM(T.Количество) AS RequiredQty
          FROM #OrderIDs O JOIN [oknastyle_biV2].dbo.[Документы.ЗаказПокупателя.Товары] T ON T.Ссылка=O.OrderID
          WHERE T.Номенклатура NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5,0x99DC002590633BB311E22E3A03435ED0,0xA7009E14FF7CCB2E424091FF00E66DDA)
          GROUP BY T.Ссылка,T.Номенклатура,T.ХарактеристикаНоменклатуры HAVING SUM(T.Количество)>0
        ), Produced AS (
          SELECT P.ЗаказРезерв AS OrderID,P.Номенклатура,P.ХарактеристикаНоменклатуры,SUM(P.Количество) AS ProducedQty
          FROM #OrderIDs O JOIN [oknastyle_biV2].dbo.[Документы.ОтчетПроизводстваЗаСмену.Продукция] P ON P.ЗаказРезерв=O.OrderID
          JOIN [oknastyle_biV2].dbo.[Документы.ОтчетПроизводстваЗаСмену] D ON D.Ссылка=P.Ссылка
          WHERE D.Проведен=0x01 GROUP BY P.ЗаказРезерв,P.Номенклатура,P.ХарактеристикаНоменклатуры
        )
        UPDATE PR SET ReadyMin=NULL,ReadyMax=NULL FROM #ProdReports PR
        WHERE NOT EXISTS(SELECT 1 FROM Required R WHERE R.OrderID=PR.ЗаказРезерв)
        OR EXISTS(SELECT 1 FROM Required R LEFT JOIN Produced P ON P.OrderID=R.OrderID AND P.Номенклатура=R.Номенклатура
          AND ISNULL(P.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=ISNULL(R.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)
          WHERE R.OrderID=PR.ЗаказРезерв AND ISNULL(P.ProducedQty,0)<R.RequiredQty);
        '''
        slow=slow.replace('    DROP TABLE IF EXISTS #SalesDocs;',check+'\n    DROP TABLE IF EXISTS #SalesDocs;',1)
        cases=orders if 'Contractor7' in name else [('dealer302',None)]
        for number,contractor in cases:
            decl="DECLARE @DateFrom date='2026-10-01',@DateTo date='2026-10-21',"+('@Contractor_ID binary(16)=0x'+bytes(contractor).hex()+';' if contractor is not None else '@RequesterUserID int=302,@DealerGroup nvarchar(20)=NULL;')
            args=['2026-10-01','2026-10-21',contractor if contractor is not None else 302]
            snapshots={}
            for label,source in [('baseline',original),('slow',slow),('optimized',optimized)]:
                elapsed,rows=execute_body(c,source,decl,args)
                snapshots[label]=rows
                print(name,str(number).strip(),label,round(elapsed,3),'sec',len(rows),'rows',flush=True)
            def keyed(rows):
                return {str(r.get('OrderNumber','')).strip(): (r.get('OrderStage'),r.get('ProductionReadyDateMin'),r.get('ProductionReadyDateMax')) for r in rows if r.get('OrderNumber')}
            old,new=keyed(snapshots['slow']),keyed(snapshots['optimized'])
            differences=[(key,old.get(key),new.get(key)) for key in old.keys()|new.keys() if old.get(key)!=new.get(key)]
            if differences: print('DIFFERENCES',differences[:20],flush=True)
            else: print('READINESS RESULTS MATCH',flush=True)
            if contractor is not None:
                result=new.get(str(number).strip())
                if result is None: raise RuntimeError('Target absent')
                expected=str(number).strip()!='45-179740'
                if bool(result[2])!=expected: raise RuntimeError('Unexpected readiness: '+str(result))
                print('TARGET',str(number).strip(),result,flush=True)
