exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from utils.BinToGuid1C import bin_to_guid_1c
u=CustomUser.objects.get(username='M_Aleksandruyk')
with connection.cursor() as c:
 c.execute("SELECT TOP (20) Ссылка,Номер,НомерДилера FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] WHERE LTRIM(RTRIM(НомерДилера))=%s OR LTRIM(RTRIM(Номер))=%s",['5549','000005549'])
 docs=c.fetchall()
 for guid,num,dealer_num in docs:
  print('DOCUMENT',bin_to_guid_1c(guid),num,dealer_num)
  print('MESSAGES',list(ChatMessage.objects.filter(related_object_id=guid,is_notification=False).order_by('id').values('id','timestamp','text','event_type','author','recipient')))
 c.execute("SELECT TOP(12) id,ChatId,Timestamp,Text,RelatedObjectId FROM dbo.ChatMessage WHERE (AuthorId=%s OR RecipientId=%s) AND [Text] LIKE %s ORDER BY Timestamp DESC",[u.user_id_1C,u.user_id_1C,'%5549%'])
 for row in c.fetchall():print('MENTION',row)
 c.execute("SELECT c.name FROM [oknastyle_biV2].sys.columns c JOIN [oknastyle_biV2].sys.objects t ON t.object_id=c.object_id WHERE t.name=N'ЗаявкаНаПросчет'")
 print('APPLICATION_FIELDS',[r[0] for r in c.fetchall()])
with connection.cursor() as c:
 c.execute('SELECT Ссылка,Номер,НомерДилера,Дата,Контрагент,Комментарий,[Состояние просчета] FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] WHERE Контрагент=%s AND LTRIM(RTRIM(НомерДилера))=%s',[u.user_id_1C,'5549'])
 for g,n,dn,dt,contractor,comment,state in c.fetchall():print('ALEXANDRIUK_5549',bin_to_guid_1c(g),n,dn,dt,'SOURCE_COMMENT',comment,'STATE',bin_to_guid_1c(state))
