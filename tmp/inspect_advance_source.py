exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
u=CustomUser.objects.get(username='Ruta')
with connection.cursor() as c:
 c.execute("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.GetDealerAllAdvancedBalance'))")
 print(c.fetchone()[0])
 c.execute('EXEC dbo.GetDealerAllAdvancedBalance @Контрагент=%s',[u.user_id_1C]); print('EXISTING_ADVANCES',c.fetchall())
