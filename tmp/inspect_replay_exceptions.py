import json
from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backups/comments_jan_jul_2026_20261030')
e=json.loads((p/'exceptions.json').read_text());s=json.loads((p/'source.json').read_text(encoding='utf-8-sig'))
from collections import Counter
print('5549',[r for r in e if r['oldMessageId']==294850])
print('TOP_MISSING_MANAGER',Counter(str(r.get('oldManagerId')) for r in e if r['reason']=='author_or_recipient_missing').most_common(8))
print('MANAGER_SAMPLE',s['managers'][:3])
print('MISSING_WRITER',Counter(str(r.get('oldWriterId')) for r in e if r['reason']=='author_or_recipient_missing' and r['oldWriterId']!=r['oldCustomerId']).most_common(5))
