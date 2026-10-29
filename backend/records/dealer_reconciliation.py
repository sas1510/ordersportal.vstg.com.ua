"""Read-only reconciliation; grouping follows contractor parents, never access groups."""
import calendar
import json
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT='0XBCF9002590633C1711E468B2F15C13FC'
BRANCH='0X9B5190B11C14DEB211EF7996002876F9'
RUTA='0X9D1C002590633BB311E18EEADB8B7114'
ORG='0XA88A001B214EEE7A11E15373F04D8182'
STATE='0X99B94EA6CCA98189497428BD64C2692D'

def key(value):
    if isinstance(value,(bytes,bytearray,memoryview)):
        return '0X'+bytes(value).hex().upper()
    return str(value or '').strip().upper()

def seed_data():
    return json.loads((Path(__file__).parent/'data/dealer_reconciliation.json').read_text(encoding='utf-8'))

def three_months_before(day):
    year,month=divmod(day.year*12+day.month-4,12)
    return date(year,month+1,min(day.day,calendar.monthrange(year,month+1)[1]))

def parse_period(params,today=None):
    today=today or date.today()
    try:
        end=date.fromisoformat(params.get('date_to') or today.isoformat())
        start=date.fromisoformat(params.get('date_from') or end.replace(day=1).isoformat())
        activity=date.fromisoformat(params.get('activity_from') or three_months_before(end).isoformat())
    except (ValueError,TypeError):
        raise ValueError('Вкажіть коректні дати у форматі РРРР-ММ-ДД.') from None
    if not date(2000,1,1)<=activity<=start<=end<=today:
        raise ValueError('Період активності має починатися не пізніше звітного; кінцева дата - не пізніше сьогодні.')
    if (end-activity).days>366:
        raise ValueError('Максимальний період відбору - 366 днів.')
    return start,end,activity

def _rows(cursor):
    names=[col[0] for col in cursor.description]
    return [dict(zip(names,row)) for row in cursor.fetchall()]

def query_parts(seed):
    calls=sorted(set(seed['calls']) | set(seed['additional_dealers']))
    ids=' UNION ALL '.join('SELECT CAST(%s AS BINARY(16)) AS GUID' for _ in calls)
    cte=f''';WITH CallIDs AS ({ids}), ContractorTree AS (
      SELECT C.Ссылка AS GUID,C.Родитель AS ParentGUID,C.Наименование AS Name,C.ЭтоГруппа AS IsGroup,
        CAST(C.Наименование AS NVARCHAR(2000)) AS FolderPath,C.Ссылка AS RootGUID,
        CAST(CASE WHEN C.Ссылка=%s THEN N'ДИЛЕРА (без області)' ELSE C.Наименование END AS NVARCHAR(200)) AS ReportGroup,0 AS Depth
      FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C WHERE C.Ссылка IN (%s,%s)
      UNION ALL
      SELECT C.Ссылка,C.Родитель,C.Наименование,C.ЭтоГруппа,
        CAST(T.FolderPath+N' / '+C.Наименование AS NVARCHAR(2000)),T.RootGUID,
        CAST(CASE WHEN T.Depth=0 AND T.RootGUID=%s AND C.ЭтоГруппа=0x00 THEN C.Наименование ELSE T.ReportGroup END AS NVARCHAR(200)),T.Depth+1
      FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C JOIN ContractorTree T ON C.Родитель=T.GUID
    ), Scope AS (
      SELECT GUID,Name,IsGroup,FolderPath,RootGUID,ReportGroup FROM ContractorTree
      UNION ALL
      SELECT C.Ссылка,C.Наименование,C.ЭтоГруппа,
        CAST(ISNULL(P.Наименование,N'Без групи')+N' / '+C.Наименование AS NVARCHAR(2000)),
        CAST(NULL AS BINARY(16)),CAST(ISNULL(P.Наименование,N'Без групи') AS NVARCHAR(200))
      FROM CallIDs I JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C ON C.Ссылка=I.GUID
      LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] P ON P.Ссылка=C.Родитель
      WHERE NOT EXISTS(SELECT 1 FROM ContractorTree T WHERE T.GUID=C.Ссылка)
    ), OrdersPeriod AS (
      SELECT Z.Ссылка AS OrderGUID,Z.Контрагент AS DealerGUID,LTRIM(RTRIM(Z.Номер)) AS OrderNumber,
        CASE WHEN YEAR(Z.Дата)>=3753 THEN DATEADD(YEAR,-2000,Z.Дата) ELSE Z.Дата END AS OrderDate, Z.БВ_КоличествоКонструкций AS Constructions
      FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z JOIN Scope S ON S.GUID=Z.Контрагент AND S.IsGroup=0x01
      WHERE (CASE WHEN YEAR(Z.Дата)>=3753 THEN DATEADD(YEAR,-2000,Z.Дата) ELSE Z.Дата END)>=%s
        AND (CASE WHEN YEAR(Z.Дата)>=3753 THEN DATEADD(YEAR,-2000,Z.Дата) ELSE Z.Дата END)<%s
        AND Z.Организация=%s AND Z.БВ_СостояниеЗаказа=%s AND Z.Проведен=0x01 AND Z.ПометкаУдаления=0x00
        AND Z.Номер NOT LIKE N'33-%%' AND Z.Номер NOT LIKE N'34-%%' AND Z.Номер NOT LIKE N'70-%%' AND Z.Номер NOT LIKE N'71-%%'
    ) '''
    # Lowercase group by avoids mssql-django 1.6 rewriting binary parameters as VARBINARY(1).
    directory='''SELECT S.GUID AS DealerGUID,S.Name AS DealerName,S.FolderPath,S.RootGUID,S.ReportGroup,
        COUNT(U.ID) AS NewAccounts,SUM(CASE WHEN U.IsActive=1 THEN 1 ELSE 0 END) AS ActiveAccounts,
        SUM(CASE WHEN NULLIF(LTRIM(RTRIM(U.OldPortalId)),N'') IS NOT NULL THEN 1 ELSE 0 END) AS OldAccounts
      FROM Scope S LEFT JOIN [portal_db].[dbo].[User] U ON U.UserId1C=S.GUID AND U.Role=N'customer'
      WHERE S.IsGroup=0x01 group by S.GUID,S.Name,S.FolderPath,S.RootGUID,S.ReportGroup OPTION(MAXRECURSION 100)'''
    orders='SELECT OrderGUID,DealerGUID,OrderNumber,OrderDate,Constructions FROM OrdersPeriod OPTION(MAXRECURSION 100)'
    applications='''SELECT A._IDRRef AS ApplicationGUID,A._Fld44859RRef AS DealerGUID,A._Number AS ApplicationNumber,
        CASE WHEN YEAR(A._Date_Time)>=3753 THEN DATEADD(YEAR,-2000,A._Date_Time) ELSE A._Date_Time END AS ApplicationDate,
        A._Fld44861 AS Constructions,A._Fld44966_RRRef AS AuthorGUID,A._Fld44966_RTRef AS AuthorType
      FROM [oknastyle].[dbo].[_Document44856] A JOIN Scope S ON S.GUID=A._Fld44859RRef AND S.IsGroup=0x01
      WHERE A._Marked=0x00 AND A._Posted=0x01
        AND (CASE WHEN YEAR(A._Date_Time)>=3753 THEN DATEADD(YEAR,-2000,A._Date_Time) ELSE A._Date_Time END)>=%s
        AND (CASE WHEN YEAR(A._Date_Time)>=3753 THEN DATEADD(YEAR,-2000,A._Date_Time) ELSE A._Date_Time END)<%s
      OPTION(MAXRECURSION 100)'''
    links=''', Links AS (
      SELECT O.OrderGUID,O.DealerGUID,A._IDRRef AS ApplicationGUID FROM OrdersPeriod O
      JOIN [oknastyle].[dbo].[_Document44856_VT44863] L ON L._Fld44865RRef=O.OrderGUID
      JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=L._Document44856_IDRRef AND A._Marked=0x00 AND A._Posted=0x01 AND A._Fld44859RRef=O.DealerGUID
      UNION
      SELECT O.OrderGUID,O.DealerGUID,A._IDRRef FROM OrdersPeriod O
      JOIN [oknastyle].[dbo].[_Document381] Z ON Z._IDRRef=O.OrderGUID AND Z._Marked=0x00
      JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=Z._Fld6205_RRRef
        AND Z._Fld6205_TYPE=0x08 AND Z._Fld6205_RTRef=0x0000AF38 AND A._Marked=0x00 AND A._Posted=0x01 AND A._Fld44859RRef=O.DealerGUID
    ) SELECT OrderGUID,DealerGUID,ApplicationGUID FROM Links OPTION(MAXRECURSION 100)'''
    return cte,directory,orders,links,applications,calls

def fetch_facts(seed,activity,end):
    from django.db import connections
    cte,directory,orders,links,applications,calls=query_parts(seed)
    binary=lambda value: bytes.fromhex(value[2:])
    params=[binary(g) for g in calls]+[binary(ROOT),binary(ROOT),binary(BRANCH),binary(ROOT),activity,end+timedelta(days=1),binary(ORG),binary(STATE)]
    results=[]
    with connections['default'].cursor() as cursor:
        for query in (directory,orders,links,applications):
            extra=[activity,end+timedelta(days=1)] if query==applications else []
            cursor.execute(cte+query,params+extra)
            results.append(_rows(cursor))
    return results

METRICS=('recent','total','orderConstructions','applications','applicationConstructions','convertedApplications','linkedOrders','linkedConstructions','newOrders','newConstructions')

def summarize(rows):
    result={name:sum(r[name] for r in rows) for name in METRICS}
    result.update(dealers=len(rows),onPortal=sum(bool(r['newAccount']) for r in rows))
    result['difference']=result['applicationConstructions']-result['linkedConstructions']
    result['conversion']=round(100*result['convertedApplications']/result['applications'],1) if result['applications'] else 0
    return result

def qty(value):
    return float(value or 0)

def assemble_report(directory,orders,links,applications,seed,start,end,activity):
    dealers={key(r['DealerGUID']):r for r in directory}
    missing=(set(seed['calls']) | set(seed['additional_dealers']))-set(dealers)
    if missing:
        raise ValueError('Не знайдено контрагентів продзвону за GUID: '+', '.join(sorted(missing)))
    unique={}
    for row in orders:
        guid=key(row['OrderGUID'])
        if guid in unique and unique[guid]!=row:
            raise ValueError('Суперечливі дані замовлення за GUID.')
        unique[guid]=row
    apps={key(a['ApplicationGUID']):a for a in applications}
    linked=defaultdict(set)
    for link in links:
        ag,og=key(link['ApplicationGUID']),key(link['OrderGUID'])
        if ag in apps and og in unique and key(apps[ag]['DealerGUID'])==key(unique[og]['DealerGUID']):
            linked[ag].add(og)
    # The portal sends contractor GUID as author for both customer and manager.
    # Historical GUID-reviewed new orders also establish portal application identity.
    approved={g for g,v in seed['sources'].items() if v['source']=='new' and g in unique and v['dealer']==key(unique[g]['DealerGUID'])}
    new_apps={g:a for g,a in apps.items() if (key(a['AuthorGUID'])==key(a['DealerGUID']) and key(a['AuthorType'])=='0X0000007A') or linked[g]&approved}
    portal_orders=set().union(*(linked[g] for g in new_apps)) if new_apps else set()
    portal_orders |= approved & set(unique)
    rows=[]
    for guid,dealer in dealers.items():
        calls=seed['calls'].get(guid)
        recent=[(g,o) for g,o in unique.items() if key(o['DealerGUID'])==guid and activity<=date.fromisoformat(str(o['OrderDate'])[:10])<=end]
        if not calls and not recent and guid not in seed['additional_dealers']:
            continue
        registered=bool(dealer.get('NewAccounts') or guid in seed['registered'] or dealer.get('OldAccounts') or guid in seed['old_accounts'])
        period_orders=[(g,o) for g,o in recent if str(o['OrderDate'])[:10]>=start.isoformat()]
        period_apps={g:a for g,a in new_apps.items() if key(a['DealerGUID'])==guid and start.isoformat()<=str(a['ApplicationDate'])[:10]<=end.isoformat()}
        cohort_orders=set().union(*(linked[g] for g in period_apps)) if period_apps else set()
        detail_orders=[{'guid':g,'number':o['OrderNumber'],'date':str(o['OrderDate'])[:10],'constructions':qty(o['Constructions']),'newPortal':g in portal_orders,'state':'Подтверждено'} for g,o in period_orders]
        detail_apps=[]
        for ag,a in period_apps.items():
            related=[{'guid':og,'number':unique[og]['OrderNumber'],'date':str(unique[og]['OrderDate'])[:10],'constructions':qty(unique[og]['Constructions'])} for og in sorted(linked[ag])]
            detail_apps.append({'guid':ag,'number':str(a['ApplicationNumber']).strip(),'date':str(a['ApplicationDate'])[:10],'constructions':qty(a['Constructions']),'orders':related,'orderConstructions':sum(o['constructions'] for o in related)})
        row={'guid':guid,'name':str(dealer['DealerName']).strip(),'region':'Чернівецька область' if guid==RUTA else str(dealer['ReportGroup']).strip(),'path':dealer['FolderPath'],'newAccount':registered,'callList':bool(calls),'aliases':calls['aliases'] if calls else [],
            'recent':len(recent),'total':len(period_orders),'orderConstructions':sum(o['constructions'] for o in detail_orders),
            'applications':len(period_apps),'applicationConstructions':sum(qty(a['Constructions']) for a in period_apps.values()),
            'convertedApplications':sum(bool(linked[g]) for g in period_apps),'linkedOrders':len(cohort_orders),'linkedConstructions':sum(qty(unique[g]['Constructions']) for g in cohort_orders),
            'newOrders':sum(o['newPortal'] for o in detail_orders),'newConstructions':sum(o['constructions'] for o in detail_orders if o['newPortal']),
            'orders':detail_orders,'applicationDetails':sorted(detail_apps,key=lambda a:(a['date'],a['number']))}
        rows.append(row)
    rows.sort(key=lambda r:(r['region'],r['name']))
    return {'rows':rows,'regions':[{'name':name,**summarize([r for r in rows if r['region']==name])} for name in sorted({r['region'] for r in rows})],
        'totals':summarize(rows),'period':{'from':start.isoformat(),'to':end.isoformat(),'activityFrom':activity.isoformat()},'rulesVersion':seed['reviewed_at'],'orderState':'Подтверждено'}

def build_report(start,end,activity):
    from django.utils import timezone
    seed=seed_data()
    report=assemble_report(*fetch_facts(seed,activity,end),seed,start,end,activity)
    report['generatedAt']=timezone.now().isoformat()
    return report

def filter_report(report,region='',search=''):
    rows=[r for r in report['rows'] if (not region or r['region']==region) and (not search or search.casefold() in ' '.join([r['name'],r['guid'],*r['aliases']]).casefold())]
    return {**report,'rows':rows,'totals':summarize(rows),'regions':[{'name':name,**summarize([r for r in rows if r['region']==name])} for name in sorted({r['region'] for r in rows})]}

