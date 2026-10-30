import os,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
os.chdir(root/'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
from django.conf import settings
from users.models import CustomUser
rows=json.loads((root/'tmp/dealer_registration_source.json').read_text(encoding='utf-8-sig'))
print('HASHERS',settings.PASSWORD_HASHERS)
for f in rows:
    from django.db.models import Q
    users=list(CustomUser.objects.filter(Q(username__iexact=f[1])|Q(old_portal_id=f[0])).values('id','username','role','is_active','expire_date'))
    print('SOURCE',f[1],f[3],f[4],str(users))
with connection.cursor() as c:
    c.execute("SELECT TOP (100) c.Ссылка,c.Наименование,p.Наименование FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] c LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] p ON p.Ссылка=c.Родитель WHERE c.Наименование LIKE N'%%Маркет%%Двер%%' OR c.Наименование LIKE N'%%Нарін%%' OR c.Наименование LIKE N'%%Паращук%%' OR c.Наименование LIKE N'%%Танкевич%%'")
    for guid,name,region in c.fetchall(): print('DIRECTORY',bytes(guid).hex(),name,region)
