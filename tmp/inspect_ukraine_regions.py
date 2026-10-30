exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute('SELECT O.Ссылка,O.Наименование,P.Наименование,COUNT(N.Ссылка) FROM [oknastyle_biV2].[dbo].[Справочники.БВ_Области] O LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_Области] P ON P.Ссылка=O.Родитель LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_НаселенныеПункты] N ON N.Владелец=O.Ссылка AND N.ПометкаУдаления=0x00 WHERE O.ПометкаУдаления=0x00 GROUP BY O.Ссылка,O.Наименование,P.Наименование ORDER BY P.Наименование,O.Наименование')
 for g,n,p,count in c.fetchall():print(bytes(g).hex(),n,p,count)
 c.execute("SELECT t.name,c.name FROM [oknastyle_biV2].sys.objects t JOIN [oknastyle_biV2].sys.columns c ON c.object_id=t.object_id WHERE t.name LIKE N'Справочники.%Район%' ORDER BY t.name,c.column_id")
 print('DISTRICT_FIELDS',c.fetchall())
