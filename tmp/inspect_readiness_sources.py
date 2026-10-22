import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection
with connection.cursor() as c:
    c.execute("SELECT TOP (1) ХарактеристикаНоменклатуры FROM [oknastyle_biV2].dbo.[Документы.ОтчетПроизводстваЗаСмену.Продукция] WHERE ЗаказРезерв=0x9CFA4CD98F08E56D11F1C3EE828A9CE6")
    target = bytes(c.fetchone()[0])
    c.execute("SELECT C.name FROM [WST\\WST].[oknastyle].sys.columns C JOIN [WST\\WST].[oknastyle].sys.tables T ON T.object_id=C.object_id WHERE T.name=N'_Document488_VT10534' AND C.max_length=16")
    columns = [r[0] for r in c.fetchall()]
    c.execute('SELECT TOP (10) ' + ','.join('['+x+']' for x in columns) + ' FROM [WST\\WST].[oknastyle].dbo._Document488_VT10534 WHERE _Fld10575_RRRef=0x9CFA4CD98F08E56D11F1C3EE828A9CE6')
    for row in c.fetchall():
        for field,value in zip(columns,row):
            if value is not None and bytes(value)==target:
                print('CHARACTERISTIC_FIELD',field)
