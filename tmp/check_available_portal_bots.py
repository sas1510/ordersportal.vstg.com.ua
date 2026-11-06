exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.conf import settings
import os,requests
seen=set()
for name in ['PORTAL_ERROR_TELEGRAM_BOT_TOKEN','NOTIFICATION_TELEGRAM_BOT_TOKEN','BOT_TOKEN','TELEGRAM_BOT_TOKEN']:
 token=getattr(settings,name,'') or os.getenv(name,'')
 if not token or token in seen:continue
 seen.add(token)
 try:
  response=requests.get('https://api.telegram.org/bot'+token+'/getMe',timeout=8)
  result=response.json();print(name,response.status_code,result.get('ok'),(result.get('result') or {}).get('username'))
 except requests.RequestException:print(name,'TRANSPORT_ERROR')
