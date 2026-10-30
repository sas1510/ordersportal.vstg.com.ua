exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
u=CustomUser.objects.get(username='M_Aleksandruyk')
with connection.cursor() as c:
 c.execute('SELECT EventType,IsNotification,COUNT_BIG(*),MIN(Timestamp),MAX(Timestamp) FROM dbo.ChatMessage WHERE AuthorId=%s OR RecipientId=%s group by EventType,IsNotification',[u.user_id_1C,u.user_id_1C]);print('KINDS',c.fetchall())
 c.execute("SELECT TOP(5) id,Timestamp,Text,RelatedObjectId,EventType FROM dbo.ChatMessage WHERE (AuthorId=%s OR RecipientId=%s) AND EventType='1' ORDER BY Timestamp DESC",[u.user_id_1C,u.user_id_1C]);samples=c.fetchall()
 from records.order_chat_summary import get_order_boundary_messages
 from utils.BinToGuid1C import bin_to_guid_1c
 for id,dt,text,g,event in samples:
  print('MIGRATED_SAMPLE',id,dt,bin_to_guid_1c(g),'BOUNDARIES',[(m['id'],m['text'][:75]) for m in get_order_boundary_messages([g])])
 c.execute('SELECT name FROM sys.servers WHERE is_linked=1');print('LINKED',[r[0] for r in c.fetchall()])

