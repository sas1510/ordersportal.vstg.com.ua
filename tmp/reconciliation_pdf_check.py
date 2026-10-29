from pathlib import Path
import json
from records.dealer_reconciliation_pdf import build_reconciliation_pdf
r=json.loads(Path('../tmp/new_portal_report_live.json').read_text())
pdf=build_reconciliation_pdf(r)
Path('../tmp/new_portal_report_preview.pdf').write_bytes(pdf)
print('PDF bytes',len(pdf))
