from records.dealer_reconciliation import build_report
from records.dealer_reconciliation_pdf import build_reconciliation_pdf
from records.dealer_reconciliation_views import dealer_reconciliation,cache
from django.urls import resolve,Resolver404
from rest_framework.test import APIRequestFactory,force_authenticate
from types import SimpleNamespace
from datetime import date
from pathlib import Path
import json,csv,io
r=build_report(date(2026,10,1),date(2026,10,29),date(2026,7,29))
t=r['totals']
for kind,count,quantity in [('applicationStatuses','applications','applicationConstructions'),('orderStatuses','linkedOrders','linkedConstructions'),('periodOrderStatuses','total','orderConstructions')]:
    assert sum(row['documents'] for row in t[kind])==t[count]
    assert sum(row['constructions'] for row in t[kind])==t[quantity]
assert t['confirmedLinkedOrders']<=t['linkedOrders']
print('Totals',{k:v for k,v in t.items() if not isinstance(v,list)})
print('Application states',t['applicationStatuses'])
print('Linked order states',t['orderStatuses'])
assert not any(row['name'].startswith('Невідомий стан') for row in t['applicationStatuses'])
Path('tmp/manager_report_live.json').write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
Path('tmp/manager_report_preview.pdf').write_bytes(build_reconciliation_pdf(r))
key='draft-verification'
cache.set('0:'+key,r,timeout=120)
req=APIRequestFactory().get('/api/dealer-reconciliation/',{'snapshot':key,'export':'csv'})
force_authenticate(req,user=SimpleNamespace(pk=0,id=0,is_authenticated=True,role='admin'))
response=dealer_reconciliation(req)
assert response.status_code==200
parsed=list(csv.DictReader(io.StringIO(response.content.decode('utf-8-sig')),delimiter=';'))
assert len(parsed)==t['applications']+t['linkedOrders']
assert len({(row['Тип документа'],row['GUID документа']) for row in parsed})==len(parsed)
Path('tmp/manager_report_documents.csv').write_bytes(response.content)
cache.delete('0:'+key)
try: resolve('/api/dealer-reconciliation/')
except Resolver404: print('Public API still hidden: OK')
else: raise AssertionError('Report must stay hidden')
print('CSV unique documents',len(parsed),'PDF generated')
