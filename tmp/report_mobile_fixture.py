from pathlib import Path
import json
from records.test_dealer_reconciliation import DealerConstructionsTests
r=DealerConstructionsTests().report();r['generatedAt']='2026-10-29T11:00:00+00:00';r['snapshot']='synthetic-preview'
Path('tmp/report-mobile-fixture.json').write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
print('Synthetic fixture created; no customer data')
