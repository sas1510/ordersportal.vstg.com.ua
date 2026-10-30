exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute("SELECT t.name,c.name FROM [oknastyle_biV2].sys.objects t JOIN [oknastyle_biV2].sys.columns c ON c.object_id=t.object_id WHERE t.name IN (N'Справочники.БВ_НаселенныеПункты',N'Справочники.БВ_Области') OR t.name LIKE N'Справочники.%Стран%Мира%' ORDER BY t.name,c.column_id")
 for row in c.fetchall():print(row)
 for name in ['Справочники.БВ_НаселенныеПункты','Справочники.БВ_Области']:
  c.execute('SELECT TOP(3) * FROM [oknastyle_biV2].[dbo].['+name+']')
  names=[d[0] for d in c.description]
  for row in c.fetchall():print(name,{k:bytes(v).hex() if isinstance(v,(bytes,bytearray,memoryview)) else str(v) for k,v in zip(names,row)})
