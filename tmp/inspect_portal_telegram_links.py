exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from records.models import TelegramPortalLink
print('SECURE_LINKS',TelegramPortalLink.objects.count())
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetTelegramID'))")
 print(c.fetchone()[0])
