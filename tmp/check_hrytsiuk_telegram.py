exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/export_portal_telegram_users.py',encoding='utf-8-sig').read().split('users=[]')[0])
from django.db.models import Q
matched=CustomUser.objects.filter(Q(full_name__icontains='Грицюк')|Q(username__icontains='hrytsiuk')|Q(username__icontains='grytsyuk')|Q(username__icontains='gritsyuk'))
for u in matched:
 print('USER',u.id,u.full_name,u.username,u.role,'active',u.is_active,'1C_TG',byguid.get(bytes(u.user_id_1C)) if u.user_id_1C else None,'CHAT',links.get(u.id,[]))
print('MATCHES',matched.count())

