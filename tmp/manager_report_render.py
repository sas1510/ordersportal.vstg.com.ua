from records.dealer_reconciliation_pdf import build_reconciliation_pdf
from pathlib import Path
import json
r=json.loads(Path('tmp/manager_report_live.json').read_text(encoding='utf-8'))
Path('tmp/manager_report_preview.pdf').write_bytes(build_reconciliation_pdf(r))
