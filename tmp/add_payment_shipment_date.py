exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db import transaction
import re
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDealerPaymentPageDataV2'))")
 original=c.fetchone()[0]
anchor='        CO.OrderSum,\r\n        ISNULL(P.TotalPayments, 0) AS PaidAmount,'
if anchor not in original: anchor=anchor.replace('\r\n','\n')
assert original.count(anchor)==1
modified=original.replace(anchor,anchor.replace('        ISNULL','        CAST(SLS.SaleDate AS DATE) AS ShipmentDate,\n        ISNULL'))
modified=re.sub(r'CREATE\s+PROCEDURE','ALTER PROCEDURE',modified,count=1,flags=re.I)
backup=root/'database/procedures/backups/GetDealerPaymentPageDataV2_before_shipment_date_20261030.sql'
assert not backup.exists()
backup.write_text(original,encoding='utf-8')
(root/'database/procedures/GetDealerPaymentPageDataV2.sql').write_text(modified,encoding='utf-8')
with transaction.atomic():
 with connection.cursor() as c:
  c.execute(modified)
  c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDealerPaymentPageDataV2'))")
  assert 'CAST(SLS.SaleDate AS DATE) AS ShipmentDate' in c.fetchone()[0]
print('ShipmentDate added; previous procedure saved')
