exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from utils.BinToGuid1C import bin_to_guid_1c
with connection.cursor() as c:
 c.execute("SELECT A.Ссылка,A.НомерДилера,A.Дата,C.Наименование,A.Комментарий FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] A LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C ON C.Ссылка=A.Контрагент WHERE (LTRIM(RTRIM(A.НомерДилера)) IN (%s,%s,%s) AND C.Наименование LIKE %s) OR (LTRIM(RTRIM(A.НомерДилера))=%s AND C.Наименование LIKE %s)",['1060','1059','1058','%Бедей%','5549','%Александрюк%'])
  # Fetch before executing the nested queries.
 docs=c.fetchall()
 for guid,num,date,dealer,comment in docs:
  print('DOCUMENT',bin_to_guid_1c(guid),num,date,dealer,'SOURCE_COMMENT',comment)
  c.execute('SELECT id,Timestamp,Text,EventType FROM dbo.ChatMessage WHERE RelatedObjectId=%s AND IsNotification=0 ORDER BY id',[guid]);print('CHAT',c.fetchall())
