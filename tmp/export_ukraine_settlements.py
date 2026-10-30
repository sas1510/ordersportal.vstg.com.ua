exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
import json
from collections import Counter
from utils.BinToGuid1C import bin_to_guid_1c
region_names='Вінницька|Волинська|Дніпропетровська|Донецька|Житомирська|Закарпатська|Запорізька|Івано-Франківська|Київська|Кіровоградська|Луганська|Львівська|Миколаївська|Одеська|Полтавська|Рівненьська|Сумська|Тернопільська|Харківська|Херсонська|Хмельницька|Черкаська|Чернівецька|Чернігівська|АР Крим'.split('|')
with connection.cursor() as c:
 c.execute('''SELECT O.Ссылка,O.Наименование,N.Ссылка,N.Наименование,R.Ссылка,R.Наименование,T.БВ_ТипыНаселенныхПунктов,C.А2
 FROM [oknastyle_biV2].[dbo].[Справочники.БВ_НаселенныеПункты] N
 JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_Области] O ON O.Ссылка=N.Владелец
 LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.ГМ_Районы] R ON R.Ссылка=N.ГМ_Район AND R.ПометкаУдаления=0x00
 LEFT JOIN [oknastyle_biV2].[dbo].[Перечисления.БВ_ТипыНаселенныхПунктов] T ON T.Ссылка=N.ТипНаселенногоПункта
 LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.КлассификаторСтранМира] C ON C.Ссылка=N.Страна
 WHERE N.ПометкаУдаления=0x00 AND O.ПометкаУдаления=0x00 AND O.Наименование IN ('''+','.join(['%s']*len(region_names))+''') AND (N.Страна=0x00000000000000000000000000000000 OR C.А2=%s)
 ORDER BY O.Наименование,N.Наименование,R.Наименование''',region_names+['UA'])
 rows=c.fetchall()
regions={};items=[]
for rg,rn,g,n,dg,dn,typ,country in rows:
 rid=bin_to_guid_1c(rg)
 regions[rid]={'id':rid,'name':'Рівненська' if rn.strip()=='Рівненьська' else rn.strip(),'sourceName':rn.strip()}
 items.append({'id':bin_to_guid_1c(g),'name':n.strip(),'regionId':rid,'district':(dn or '').strip(),'districtId':bin_to_guid_1c(dg) if dg else None,'type':(typ or '').strip()})
assert len({item['id'] for item in items})==len(items)
assert len(regions)==25
from django.utils import timezone
payload={'country':'UA','updatedAt':timezone.now().isoformat(),'source':'1C БВ_НаселенныеПункты','regions':list(regions.values()),'settlements':items}
path=root/'backend/records/data/ukraine_settlements.json';path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('EXTRACTED',len(items),'SETTLEMENTS;',len(regions),'REGIONS; MISSING_DISTRICT',sum(not item['district'] for item in items))
