import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT Номер,Контрагент FROM [oknastyle_biV2].dbo.[Документы.ЗаказПокупателя] WHERE Номер IN (N'01-363988',N'45-179740',N'22-11851')")
    orders = cursor.fetchall()
    for number, contractor in orders:
        cursor.execute('EXEC dbo.GetCalculationsWithOrdersByYearAndContractor7 @DateFrom=%s,@DateTo=%s,@Contractor_ID=%s', ['2026-10-01','2026-10-21',contractor])
        found = False
        while True:
            if cursor.description:
                fields = [column[0] for column in cursor.description]
                for row in cursor.fetchall():
                    item = dict(zip(fields,row))
                    if str(item.get('OrderNumber','')).strip() == str(number).strip():
                        found = True
                        print(str(number).strip(), item.get('OrderStage'), 'ready=', item.get('ProductionReadyDateMax'), flush=True)
                        if str(number).strip() == '45-179740' and item.get('ProductionReadyDateMax') is not None:
                            raise RuntimeError('Incomplete extras incorrectly marked ready')
                        if str(number).strip() in ('01-363988','22-11851') and item.get('ProductionReadyDateMax') is None:
                            raise RuntimeError('Complete order missing readiness')
            if not cursor.nextset():
                break
        if not found:
            raise RuntimeError('Order absent from procedure result: ' + number)
