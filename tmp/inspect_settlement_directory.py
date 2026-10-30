exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute("SELECT t.name,c.name,TYPE_NAME(c.system_type_id) FROM [oknastyle_biV2].sys.objects t JOIN [oknastyle_biV2].sys.columns c ON c.object_id=t.object_id WHERE t.name LIKE N'%Населен%' OR t.name LIKE N'%Област%' OR t.name LIKE N'%Страны%' ORDER BY t.name,c.column_id")
 for row in c.fetchall():print(row)

