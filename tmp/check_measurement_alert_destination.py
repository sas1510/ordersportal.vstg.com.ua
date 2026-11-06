exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.conf import settings
COPY_CHAT_ID = 716230412
print('ALERT_CHAT',getattr(settings,'PORTAL_ERROR_TELEGRAM_CHAT_ID',''),'SUCCESS_COPY_CHAT',COPY_CHAT_ID,'ALERT_TOKEN_CONFIGURED',bool(getattr(settings,'PORTAL_ERROR_TELEGRAM_BOT_TOKEN','')))

