from pathlib import Path
import re,json
metadata=Path('tmp/manager_application_state_metadata.txt').read_text(encoding='utf-8')
values=re.findall(r'\{1,0,([0-9a-f-]{36})\},"([^"]+)",\s*\{1,"ru","([^"]+)"\}',metadata)
labels={}
for guid,name,label in values[1:]:
    a,b,c,d,e=guid.split('-');labels['0X'+(d+e+c+b+a).upper()]={'name':name,'label':label}
assert len(labels)==9
Path('backend/records/data/application_states.json').write_text(json.dumps({'enum':'ВМ_СостоянияЗаявокНаПросчет','metadataGuid':'7ed21b1e-98e8-443a-aba2-4435f8217fcd','verifiedAt':'2026-10-29','states':labels},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('backend/records/dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace('Z.БВ_КоличествоКонструкций AS Constructions\n','Z.БВ_КоличествоКонструкций AS Constructions, Z.БВ_СостояниеЗаказа AS StateGUID,\n        OS.Наименование AS StateName, Z.Проведен AS Posted\n')
s=s.replace('Z JOIN Scope S ON S.GUID=Z.Контрагент AND S.IsGroup=0x01\n','Z JOIN Scope S ON S.GUID=Z.Контрагент AND S.IsGroup=0x01\n      LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] OS ON OS.Ссылка=Z.БВ_СостояниеЗаказа\n')
s=s.replace('AND Z.Организация=%s AND Z.БВ_СостояниеЗаказа=%s AND Z.Проведен=0x01 AND Z.ПометкаУдаления=0x00','AND Z.Организация=%s AND Z.ПометкаУдаления=0x00')
s=s.replace('SELECT OrderGUID,DealerGUID,OrderNumber,OrderDate,Constructions FROM OrdersPeriod','SELECT OrderGUID,DealerGUID,OrderNumber,OrderDate,Constructions,StateGUID,StateName,Posted FROM OrdersPeriod')
s=s.replace('A._Fld44966_RTRef AS AuthorType\n','A._Fld44966_RTRef AS AuthorType,A._Fld44862RRef AS StateGUID,A._Posted AS Posted\n')
s=s.replace('A._Marked=0x00 AND A._Posted=0x01','A._Marked=0x00')
s=s.replace('binary(ORG),binary(STATE)]','binary(ORG)]')
s=s[:s.index('METRICS=')]+'''
METRICS=('recent','total','orderConstructions','applications','applicationConstructions',
    'convertedApplications','applicationsWithOrders','linkedOrders','linkedConstructions',
    'confirmedOrders','confirmedConstructions','confirmedLinkedOrders','confirmedLinkedConstructions',
    'newOrders','newConstructions')

def application_states():
    return json.loads((Path(__file__).parent/'data/application_states.json').read_text(encoding='utf-8'))['states']

def status_breakdown(documents):
    unique={doc['guid']:doc for doc in documents}
    buckets={}
    for doc in unique.values():
        state=doc['stateGuid']
        bucket=buckets.setdefault(state,{'guid':state,'name':doc['state'],'documents':0,'constructions':0})
        bucket['documents']+=1
        bucket['constructions']+=doc['constructions']
    return sorted(buckets.values(),key=lambda row:(-row['documents'],row['name'],row['guid']))

def summarize(rows):
    result={name:sum(r[name] for r in rows) for name in METRICS}
    result.update(dealers=len(rows),onPortal=sum(bool(r['newAccount']) for r in rows))
    result['difference']=result['applicationConstructions']-result['linkedConstructions']
    result['conversion']=round(100*result['convertedApplications']/result['applications'],1) if result['applications'] else 0
    result['withoutOrders']=result['applications']-result['applicationsWithOrders']
    result['applicationStatuses']=status_breakdown([doc for row in rows for doc in row['applicationDetails']])
    result['orderStatuses']=status_breakdown([doc for row in rows for doc in row['cohortOrders']])
    result['periodOrderStatuses']=status_breakdown([doc for row in rows for doc in row['orders']])
    return result

def qty(value):
    return float(value or 0)

def _document(row,kind,state_labels):
    is_app=kind=='application'
    prefix='Application' if is_app else 'Order'
    state=key(row.get('StateGUID'))
    label=(state_labels.get(state) or {}).get('label') if is_app else str(row.get('StateName') or '').strip()
    if not label:
        label='Не вказано' if not state.replace('0X','').strip('0') else 'Невідомий стан ('+state+')'
    return {'guid':key(row[prefix+'GUID']),'number':str(row[prefix+'Number']).strip(),
        'date':str(row[prefix+'Date'])[:10],'constructions':qty(row['Constructions']),
        'stateGuid':state,'state':label,'confirmed':not is_app and state==STATE,
        'posted':key(row.get('Posted')) in ('0X01','TRUE','1')}

def assemble_report(directory,orders,links,applications,seed,start,end,activity):
    dealers={key(row['DealerGUID']):row for row in directory}
    missing=(set(seed['calls'])|set(seed['additional_dealers']))-set(dealers)
    if missing:
        raise ValueError('Не знайдено контрагентів продзвону за GUID: '+', '.join(sorted(missing)))
    unique={}
    for row in orders:
        guid=key(row['OrderGUID'])
        if guid in unique and unique[guid]!=row:
            raise ValueError('Суперечливі дані замовлення за GUID.')
        if activity.isoformat()<=str(row['OrderDate'])[:10]<=end.isoformat():
            unique[guid]=row
    apps={key(row['ApplicationGUID']):row for row in applications if activity.isoformat()<=str(row['ApplicationDate'])[:10]<=end.isoformat()}
    linked=defaultdict(set)
    for link in links:
        ag,og=key(link['ApplicationGUID']),key(link['OrderGUID'])
        if ag in apps and og in unique and key(apps[ag]['DealerGUID'])==key(unique[og]['DealerGUID']):
            linked[ag].add(og)
    approved={g for g,v in seed['sources'].items() if v['source']=='new' and g in unique and v['dealer']==key(unique[g]['DealerGUID'])}
    new_apps={g:a for g,a in apps.items() if (key(a['AuthorGUID'])==key(a['DealerGUID']) and key(a['AuthorType'])=='0X0000007A') or linked[g]&approved}
    portal_orders=(set().union(*(linked[g] for g in new_apps)) if new_apps else set())|approved
    labels=application_states()
    order_docs={g:{**_document(o,'order',labels),'newPortal':g in portal_orders} for g,o in unique.items()}
    order_dealers=defaultdict(list)
    app_dealers=defaultdict(dict)
    for g,o in unique.items(): order_dealers[key(o['DealerGUID'])].append(g)
    for g,a in new_apps.items():
        if str(a['ApplicationDate'])[:10]>=start.isoformat(): app_dealers[key(a['DealerGUID'])][g]=a
    rows=[]
    for guid,dealer in dealers.items():
        calls=seed['calls'].get(guid)
        recent=order_dealers[guid]
        if not calls and not recent and not app_dealers[guid] and guid not in seed['additional_dealers']:
            continue
        registered=bool(dealer.get('NewAccounts') or guid in seed['registered'] or dealer.get('OldAccounts') or guid in seed['old_accounts'])
        selected=[order_docs[g] for g in recent if order_docs[g]['date']>=start.isoformat()]
        period_apps=app_dealers[guid]
        cohort_ids=set().union(*(linked[g] for g in period_apps)) if period_apps else set()
        cohort=[order_docs[g] for g in sorted(cohort_ids)]
        confirmed_ids={g for g in cohort_ids if order_docs[g]['confirmed']}
        app_details=[]
        for ag,a in period_apps.items():
            related=[order_docs[og] for og in sorted(linked[ag])]
            app_details.append({**_document(a,'application',labels),'orders':related,
                'orderConstructions':sum(o['constructions'] for o in related),
                'confirmedOrderConstructions':sum(o['constructions'] for o in related if o['confirmed'])})
        row={'guid':guid,'name':str(dealer['DealerName']).strip(),
            'region':'Чернівецька область' if guid==RUTA else str(dealer['ReportGroup']).strip(),
            'path':dealer['FolderPath'],'newAccount':registered,'callList':bool(calls),'aliases':calls['aliases'] if calls else [],
            'recent':len(recent),'total':len(selected),'orderConstructions':sum(o['constructions'] for o in selected),
            'applications':len(period_apps),'applicationConstructions':sum(a['constructions'] for a in app_details),
            'applicationsWithOrders':sum(bool(linked[g]) for g in period_apps),
            'convertedApplications':sum(bool(linked[g]&confirmed_ids) for g in period_apps),
            'linkedOrders':len(cohort),'linkedConstructions':sum(o['constructions'] for o in cohort),
            'confirmedOrders':sum(o['confirmed'] for o in selected),'confirmedConstructions':sum(o['constructions'] for o in selected if o['confirmed']),
            'confirmedLinkedOrders':len(confirmed_ids),'confirmedLinkedConstructions':sum(order_docs[g]['constructions'] for g in confirmed_ids),
            'newOrders':sum(o['newPortal'] for o in selected),'newConstructions':sum(o['constructions'] for o in selected if o['newPortal']),
            'orders':sorted(selected,key=lambda o:(o['date'],o['number'],o['guid'])),
            'cohortOrders':cohort,'applicationDetails':sorted(app_details,key=lambda a:(a['date'],a['number'],a['guid']))}
        rows.append(row)
    rows.sort(key=lambda row:(row['region'],row['name']))
    return {'rows':rows,'regions':[{'name':name,**summarize([row for row in rows if row['region']==name])} for name in sorted({row['region'] for row in rows})],
        'totals':summarize(rows),'period':{'from':start.isoformat(),'to':end.isoformat(),'activityFrom':activity.isoformat()},
        'rulesVersion':seed['reviewed_at'],'orderScope':'all_states','confirmedState':STATE,
        'applicationEntity':'Заявка / прорахунок','statusAsOf':'generation_time'}

def build_report(start,end,activity):
    from django.utils import timezone
    seed=seed_data()
    report=assemble_report(*fetch_facts(seed,activity,end),seed,start,end,activity)
    report['generatedAt']=timezone.now().isoformat()
    return report

def filter_report(report,region='',search=''):
    rows=[row for row in report['rows'] if (not region or row['region']==region) and (not search or search.casefold() in ' '.join([row['name'],row['guid'],*row['aliases']]).casefold())]
    return {**report,'rows':rows,'totals':summarize(rows),'regions':[{'name':name,**summarize([row for row in rows if row['region']==name])} for name in sorted({row['region'] for row in rows})]}
'''
p.write_text(s,encoding='utf-8')
print('All order states, verified application states, unique document totals and confirmed subtotals implemented.')
