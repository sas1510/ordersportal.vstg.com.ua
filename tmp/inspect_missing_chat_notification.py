import os,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'backend'));os.chdir(root/'backend');os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django;django.setup()
from django.db import connection
from records.models import ChatMessage
from users.models import CustomUser
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDocumentDisplayNumber'))")
 print('LOOKUP',c.fetchone()[0])
print('USERS',list(CustomUser.objects.filter(full_name__icontains='Косташ').values('id','username','role','user_id_1C')))
with connection.cursor() as c:
 c.execute("SELECT TOP(10) Ссылка,Номер,НомерДилера FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] WHERE НомерДилера LIKE %s OR Номер LIKE %s",['%96842%','%96842%'])
 docs=c.fetchall()
for guid,num,dealer_num in docs:
 print('DOCUMENT',bytes(guid).hex(),num,dealer_num)
 for m in ChatMessage.objects.filter(related_object_id=guid,is_notification=False).order_by('timestamp'):
  print('MESSAGE',m.id,m.timestamp.isoformat(),'author',bytes(m.author or b'').hex(),'recipient',bytes(m.recipient or b'').hex(),'read',m.is_read,'text',m.text[:100])
  print('AUTHORS',list(CustomUser.objects.filter(user_id_1C=m.author).values('id','username','role','branch_id','is_branch')))
