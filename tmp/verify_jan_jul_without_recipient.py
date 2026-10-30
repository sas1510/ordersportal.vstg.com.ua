exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
import json
from pathlib import Path
folder=root/'backups/comments_jan_jul_2026_20261030'
receipt=json.loads((folder/'inserted_without_recipient.json').read_text());ids=[r['id'] for r in receipt]
with connection.cursor() as c:
 c.execute('SELECT id,Text,AuthorId,RecipientId FROM dbo.ChatMessage WHERE id IN ('+','.join(['%s']*len(ids))+')',ids)
 records=c.fetchall()
assert len(records)==82
expected={r['id']:r for r in receipt}
for id,text,author,recipient in records:
 assert text==expected[id]['text'] and bytes(author).hex()==expected[id]['authorId'] and recipient is None
report=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/Перенесення_коментарів_січень-липень_2026.md')
previous=report.read_text(encoding='utf-8')
updated='## Оновлення: дозволений порожній одержувач\n\nДодатково перенесено та перевірено 82 коментарі з визначеним автором і порожнім одержувачем. Разом додано 1620 коментарів за січень–липень.\n\nЗалишилося: 626 без знайденого прорахунку; 710 без визначеного автора; 15 без визначеного контрагента; 2 з неоднозначним прорахунком. Попередній список нижче є результатом початкової звірки, до додаткового перенесення.\n\n'
report.write_text(updated+previous,encoding='utf-8')
print('VERIFIED',len(records),'TOTAL_ADDED',1538+len(records))
