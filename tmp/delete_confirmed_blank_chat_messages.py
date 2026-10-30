exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from django.db import transaction
from datetime import datetime
from zoneinfo import ZoneInfo
import json,base64
where='M.[Text] IS NULL OR LEN(LTRIM(RTRIM(M.[Text]))) = 0'
backup_dir=root/'backups'/('blank_chat_messages_'+datetime.now(ZoneInfo('Europe/Kyiv')).strftime('%Y%m%d_%H%M%S'))
backup_dir.mkdir(mode=0o700)
def encode(value):
 if isinstance(value,(bytes,bytearray,memoryview)):return {'base64':base64.b64encode(bytes(value)).decode()}
 if hasattr(value,'isoformat'):return value.isoformat()
 return str(value)
with transaction.atomic():
 with connection.cursor() as c:
  c.execute('SELECT M.* FROM dbo.ChatMessage M WITH (UPDLOCK,HOLDLOCK) WHERE '+where)
  names=[d[0] for d in c.description];messages=[dict(zip(names,row)) for row in c.fetchall()]
  ids=[row['id'] for row in messages]
  assert len(ids)<1000, 'Unexpectedly large cleanup; stop for review'
  payload={'database':'portal_db','condition':where,'messages':messages,'related':{}}
  if ids:
   placeholders=','.join(['%s']*len(ids))
   for table in ['ChatMessageAttachment','ChatTelegramMap','ChatLargeVideoUploadToken']:
    c.execute('SELECT * FROM dbo.'+table+' WHERE MessageId IN ('+placeholders+')',ids)
    cols=[d[0] for d in c.description];payload['related'][table]=[dict(zip(cols,row)) for row in c.fetchall()]
   assert not payload['related']['ChatMessageAttachment'], 'Attachment found: stop before deleting'
   assert not payload['related']['ChatLargeVideoUploadToken'], 'Video upload token found: stop before deleting'
  path=backup_dir/'backup.json'
  path.write_text(json.dumps(payload,ensure_ascii=False,indent=2,default=encode),encoding='utf-8')
  saved=json.loads(path.read_text(encoding='utf-8'));assert len(saved['messages'])==len(ids)
  if ids:
   c.execute('DELETE M FROM dbo.ChatMessage M WHERE M.id IN ('+placeholders+') AND ('+where+')',ids)
   deleted=c.rowcount;assert deleted==len(ids),(deleted,len(ids))
  else:deleted=0
  c.execute('SELECT COUNT_BIG(*) FROM dbo.ChatMessage M WHERE '+where)
  remaining=c.fetchone()[0];assert remaining==0
print('DELETED',deleted,'REMAINING',remaining,'TELEGRAM_MAPPINGS_BACKED_UP',len(payload['related'].get('ChatTelegramMap',[])))
print('BACKUP',path)
