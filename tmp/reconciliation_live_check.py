from records.dealer_reconciliation import build_report
from datetime import date
from pathlib import Path
import json,time
start=time.monotonic()
r=build_report(date(2026,10,1),date(2026,10,28),date(2026,7,28))
print(r['totals']); print('seconds',round(time.monotonic()-start,2))
Path('../tmp/new_portal_report_live.json').write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
