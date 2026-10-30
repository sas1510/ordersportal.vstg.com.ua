exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
user=CustomUser.objects.get(pk=21550)
with connection.cursor() as c:
 c.execute('EXEC dbo.GetDealerPaymentPageDataV2 @Contractor=%s',[user.user_id_1C])
 names=[d[0] for d in c.description]
 rows=[dict(zip(names,row)) for row in c.fetchall()]
 if rows:
  assert 'ShipmentDate' in names
  for r in rows:
   assert (r['OrderStage']=='Відвантажений') == (r['ShipmentDate'] is not None)
 print('Payment procedure executed;',len(rows),'orders;',sum(r.get('ShipmentDate') is not None for r in rows),'with shipment dates')
 while c.nextset():
  if c.description:c.fetchall()
