from pathlib import Path
from types import SimpleNamespace
import json
from django.conf import settings
from django.urls import resolve
from rest_framework.test import APIRequestFactory,force_authenticate
from records.dealer_reconciliation_views import dealer_reconciliation,cache
print('Resolved',resolve('/api/dealer-reconciliation/').url_name)
user=SimpleNamespace(pk=0,id=0,is_authenticated=True,role='admin')
def call(params):
    request=APIRequestFactory().get('/api/dealer-reconciliation/',params)
    force_authenticate(request,user=user)
    return dealer_reconciliation(request)
r=call({'date_from':'2026-10-01','date_to':'2026-10-28','activity_from':'2026-07-28'})
assert r.status_code==200,r.data
assert r.data['totals']['independent']==75
print('Live API totals',r.data['totals'])
token=r.data['snapshot']
filtered=call({'snapshot':token,'status':'independent'})
assert filtered.status_code==200 and filtered.data['totals']['dealers']==75
csv=call({'snapshot':token,'export':'csv','status':'independent'})
assert csv.status_code==200 and csv.content.startswith(b'\xef\xbb\xbf')
pdf=call({'snapshot':token,'export':'pdf','status':'independent'})
assert pdf.status_code==200 and pdf.content.startswith(b'%PDF')
Path('tmp/new_portal_independent_preview.pdf').write_bytes(pdf.content)
print('CSV bytes',len(csv.content),'PDF bytes',len(pdf.content),'same snapshot filters OK')
cache.delete(f'0:{token}')
