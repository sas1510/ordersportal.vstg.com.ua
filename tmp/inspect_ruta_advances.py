exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db.models import Q
for u in CustomUser.objects.filter(Q(username__iexact='Ruta')|Q(full_name__icontains='Рута')):
 print('USER',u.id,u.username,u.full_name,bytes(u.user_id_1C or b'').hex())
 if u.username.lower()=='ruta':
  with connection.cursor() as c:
   c.execute('EXEC dbo.GetDealerPaymentPageDataV2 @Contractor=%s',[u.user_id_1C])
   print('ORDERS',len(c.fetchall()))
   i=0
   while c.nextset():
    i+=1
    if c.description: print('RESULT',i,[d[0] for d in c.description],c.fetchall())
  with connection.cursor() as c:
   c.execute('SELECT TOP (20) D.Ссылка,D.Наименование,O.Наименование,V.Наименование,M.Наименование,D.СрокДействия FROM [oknastyle_biV2].[dbo].[Справочники.ДоговорыКонтрагентов] D LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Организации] O ON O.Ссылка=D.Организация LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.ВидыВзаиморасчетов] V ON V.Ссылка=D.ВидВзаиморасчетов LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.СтатьиДвиженияДенежныхСредств] M ON M.Ссылка=D.ОсновнаяСтатьяДвиженияДенежныхСредств WHERE D.Владелец=%s AND D.Наименование LIKE %s',[u.user_id_1C,'%ванс%'])
   print('CONTRACTS',c.fetchall())
