exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from records.calculation_metadata import attach_calculation_metadata
from uuid import UUID
with connection.cursor() as c:
 c.execute("SELECT TOP(3) CalculationGuid FROM dbo.CalculationIdempotencyRecords WHERE Status='succeeded' AND JSON_QUERY(ResponseBody,'$._measurement_telegram') IS NOT NULL ORDER BY ID DESC")
 ids=[str(UUID(str(r[0]))) for r in c.fetchall()]
result=attach_calculation_metadata([{'id':g} for g in ids])
for calc in result:
 print('RESULT',calc)
 print('VERIFIED',calc['oneCNumber'],calc['measurementNumber'],calc['measurementUrl'])

