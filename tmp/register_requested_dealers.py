import os,sys,json,secrets,string
from pathlib import Path
from datetime import timedelta
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend')); os.chdir(root/'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import authenticate
from users.models import CustomUser
source={f[1]:f for f in json.loads((root/'tmp/dealer_registration_source.json').read_text(encoding='utf-8-sig'))}
directory=json.loads((root/'tmp/dealer_registration_directory.json').read_text())
targets=[line.split('|') for line in (root/'tmp/dealer_registration_targets.txt').read_text(encoding='utf-8-sig').splitlines()]
assert len(targets)==26
out=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/dealer_registration')
out.mkdir(mode=0o700,exist_ok=True)
report=out/'Дані_входу.md'
assert not report.exists(), 'Report already exists; abort to prevent duplicates'
results=[]
now=timezone.now(); expiry=now+timedelta(days=365)
with transaction.atomic():
    for region,name,login in targets:
        matches=[d for d in directory if d['name']==name]
        assert len(matches)==1,(name,'ambiguous directory')
        guid=bytes.fromhex(matches[0]['guid'])
        assert not CustomUser.objects.filter(Q(username__iexact=login)|Q(user_id_1C=guid)).exists(),(name,'duplicate')
        f=source.get(login)
        password=''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(18))
        user=CustomUser(username=login,full_name=name,role='customer',is_active=True,is_staff=False,is_superuser=False,user_id_1C=guid,expire_date=expiry,permit_finance_info=False,load_all_contractor_addresses=False,is_branch=False,email=(f[5].strip() if f and f[5]!='NULL' else None),phone_number=(f[6].strip() if f and f[6]!='NULL' else None),old_portal_id=(f[0] if f else None))
        user.set_password(password)
        user.save()
        user.refresh_from_db()
        assert user.is_active and user.role=='customer' and user.check_password(password)
        assert authenticate(username=login,password=password).pk==user.pk
        assert bytes(user.user_id_1C)==guid
        assert set(user.groups.values_list('name',flat=True))=={'customer'}
        results.append(dict(id=user.pk,region=region,name=name,username=login,password=password,source=bool(f),directory_parent=matches[0]['parent']))
    lines=['# Дані входу дилерів','',f'Створено: {timezone.localtime(now):%d.%m.%Y}. Доступ до: {timezone.localtime(expiry):%d.%m.%Y}.', '', 'Портал: https://portal.vstg.com.ua', '', 'Роль усіх облікових записів: Клієнт. Паролі нові; після входу їх можна змінити.','', '| Область зі списку | Дилер | Логін | Пароль | ID |','|---|---|---|---|---|']
    for r in results: lines.append(f"| {r['region']} | {r['name']} | {r['username']} | {r['password']} | {r['id']} |")
    lines+=['','Контакти зі старого порталу перенесено для 22 однозначно зіставлених логінів. Для Маркет Двері ОПТ (Рівне), Паращука, Нарінна та Танкевича контакти залишено порожніми через відсутність однозначного збігу.','', 'Область наведена за списком замовника; прив’язка доступу зроблена за точним контрагентом 1С. Паращук у 1С розташований у папці «Менеджери», Танкевич — «Чернівецька обл. Роздріб (будівництво)».']
    fd=os.open(report,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w',encoding='utf-8') as handle: handle.write('\n'.join(lines)+'\n')
print('COMMITTED',len(results),'accounts; verified authenticate, role, group, active status and 1C binding')
print('REPORT',str(report))
print('IDS',[r['id'] for r in results])

