"""Daily portal movements. Historical refusals are dated by status transitions."""
from collections import Counter
from datetime import timedelta
from .dealer_reconciliation import ROOT, BRANCH, ORG, key, query_parts, _rows

AUTO_REFUSAL = 'Автоматический отказ-неоплачено'


def fetch_auto_refusals(seed, start, end):
    from django.db import connections
    cte, *_, calls = query_parts(seed)
    # Reuse the same contractor scope without the order creation-date restriction.
    cte = cte.split('), OrdersPeriod AS (')[0] + ')'
    binary = lambda value: bytes.fromhex(value[2:])
    params = [binary(g) for g in calls] + [binary(ROOT), binary(ROOT), binary(BRANCH), binary(ROOT)]
    query = r''', Candidates AS (
      SELECT DISTINCT Z.Ссылка AS GUID
      FROM [oknastyle_biV2].[dbo].[РегистрыСведений.ПП_ПричиныПереоформления] H
      JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] ST ON ST.Ссылка=H.Состояние
      JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z ON Z.Ссылка=H.Заказ
      JOIN Scope S ON S.GUID=Z.Контрагент AND S.IsGroup=0x01
      WHERE ST.Наименование=%s AND Z.Организация=%s AND Z.ПометкаУдаления=0x00
        AND Z.Номер NOT LIKE N'33-%%' AND Z.Номер NOT LIKE N'34-%%'
        AND Z.Номер NOT LIKE N'70-%%' AND Z.Номер NOT LIKE N'71-%%'
        AND (CASE WHEN YEAR(H.Период)>=3753 THEN DATEADD(YEAR,-2000,H.Период) ELSE H.Период END)>=%s
        AND (CASE WHEN YEAR(H.Период)>=3753 THEN DATEADD(YEAR,-2000,H.Период) ELSE H.Период END)<%s
    ), History AS (
      SELECT H.Заказ,H.Период,H.Состояние,H.ПричинаПереоформления_S,H.Менеджер,
        LAG(H.Состояние) OVER(PARTITION BY H.Заказ ORDER BY H.Период) AS PreviousState
      FROM [oknastyle_biV2].[dbo].[РегистрыСведений.ПП_ПричиныПереоформления] H
      JOIN Candidates C ON C.GUID=H.Заказ
    ), Events AS (
      SELECT H.*, CASE WHEN YEAR(H.Период)>=3753 THEN DATEADD(YEAR,-2000,H.Период) ELSE H.Период END AS EventDate
      FROM History H JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] ST ON ST.Ссылка=H.Состояние
      WHERE ST.Наименование=%s AND (H.PreviousState IS NULL OR H.PreviousState<>H.Состояние)
    )
    SELECT Z.Ссылка AS OrderGUID,LTRIM(RTRIM(Z.Номер)) AS OrderNumber,Z.Контрагент AS DealerGUID,
      S.Name AS DealerName,Z.БВ_КоличествоКонструкций AS Constructions,H.EventDate,
      H.ПричинаПереоформления_S AS Reason,M.Наименование AS Manager,
      A._IDRRef AS ApplicationGUID,A._Number AS ApplicationNumber,A._Fld44861 AS ApplicationConstructions,
      CASE WHEN YEAR(A._Date_Time)>=3753 THEN DATEADD(YEAR,-2000,A._Date_Time) ELSE A._Date_Time END AS ApplicationDate
    FROM Events H JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z ON Z.Ссылка=H.Заказ
    JOIN Scope S ON S.GUID=Z.Контрагент
    LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Пользователи] M ON M.Ссылка=H.Менеджер
    JOIN [oknastyle].[dbo].[_Document381] RAW ON RAW._IDRRef=Z.Ссылка
    CROSS APPLY (
      SELECT L._Document44856_IDRRef AS GUID FROM [oknastyle].[dbo].[_Document44856_VT44863] L WHERE L._Fld44865RRef=Z.Ссылка
      UNION
      SELECT RAW._Fld6205_RRRef WHERE RAW._Fld6205_TYPE=0x08 AND RAW._Fld6205_RTRef=0x0000AF38
    ) P
    JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=P.GUID AND A._Marked=0x00 AND A._Fld44859RRef=Z.Контрагент
    WHERE H.EventDate>=%s AND H.EventDate<%s
      AND ( (A._Fld44966_RRRef=A._Fld44859RRef AND A._Fld44966_RTRef=0x0000007A) OR Z.Ссылка IN (APPROVED_IDS) )
    OPTION(MAXRECURSION 100)'''
    approved = sorted(g for g, value in seed['sources'].items() if value['source'] == 'new')
    # Only pre-reviewed new-portal orders may substitute for portal author metadata.
    query = query.replace('APPROVED_IDS', ','.join('0x'+binary(g).hex() for g in approved) or 'NULL')
    params += [AUTO_REFUSAL, binary(ORG), start, end+timedelta(days=1), AUTO_REFUSAL, start, end+timedelta(days=1)]
    with connections['default'].cursor() as cursor:
        cursor.execute(cte+query, params)
        facts = _rows(cursor)
    return refusal_documents(facts)


def refusal_documents(facts):
    """Count each order once, retaining all distinct linked applications and event dates."""
    orders = {}
    for row in facts:
        guid = key(row['OrderGUID'])
        document = orders.setdefault(guid, {
            'guid': guid, 'number': str(row['OrderNumber']).strip(),
            'dealerGuid': key(row['DealerGUID']), 'dealer': str(row['DealerName']).strip(),
            'constructions': float(row['Constructions'] or 0), 'reason': AUTO_REFUSAL,
            'events': [], 'applications': [],
        })
        event = {'date': str(row['EventDate']), 'manager': str(row.get('Manager') or '').strip(),
                 'reason': str(row.get('Reason') or '').strip() or AUTO_REFUSAL}
        if event not in document['events']:
            document['events'].append(event)
        ag = key(row['ApplicationGUID'])
        if not any(app['guid'] == ag for app in document['applications']):
            document['applications'].append({'guid': ag, 'number': str(row['ApplicationNumber']).strip(),
                'date': str(row['ApplicationDate']), 'constructions': float(row['ApplicationConstructions'] or 0)})
    return sorted(orders.values(), key=lambda order: (order['dealer'], order['number']))


def movement_summary(report):
    overnight = report.get('overnightApplications', [])
    pending = report.get('previousDayPendingApplications', [])
    refused = report.get('autoRefusedOrders', [])
    linked = {order['guid']: order for app in overnight for order in app['orders']}
    refused_apps = {app['guid']: app for order in refused for app in order['applications']}
    reasons = Counter(order['reason'] for order in refused)
    return {
        'overnight': {'applications': len(overnight), 'applicationConstructions': sum(app['constructions'] for app in overnight),
            'orders': len(linked), 'orderConstructions': sum(order['constructions'] for order in linked.values())},
        'previousDayPending': {'applications': len(pending), 'applicationConstructions': sum(app['constructions'] for app in pending)},
        'autoRefused': {'orders': len(refused), 'orderConstructions': sum(order['constructions'] for order in refused),
            'applications': len(refused_apps), 'applicationConstructions': sum(app['constructions'] for app in refused_apps.values()),
            'reasons': [{'name': name, 'orders': count} for name, count in sorted(reasons.items())]},
    }
