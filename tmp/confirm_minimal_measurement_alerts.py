exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from utils.portal_error_alerts import send_alert
print('CONFIRMATION_SENT',send_alert('✅ Сповіщення замірника ввімкнено: спроба створення заявки, успіх та помилки. У нових подіях будуть час і ID спроби для пошуку в журналі.'))
