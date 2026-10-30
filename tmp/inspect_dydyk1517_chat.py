exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from utils.BinToGuid1C import bin_to_guid_1c
from utils.GuidToBin1C import guid_to_1c_bin
for m in ChatMessage.objects.filter(id__in=[218246,218251]):print('MESSAGE',m.id,m.chat_id,bin_to_guid_1c(m.related_object_id),m.transaction_type_id,m.is_notification,m.text)
with connection.cursor() as c:
 for g in ['b7210ae9-ccb3-11f1-9cfa-4cd98f08e56d','41163e77-c70a-11f1-9cfa-4cd98f08e56d','7001f020-c70a-11f1-9cfa-4cd98f08e56d']:
  c.execute('SELECT TOP(1) Ссылка,Номер,ДокументОснование FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] WHERE Ссылка=%s',[guid_to_1c_bin(g)])
  print('ORDER',g,c.fetchall())
