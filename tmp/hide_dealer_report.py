from pathlib import Path
p=Path('frontend/src/routesConfig.jsx');s=p.read_text(encoding='utf-8-sig')
s='\n'.join(line for line in s.splitlines() if 'DealerReconciliationPage' not in line and '"/statistics/reconciliation"' not in line)+'\n';p.write_text(s,encoding='utf-8')
p=Path('frontend/src/pages/DealerReportsPage.jsx');s=p.read_text(encoding='utf-8-sig')
s='\n'.join(line for line in s.splitlines() if 'Новий портал: заявки та конструкції · PDF' not in line)+'\n'
s=s.replace('isAdmin, isSuperAdmin, role','isAdmin, role');p.write_text(s,encoding='utf-8')
p=Path('backend/records/urls.py');s=p.read_text(encoding='utf-8-sig')
s='\n'.join(line for line in s.splitlines() if 'dealer_reconciliation' not in line)+'\n';p.write_text(s,encoding='utf-8')
print('Report removed from navigation, frontend routes and API routes. Source retained.')
