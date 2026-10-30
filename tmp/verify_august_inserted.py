exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
import json
from pathlib import Path
folder=root/'backups/comments_aug_2026_20261030'
receipt=json.loads((folder/'inserted.json').read_text());ids=[p['id'] for p in receipt]
with connection.cursor() as c:
 c.execute('SELECT id,Text,AuthorId,RecipientId FROM dbo.ChatMessage WHERE id IN ('+','.join(['%s']*len(ids))+')',ids)
 data=c.fetchall()
assert len(data)==190
expected={p['id']:p for p in receipt}
for id,text,author,recipient in data:
 p=expected[id];assert text==p['text'] and bytes(author).hex()==p['authorId']
 assert (bytes(recipient).hex() if recipient else None)==p['recipientId']
null_count=sum(recipient is None for _,_,_,recipient in data)
assert null_count==3
report=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/Звірка_коментарів_серпень_2026.md')
summary=['# Перенесення коментарів за серпень 2026','', 'Оновлення: перенесено й перевірено 190 відсутніх коментарів, з них 3 з порожнім одержувачем. Автори, дати та зв’язки з прорахунками збережені. Дублі пропущені.','', 'У старій базі: 1024. Уже було: 641. Додано: 190. Залишилося: 121 без знайденого прорахунку та 72 без визначеного автора.','', 'Резервне джерело й журнал нових ID збережено в backups/comments_aug_2026_20261030/.','', '## Перенесені записи','', '| Старий ID | Новий ID | Прорахунок | Дата | Одержувач визначений |','|---|---|---|---|---|']
for p in receipt:summary.append(f"| {p['oldMessageId']} | {p['id']} | {p['orderNumber']} | {p['timestamp']} | {'Так' if p['recipientId'] else 'Ні'} |")
report.write_text('\n'.join(summary)+'\n',encoding='utf-8')
print('VERIFIED',len(data),'WITHOUT_RECIPIENT',null_count)
