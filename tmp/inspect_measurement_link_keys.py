exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute("SELECT TOP(6) CalculationGuid,JSON_VALUE(ResponseBody,'$._measurement_telegram.payload.order_number'),JSON_VALUE(ResponseBody,'$._measurement_telegram.payload.user_id') FROM dbo.CalculationIdempotencyRecords WHERE Status='succeeded' AND JSON_QUERY(ResponseBody,'$._measurement_telegram') IS NOT NULL ORDER BY ID DESC")
 print('MEASUREMENT_KEYS',c.fetchall())
