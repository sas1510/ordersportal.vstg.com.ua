exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from utils.BinToGuid1C import bin_to_guid_1c
from datetime import datetime,timezone,timedelta
import requests
with connection.cursor() as c:
 c.execute("SELECT TOP(6) M.id,U.Username,M.Timestamp,M.IsRead,M.RecipientId FROM dbo.ChatMessage M JOIN dbo.[User] U ON U.UserId1C=M.AuthorId WHERE M.IsNotification=0 AND M.TransactionTypeID=1 AND U.Role IN ('manager','region_manager','branch_manager') AND M.Timestamp>=%s ORDER BY M.Timestamp DESC",[datetime(2026,10,30)])
 for id,name,stamp,read,recipient in c.fetchall():print('MANAGER',id,name,stamp,read,bin_to_guid_1c(recipient))
end=datetime.now(timezone.utc);start=end-timedelta(days=4)
for query in ['{application="viknastyle-portal"} |= "221775"','{application="viknastyle-portal"} |= "221773"']:
 response=requests.get('http://192.168.200.101:3100/loki/api/v1/query_range',params={'query':query,'start':str(int(start.timestamp()*1e9)),'end':str(int(end.timestamp()*1e9)),'limit':20},timeout=15)
 print('LOGS',query,[(v[1]) for stream in response.json().get('data',{}).get('result',[]) for v in stream.get('values',[])][:20])
