exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db.models import Q
for u in CustomUser.objects.filter(Q(username__in=['N_Gorak','Y_Fochuk','Iftymiychuk_Stanislava','Operator_Zavod'])|Q(full_name__icontains='Горак')):
 print(u.id,u.username,u.full_name,u.role,u.old_portal_id,bytes(u.user_id_1C or b'').hex())
