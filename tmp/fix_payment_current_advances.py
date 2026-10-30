exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db import transaction
import re
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDealerPaymentPageDataV2'))")
 original=c.fetchone()[0]
s=original.replace('\r\n','\n')
a=s.index('    IF NOT EXISTS (SELECT 1 FROM #CustomerOrders)')
b=s.index('    SELECT\n        R._Fld24772_RRRef',a)
s=s[:a]+s[b:]
a=s.index('    SELECT\n        Dog._IDRRef AS DogovorGuid\n    INTO #AdvanceContractLinks')
s=s[:a]+'''    -- Use the same current balances as the wallet and payment validation.
    CREATE TABLE #PaymentPageAdvances (
        Dogovor_ID BINARY(16),
        Dogovor_Name NVARCHAR(255),
        DogovorSum FLOAT,
        CurrencyName NVARCHAR(255),
        ContragentName NVARCHAR(255)
    );
    INSERT INTO #PaymentPageAdvances
    EXEC dbo.GetDealerAllAdvancedBalance @Контрагент = @Contractor;

    SELECT Dogovor_ID AS DogovorGuid, Dogovor_Name AS DogovorName,
        CurrencyName, CAST(DogovorSum AS DECIMAL(18,2)) AS DogovorBalance
    FROM #PaymentPageAdvances
    ORDER BY Dogovor_Name;

    DROP TABLE #PaymentPageAdvances;
END;
'''
s=re.sub(r'CREATE\s+PROCEDURE','ALTER PROCEDURE',s,count=1,flags=re.I)
backup=root/'database/procedures/backups/GetDealerPaymentPageDataV2_before_current_advances_20261030.sql'
assert not backup.exists();backup.write_text(original,encoding='utf-8')
u=CustomUser.objects.get(username='Ruta')
with transaction.atomic():
 with connection.cursor() as c:
  c.execute(s)
  c.execute('EXEC dbo.GetDealerPaymentPageDataV2 @Contractor=%s',[u.user_id_1C])
  orders=c.fetchall();assert len(orders)==215
  assert c.nextset()
  names=[d[0] for d in c.description];advances=[dict(zip(names,row)) for row in c.fetchall()]
  assert any(float(row['DogovorBalance'])==52825.26 for row in advances),advances
  print('RUTA',len(orders),'orders;',[(row['DogovorName'],str(row['DogovorBalance']),row['CurrencyName']) for row in advances])
(root/'database/procedures/GetDealerPaymentPageDataV2.sql').write_text(s,encoding='utf-8')
print('Applied; shipment date retained:', 'AS ShipmentDate' in s)
