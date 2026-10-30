exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from datetime import datetime,timedelta
from utils.GuidToBin1C import guid_to_1c_bin
from utils.BinToGuid1C import bin_to_guid_1c
stamp=datetime(2026,7,24,12,53,10,607000)
u=CustomUser.objects.get(username='M_Aleksandruyk')
with connection.cursor() as c:
 c.execute('SELECT id,ChatId,Timestamp,Text,RelatedObjectId,EventType FROM dbo.ChatMessage WHERE Timestamp>=%s AND Timestamp<=%s AND (AuthorId=%s OR RecipientId=%s OR LTRIM(RTRIM(Text))=%s)',[stamp-timedelta(seconds=2),stamp+timedelta(seconds=2),u.user_id_1C,u.user_id_1C,'Тетяна'])
 print('TIME_MATCHES',c.fetchall())
 c.execute('SELECT id,Timestamp,Text,RelatedObjectId FROM dbo.ChatMessage WHERE RelatedObjectId=%s',[guid_to_1c_bin('c531c9d6-9b7a-11f1-9cf4-4cd98f08e56d')])
 print('DOCUMENT_MESSAGES',c.fetchall())
