exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 for label,sql in [
 ('counts','SELECT IsNotification, COUNT_BIG(*) FROM dbo.ChatMessage WHERE [Text] IS NULL GROUP BY IsNotification'),
 ('foreign_keys',"SELECT OBJECT_SCHEMA_NAME(f.parent_object_id),OBJECT_NAME(f.parent_object_id),pc.name,f.delete_referential_action_desc FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id JOIN sys.columns pc ON pc.object_id=fc.parent_object_id AND pc.column_id=fc.parent_column_id WHERE f.referenced_object_id=OBJECT_ID('dbo.ChatMessage')"),
 ('samples','SELECT TOP(8) id,ChatId,Timestamp,IsNotification,EventType FROM dbo.ChatMessage WHERE [Text] IS NULL ORDER BY id')]:
  c.execute(sql);print(label,c.fetchall())
 for table in ['ChatMessageAttachment','ChatTelegramMap']:
  c.execute('SELECT COUNT_BIG(*) FROM dbo.'+table+' A JOIN dbo.ChatMessage M ON M.id=A.MessageId WHERE M.[Text] IS NULL');print(table,c.fetchone()[0])
