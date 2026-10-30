exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db.models import Q
for u in CustomUser.objects.filter(Q(full_name__icontains='Александрюк')|Q(full_name__icontains='Олександрюк')|Q(username__icontains='Aleksandr')):
 print('USER',u.id,u.username,u.full_name,'OLD',u.old_portal_id,'GUID',bytes(u.user_id_1C or b'').hex())
 with connection.cursor() as c:
  c.execute('SELECT COUNT_BIG(*),MIN(Timestamp),MAX(Timestamp) FROM dbo.ChatMessage WHERE AuthorId=%s OR RecipientId=%s',[u.user_id_1C,u.user_id_1C]);print('NEW_MESSAGES',c.fetchone())
import ast,pyodbc,re
source=ast.parse((root/'backend/import uuid.py').read_text(encoding='utf-8-sig'))
config=next(ast.literal_eval(node.value) for node in source.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='conn_params' for t in node.targets))
connstr=re.sub(r'DRIVER=\{[^}]+\}', 'DRIVER={'+pyodbc.drivers()[-1]+'}',config['srv1'])+'Encrypt=no;'
try:
 old=pyodbc.connect(connstr,timeout=8)
 c=old.cursor();c.execute("SELECT t.name,c.name FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id WHERE t.name IN ('Customers','OrdersMessages') OR t.name LIKE '%User%' ORDER BY t.name,c.column_id")
 for row in c.fetchall():print('OLD_SCHEMA',tuple(row))
except Exception as e:print('OLD_ERROR',type(e).__name__,str(e)[:180])
