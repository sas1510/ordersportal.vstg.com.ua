exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from pathlib import Path
blank="M.[Text] IS NOT NULL AND LEN(REPLACE(REPLACE(REPLACE(REPLACE(M.[Text],CHAR(9),''),CHAR(10),''),CHAR(13),''),NCHAR(160),''))=0"
with connection.cursor() as c:
 c.execute('SELECT M.IsNotification,COUNT_BIG(*) FROM dbo.ChatMessage M WHERE '+blank+' GROUP BY M.IsNotification');print('BLANK_COUNTS',c.fetchall())
 c.execute('''SELECT M.id,M.ChatId,M.Timestamp,M.IsNotification,M.EventType,DATALENGTH(M.[Text]) TextBytes,
 (SELECT COUNT(*) FROM dbo.ChatMessageAttachment A WHERE A.MessageId=M.id) Attachments,
 (SELECT COUNT(*) FROM dbo.ChatTelegramMap T WHERE T.MessageId=M.id) TelegramMappings
 FROM dbo.ChatMessage M WHERE '''+blank+' ORDER BY M.Timestamp DESC')
 columns=[d[0] for d in c.description];rows=[dict(zip(columns,r)) for r in c.fetchall()]
 print('TOTAL',len(rows),'WITH_ATTACHMENTS',sum(r['Attachments']>0 for r in rows),'WITHOUT_ATTACHMENTS',sum(r['Attachments']==0 for r in rows))
 print('SAMPLE',rows[:12])
output=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/Порожні_повідомлення.md')
lines=['# Знайдені порожні повідомлення','', 'Лише пошук. Записи не видалено. Text IS NULL: 0. Нижче — порожні рядки та рядки з пробілами/табуляціями/переносами.', '', '| ID | Чат | Дата UTC | Сповіщення | Подія | Байт тексту | Вкладень | Зв’язків Telegram |','|---|---|---|---|---|---|---|---|']
for r in rows:lines.append('| '+' | '.join(str(r[k] or '').replace('|','/').replace('\n',' ') if k not in ['id','TextBytes','Attachments','TelegramMappings'] else str(r[k]) for k in columns)+' |')
output.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('REPORT',output)
