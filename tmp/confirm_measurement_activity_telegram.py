exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.conf import settings
import requests
chat=str(settings.PORTAL_ERROR_TELEGRAM_CHAT_ID)
assert chat=='716230412'
try:
 response=requests.post('https://api.telegram.org/bot'+settings.PORTAL_ERROR_TELEGRAM_BOT_TOKEN+'/sendMessage',json={'chat_id':chat,'text':'✅ Увімкнено особисті сповіщення замірника: спроба створення заявки, успіх та помилки. Нові події міститимуть час та ID для пошуку в журналі.','disable_web_page_preview':True},timeout=10)
 print('TELEGRAM_CONFIRMATION',response.status_code,response.json().get('ok'))
except requests.RequestException:
 print('TELEGRAM_CONFIRMATION_TRANSPORT_FAILED')
