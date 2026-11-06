exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from datetime import datetime,timezone,timedelta
import requests,json
with connection.cursor() as c:
 c.execute("SELECT TOP(8) M.id,M.Timestamp,U.Username,M.IsRead,M.ChatId FROM dbo.ChatMessage M JOIN dbo.[User] U ON U.UserId1C=M.AuthorId WHERE M.IsNotification=0 AND M.TransactionTypeID=1 AND U.Role IN ('manager','region_manager','branch_manager') AND M.Timestamp>=%s ORDER BY M.Timestamp DESC",[datetime(2026,10,30)])
 print('RECENT_MANAGER_MESSAGES',c.fetchall())
end=datetime.now(timezone.utc);start=end-timedelta(days=4)
for query in ['{application="viknastyle-portal"} |= "Queueing second 1C chat notification"','{application="viknastyle-portal"} |= "1C notification task finished"']:
 try:
  response=requests.get('http://192.168.200.101:3100/loki/api/v1/query_range',params={'query':query,'start':str(int(start.timestamp()*1e9)),'end':str(int(end.timestamp()*1e9)),'limit':15,'direction':'backward'},timeout=15)
  print('LOKI_HTTP',response.status_code,'QUERY',query)
  if response.ok:
   entries=[line[1] for stream in response.json().get('data',{}).get('result',[]) for line in stream.get('values',[])]
   print('ENTRIES',entries[:15])
 except requests.RequestException as e:print('LOKI_UNAVAILABLE',type(e).__name__)
