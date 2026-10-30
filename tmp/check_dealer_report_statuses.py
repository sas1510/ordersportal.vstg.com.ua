exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 for name in ['GetPortalAccessibleDealerReports','GetOrdersMonthWithCalculations8']:
  c.execute('SELECT OBJECT_DEFINITION(OBJECT_ID(%s))',['dbo.'+name]);s=c.fetchone()[0] or ''
  print(name)
  lines=s.splitlines()
  for i,line in enumerate(lines):
   if "OS.Наименование =" in line or "N'Подтверждено'" in line or 'OrderStateID =' in line:print('\n'.join(lines[max(0,i-2):i+3]))
