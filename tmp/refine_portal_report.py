from pathlib import Path
p=Path('backend/records/dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("calls=sorted(seed['calls'])", "calls=sorted(set(seed['calls']) | set(seed['independent']))")
s=s.replace("missing=set(seed['calls'])-set(dealers)", "missing=(set(seed['calls']) | set(seed['independent']))-set(dealers)")
s=s.replace("if not calls and not recent:", "if not calls and not recent and guid not in seed['independent']:")
p.write_text(s,encoding='utf-8')
p=Path('backend/records/test_dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("self.assertEqual(t['independent'],1) # D3 is not selected without activity/call list.", "self.assertEqual(t['independent'],2) # The approved independent list is retained even with zero orders.")
# Small fixtures not testing the additional independent GUID should not require D3 in directory.
s=s.replace("self.seed(),date(2026,10,1),date(2026,10,28),date(2026,7,28))\n        self.assertEqual((r['totals']['dealers']", "{**self.seed(),'independent':[]},date(2026,10,1),date(2026,10,28),date(2026,7,28))\n        self.assertEqual((r['totals']['dealers']")
s=s.replace("seed=self.seed();seed['calls']={}", "seed=self.seed();seed['calls']={};seed['independent']=[]")
p.write_text(s,encoding='utf-8')
for name in ['backend/records/urls.py','frontend/src/routesConfig.jsx','frontend/src/pages/DealerReportsPage.jsx']:
    p=Path(name);p.write_text(p.read_text(encoding='utf-8-sig').rstrip()+'\n',encoding='utf-8')
