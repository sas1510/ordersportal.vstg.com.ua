exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDealerPaymentPageDataV2'))")
 definition=c.fetchone()[0]
 print('\n'.join(definition.splitlines()[180:250]))

