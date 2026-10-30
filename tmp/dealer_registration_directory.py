exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/dealer_registration_preflight.py',encoding='utf-8-sig').read().split("print('HASHERS'")[0])
from django.db.models import Q
from utils.BinToGuid1C import bin_to_guid_1c
names=[line.split('|')[1] for line in (root/'tmp/dealer_registration_targets.txt').read_text(encoding='utf-8-sig').splitlines()]
with connection.cursor() as c:
    placeholders=','.join(['%s']*len(names))
    c.execute(f'SELECT c.Ссылка,c.Наименование,p.Наименование FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] c LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] p ON p.Ссылка=c.Родитель WHERE LTRIM(RTRIM(c.Наименование)) IN ({placeholders})',names)
    data=[dict(guid=bytes(g).hex(),name=n.strip(),parent=p) for g,n,p in c.fetchall()]
(root/'tmp/dealer_registration_directory.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
for d in data:
    existing=list(CustomUser.objects.filter(user_id_1C=bytes.fromhex(d['guid'])).values('id','username','role','is_active'))
    print(d['name'],d['guid'],d['parent'],'EXISTING',existing)
print('MISSING',set(names)-{d['name'] for d in data})
print('EXISTING_PASSWORD_FORMATS',[(u.username,u.password.split('$')[0] if '$' in u.password else 'unrecognized') for u in CustomUser.objects.filter(username__in=['parashchuk','Kolotulo_T'])])
