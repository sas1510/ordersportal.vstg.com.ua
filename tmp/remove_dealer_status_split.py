from pathlib import Path
import re,json
root=Path('.')
def read(name): return Path(name).read_text(encoding='utf-8-sig')
def save(name,text): Path(name).write_text(text,encoding='utf-8')
p='backend/records/dealer_reconciliation.py';s=read(p)
s=re.sub(r'^STATUSES=.*\n','',s,flags=re.M)
s=s.replace("seed['independent']","seed['additional_dealers']")
a=s.index('    result.update(dealers=');b=s.index("    result['difference']",a)
s=s[:a]+"    result.update(dealers=len(rows),onPortal=sum(bool(r['newAccount']) for r in rows))\n"+s[b:]
s=re.sub(r"^        status='independent'.*\n",'',s,flags=re.M)
s=s.replace("'status':status,'statusLabel':STATUSES[status],",'')
s=s.replace("def filter_report(report,region='',status='',search=''):","def filter_report(report,region='',search=''):")
s=s.replace(" and (not status or r['status']==status)",'')
save(p,s)
p='backend/records/data/dealer_reconciliation.json';seed=json.loads(read(p));seed['additional_dealers']=seed.pop('independent');save(p,json.dumps(seed,ensure_ascii=False,indent=2)+'\n')
p='backend/records/dealer_reconciliation_views.py';s=read(p).replace(', STATUSES','').replace("dealer-constructions-v1","dealer-constructions-v2")
a=s.index("    status=request.GET.get(");b=s.index("    token=",a)
s=s[:a]+"    if request.GET.get('status'):\n        return Response({'detail':'Фільтр статусу дилера більше не використовується. Оновіть сторінку.'},status=400)\n"+s[b:]
s=s.replace("filter_report(report,region,status,request.GET.get('search','').strip())","filter_report(report,region,request.GET.get('search','').strip())")
s=s.replace("'Область / філіал','Статус','Номер заявки'","'Область / філіал','Номер заявки'").replace("row['region'],row['statusLabel'],app['number']","row['region'],app['number']")
save(p,s)
p='frontend/src/pages/DealerReconciliationPage.jsx';s=read(p)
s=re.sub(r'^const statusNames =.*\n','',s,flags=re.M)
s=s.replace(", ['Самостійно: конструкції у заявках', totals.independentApplicationConstructions, 'independent'], ['Самостійно: конструкції у замовленнях', totals.independentLinkedConstructions, 'independent']",'')
s=s.replace(", ...(dealer ? ['Статус'] : [])",'').replace(", 'Конструкцій самостійно'",'')
s=s.replace("{dealer && <td><span className={`reconcile-badge reconcile-${r.status}`}>{r.statusLabel}</span></td>}",'')
s=s.replace("<td>{n(dealer ? (r.status === 'independent' ? r.applicationConstructions : 0) : r.independentApplicationConstructions)}</td>",'')
s=s.replace("region: '', status: '', search: ''","region: '', search: ''")
s=s.replace('Від заявки до підтвердженого замовлення. Окремо — показники 75 самостійних дилерів.','Від заявки до підтвердженого замовлення: кількість конструкцій, конверсія та різниця.')
s=re.sub(r'^        <label>Статус<select.*\n','',s,flags=re.M)
s=s.replace(", ['Самостійно: конструкцій у заявках', n(totals.independentApplicationConstructions)], ['Самостійно: конструкцій у замовленнях', n(totals.independentLinkedConstructions)]",'')
s=s.replace('«Самостійно» — за погодженим списком 75 дилерів. ','')
a=s.index('      <section className="reconcile-panel"><h2>Статуси дилерів за областями</h2>');b=s.index('\n',a)
s=s[:a]+'''      <section className="reconcile-panel"><h2>Дилери за областями</h2><p>Кількість дилерів у поточному відборі та частка на новому порталі.</p><div className="reconcile-scroll"><table><thead><tr><th>Область / філіал</th><th>Усього у 1С</th><th>Новий портал</th></tr></thead><tbody>{regions.map(g => <tr key={g.name}><td>{g.name}</td><td>{g.dealers}</td><td>{share(g.onPortal, g.dealers)}</td></tr>)}</tbody></table></div></section>'''+s[b:]
s=s.replace('<span className={`reconcile-badge reconcile-${selected.status}`}>{selected.statusLabel}</span>','')
assert not any(term in s for term in ['statusNames','statusLabel','самостій','Самостій','Менеджер','independent','filters.status'])
save(p,s)
p='frontend/src/utils/dealerReconciliation.js';s=read(p)
s=s.replace(", 'independent', 'manager', 'inactive', 'independentApplicationConstructions', 'independentLinkedConstructions'",'')
a=s.index('    totals.dealers++;');b=s.index('  totals.difference',a)
s=s[:a]+'''    totals.dealers++;
    if (row.newAccount) totals.onPortal++;
    for (const f of reportMetrics) totals[f] += row[f] || 0;
  }
'''+s[b:]
s=s.replace(" && (!filters.status || r.status === filters.status)",'')
save(p,s)
p='backend/records/dealer_reconciliation_pdf.py';s=read(p).replace('    from .dealer_reconciliation import STATUSES\n','')
s=s.replace('Статуси дилерів за областями','Дилери за областями')
a=s.index('    stats=');b=s.index('    story += [PageBreak()',a)
s=s[:a]+'''    stats=[[g['name'],g['dealers'],share(g['onPortal'],g['dealers'])] for g in report['regions']]
    stats.append(['Усього',t['dealers'],share(t['onPortal'],t['dealers'])])
    story.append(table(['Область / філіал','Усього у 1С','Новий портал'],stats,[330,160,available-490]))
'''+s[b:]
s=s.replace(",n(g['independentApplicationConstructions'])",'').replace(",n(t['independentApplicationConstructions'])",'')
s=s.replace(",'Конструкцій самостійно'",'').replace('[170,60,95,95,100,85,85,available-690]','[210,65,110,110,110,85,available-690]')
s=s.replace('«Самостійно» - за погодженим списком 75 дилерів (74 з продзвону + Журавецький). ','')
s=s.replace(",('Самостійно: у заявках',t['independentApplicationConstructions'],'#16a34a'),('Самостійно: у пов’язаних замовленнях',t['independentLinkedConstructions'],'#15803d')",'')
s=s.replace("r['name'],r['statusLabel'],r['applications']","r['name'],r['applications']").replace("['РАЗОМ','',group['applications']","['РАЗОМ',group['applications']")
s=s.replace("['Дилер','Статус','Заявок'","['Дилер','Заявок'").replace('[220,95,55,85,85,85,80,available-705]','[245,60,100,100,100,90,available-695]')
assert not any(term in s for term in ['STATUSES','statusLabel','Самостій','independent','Менеджер'])
save(p,s)
print('Removed dealer status split from UI, API metrics, PDF and CSV; report selection preserved.')
