"""Admin-only group filters for complaints and additional-order reports.

Folder ancestry follows the existing GetOrdersMonthWithCalculations grouping.
Filters only the already-authorized report rows, never broadens their scope.
"""
from collections.abc import Mapping
from uuid import UUID
from django.db import connection
from rest_framework.exceptions import PermissionDenied, ValidationError
from utils.BinToGuid1C import bin_to_guid_1c
from utils.GuidToBin1C import guid_to_1c_bin

GROUPS = {'дилера': 'Дилера', 'експорт': 'Експорт', 'тов "наша фірма"': 'ТОВ "Наша фірма"',
          'філіали': 'Філіали', 'інше': 'Інше'}


def requested_dealer_group(request):
    value = str(request.GET.get('dealer_group') or '').strip()
    if not value:
        return None
    if str(getattr(request.user, 'role', '') or '').strip().lower() != 'admin':
        raise PermissionDenied('Фільтр груп дилерів доступний лише адміністратору.')
    group = GROUPS.get(value.casefold())
    if group is None:
        raise ValidationError({'dealer_group': 'Невідома група дилерів.'})
    return group


def classify_dealer(folder, region, region_parent):
    folder, region, parent = [str(value or '').strip().casefold() for value in (folder, region, region_parent)]
    ancestry = (folder, region, parent)
    if any(value in {'филиалы', 'філіали'} for value in ancestry):
        return 'Філіали'
    if 'тов "наша фірма"' in ancestry:
        return 'ТОВ "Наша фірма"'
    if folder == 'рута магазин':
        return 'Дилера'
    for value in (parent, region, folder):
        if value == 'дилера':
            return 'Дилера'
        if value == 'експорт':
            return 'Експорт'
    return 'Інше'


def normalized_contractor(value):
    if isinstance(value, (bytes, bytearray, memoryview)):
        value = bin_to_guid_1c(bytes(value))
    if isinstance(value, str) and value.upper().startswith('0X') and len(value)==34:
        value = bin_to_guid_1c(bytes.fromhex(value[2:]))
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        return None


def dealer_group_map(rows, contractor_field):
    ids = sorted({guid for row in rows if (guid := normalized_contractor(row.get(contractor_field)))})
    classes = {}
    with connection.cursor() as cursor:
        for offset in range(0, len(ids), 500):
            chunk = ids[offset:offset + 500]
            # Only bound GUID values; the dynamic text consists of placeholders.
            placeholders = ','.join(['%s'] * len(chunk))
            cursor.execute(f'''SELECT C.Ссылка, F.Наименование, R.Наименование, P.Наименование
                FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C
                LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] F ON F.Ссылка=C.Родитель
                LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] R ON R.Ссылка=F.Родитель
                LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] P ON P.Ссылка=R.Родитель
                WHERE C.Ссылка IN ({placeholders})''', [guid_to_1c_bin(value) for value in chunk])
            for row in cursor.fetchall():
                classes[normalized_contractor(row[0])] = classify_dealer(*row[1:4])
    return classes


def filter_report_dealer_group(rows, group, contractor_field):
    if not group or not rows:
        return rows
    classes = dealer_group_map(rows, contractor_field)
    return [row for row in rows if (guid := normalized_contractor(row.get(contractor_field)))
            and classes.get(guid, 'Інше') == group]


def dealer_folder_regions(contractor_guids):
    """First actual counterparty folder below Дилера, at any nesting depth."""
    ids = sorted({guid for value in contractor_guids if (guid := normalized_contractor(value))})
    if not ids:
        return {}
    result = {}
    with connection.cursor() as cursor:
        for offset in range(0, len(ids), 500):
            chunk = ids[offset:offset + 500]
            placeholders = ','.join(['%s'] * len(chunk))
            cursor.execute(f''';WITH FolderRegions AS (
                SELECT F.Ссылка AS NodeID, F.Наименование AS RegionName
                FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] F
                JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] RootFolder ON RootFolder.Ссылка=F.Родитель
                WHERE UPPER(LTRIM(RTRIM(RootFolder.Наименование)))=N'ДИЛЕРА'
                  AND F.ЭтоГруппа=0x00 AND RootFolder.ЭтоГруппа=0x00
                UNION ALL
                SELECT Child.Ссылка, Parent.RegionName
                FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] Child
                JOIN FolderRegions Parent ON Parent.NodeID=Child.Родитель
            ) SELECT NodeID, RegionName FROM FolderRegions
              WHERE NodeID IN ({placeholders}) OPTION (MAXRECURSION 100)''',
                           [guid_to_1c_bin(value) for value in chunk])
            for contractor, region in cursor.fetchall():
                result[normalized_contractor(contractor)] = str(region or '').strip() or 'Не визначено'
    return result
