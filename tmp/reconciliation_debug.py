from records.dealer_reconciliation import fetch_facts,seed_data,key
from datetime import date
facts=fetch_facts(seed_data(),date(2026,7,28),date(2026,10,28))
print([len(r) for r in facts])
for group in facts:
    if group:
        print({k:(type(v).__name__,str(v)[:90]) for k,v in group[0].items()})
