import json
from pathlib import Path
from collections import Counter
root=Path('/var/www/html/ordersportal.vstg.com.ua');folder=root/'backups/comments_aug_2026_20261030'
source=json.loads((folder/'source.json').read_text(encoding='utf-8-sig'));summary=json.loads((folder/'summary.json').read_text());plan=json.loads((folder/'plan.json').read_text());exceptions=json.loads((folder/'exceptions.json').read_text())
people={u['oldUserId']:u['name'] or u['login'] for u in source['users']}
assert summary['source']==summary['already_present']+len(plan)+len(exceptions)
assert all('2026-08-01'<=m['timestamp']<'2026-09-01' for m in source['messages'])
lines=['# Звірка коментарів за серпень 2026','', 'Період: 01.08–31.08.2026 включно. Усі користувачі. Лише звірка: записів у базу не додано.', '', f"Зі старої бази: {summary['source']}. Уже є в новій: {summary['already_present']}. Відсутні й однозначно зіставлені: {len(plan)}. Потребують уточнення: {len(exceptions)}.", '', 'Зіставлення: контрагент + прорахунок/пов’язане замовлення 1С. Наявність коментаря перевірена за документом, часом (з урахуванням точності SQL datetime) та текстом без крайніх пробілів. Період відбирається за датою повідомлення. Порожні коментарі виключено; поточний статус старого замовлення не обмежується.', '', '## Відсутні, готові до перенесення', '', '| Старий ID | Користувач | Прорахунок | Дата | Текст |','|---|---|---|---|---|']
def row(values):return '| '+' | '.join(str(v or '').replace('|','/').replace('\r',' ').replace('\n',' ') for v in values)+' |'
for p in plan:lines.append(row([p['oldMessageId'],people.get(p['oldCustomerId'],p['oldCustomerId']),p['orderNumber'],p['timestamp'],p['text']]))
labels={'application_not_found':'Не знайдено прорахунок 1С','author_or_recipient_missing':'Не встановлено автора або одержувача'}
lines+=['','## Потребують уточнення','','| Старий ID | Користувач | Прорахунок | Дата | Причина |','|---|---|---|---|---|']
for e in exceptions:lines.append(row([e['oldMessageId'],people.get(e['oldCustomerId'],e['oldCustomerId']),e['orderNumber'],e['timestamp'],labels.get(e['reason'],e['reason'])]))
output=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd/Звірка_коментарів_серпень_2026.md');output.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('REPORT',output)
print('MISSING_CUSTOMERS',len({r['oldCustomerId'] for r in plan}),'UNRESOLVED',dict(Counter(e['reason'] for e in exceptions)))
