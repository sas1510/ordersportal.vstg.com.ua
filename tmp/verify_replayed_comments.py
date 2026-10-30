exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
import json
from collections import Counter
from datetime import datetime
from records.order_chat_summary import get_order_boundary_messages
from utils.GuidToBin1C import guid_to_1c_bin
folder=root/'backups/comments_jan_jul_2026_20261030'
receipt=json.loads((folder/'inserted.json').read_text());ids=[r['id'] for r in receipt]
found=[]
with connection.cursor() as c:
 for start in range(0,len(ids),500):
  chunk=ids[start:start+500];c.execute('SELECT id,Text,Timestamp FROM dbo.ChatMessage WHERE id IN ('+','.join(['%s']*len(chunk))+')',chunk);found.extend(c.fetchall())
assert len(found)==len(receipt)
expected={r['id']:r for r in receipt}
for id,text,stamp in found:
 assert text==expected[id]['text']
 assert str(stamp)[:10]==expected[id]['timestamp'][:10]
boundaries=get_order_boundary_messages([guid_to_1c_bin('c531c9d6-9b7a-11f1-9cf4-4cd98f08e56d')])
assert boundaries and boundaries[0]['text'].strip()=='Тетяна'
print('VERIFIED',len(found),'5549',[(m['id'],m['text']) for m in boundaries])
exceptions=json.loads((folder/'exceptions.json').read_text());source=json.loads((folder/'source.json').read_text(encoding='utf-8-sig'));people={u['oldUserId']:u['name'] or u['login'] for u in source['users']}
labels={'application_not_found':'Не знайдено прорахунок 1С','application_ambiguous':'Кілька можливих прорахунків','author_or_recipient_missing':'Не встановлено автора або одержувача','contractor_not_unique_or_missing':'Не встановлено контрагента'}
lines=['# Перенесення коментарів за січень–липень 2026','', 'Період: 01.01.2026–31.07.2026 включно.', '',f'Вивантажено: {len(source["messages"])}. Уже існувало: 5875. Додано та перевірено: {len(receipt)}. Невирішених: {len(exceptions)}.', '', 'Коментар «Тетяна» до прорахунку Александрюка №5549 перенесено. Історичні повідомлення позначено прочитаними; нові сповіщення не надсилалися.','', 'Перше й останнє повідомлення картки тепер визначаються за датою, а не за ID, щоб дозавантажена історія не перекривала нові повідомлення.', '', '## Невирішені записи','', '| Старий ID повідомлення | Дилер | Прорахунок | Дата | Причина |','|---|---|---|---|---|']
for e in exceptions:
 vals=[e['oldMessageId'],people.get(e['oldCustomerId'],e['oldCustomerId']),e['orderNumber'],e['timestamp'],labels[e['reason']]]
 lines.append('| '+' | '.join(str(v).replace('|','/').replace('\n',' ') for v in vals)+' |')
report=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/Перенесення_коментарів_січень-липень_2026.md')
report.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('EXCEPTIONS',dict(Counter(e['reason'] for e in exceptions)))
