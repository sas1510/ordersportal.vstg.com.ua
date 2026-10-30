exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
with connection.cursor() as c:
 c.execute("SELECT c.name FROM [oknastyle_biV2].sys.objects t JOIN [oknastyle_biV2].sys.columns c ON c.object_id=t.object_id WHERE t.name=N'Справочники.Пользователи'")
 print('USER_FIELDS',[r[0] for r in c.fetchall()])
import json
from collections import Counter
p=root/'backups/comments_jan_jul_2026_20261030'
e=json.loads((p/'exceptions.json').read_text());s=json.loads((p/'source.json').read_text(encoding='utf-8-sig'));names={u['oldUserId']:(u['login'],u['name']) for u in s['users']}
for reason in ['author_or_recipient_missing','application_not_found','contractor_not_unique_or_missing','application_ambiguous']:
 subset=[r for r in e if r['reason']==reason]
 print('EXCEPTION',reason,len(subset))
 print('CUSTOMERS',[(names.get(k,k),n) for k,n in Counter(r['oldCustomerId'] for r in subset).most_common(4)])
 if reason=='author_or_recipient_missing':print('WRITERS',[(names.get(k,k),n) for k,n in Counter(r['oldWriterId'] for r in subset).most_common(5)])
 if reason=='application_ambiguous':print('ROWS',[(r['oldMessageId'],r['orderNumber'],names.get(r['oldCustomerId'])) for r in subset])
