from django.db import connection
from backend.utils.GuidToBin1C import guid_to_1c_bin


def mark_posted_orders(rows):
    """Check current 1C posting by GUID, never by display status or number."""
    def key(row):
        value = row.get('OrderID_GUID') or row.get('OrderID')
        if isinstance(value, (bytes, bytearray, memoryview)):
            return bytes(value)
        try:
            return guid_to_1c_bin(str(value)) if value else None
        except (ValueError, TypeError, AttributeError):
            return None
    identities = sorted({value for row in rows if (value := key(row))})
    posted = posted_order_quantities(identities)
    for row in rows:
        order_id = key(row)
        row['_posted_order'] = order_id in posted
        row['AdditionalItemsQuantity'] = posted.get(order_id, 0)
    return enrich_calculation_dealer_numbers(rows)


def posted_order_quantities(identities):
    posted = {}
    with connection.cursor() as cursor:
        for offset in range(0, len(identities), 500):
            batch = identities[offset:offset + 500]
            placeholders = ",".join("%s" for _ in batch)
            cursor.execute("""
                SELECT O.Ссылка, SUM(COALESCE(T.Количество, 0))
                FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] O
                LEFT JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] T
                  ON T.Ссылка = O.Ссылка AND T.Номенклатура IN (
                    SELECT N.Ссылка
                    FROM [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N
                    WHERE N.Наименование LIKE N'%%Допы (ВС)%%'
                  )
                WHERE O.Проведен=0x01 AND O.ПометкаУдаления=0x00
                  AND O.Ссылка IN (""" + placeholders + """)
                group by O.Ссылка
                """, batch)
            posted.update((bytes(guid), float(quantity or 0)) for guid, quantity in cursor.fetchall())
    return posted


def enrich_calculation_dealer_numbers(rows):
    def key(row):
        value = row.get("CalcID_GUID")
        try:
            return guid_to_1c_bin(str(value)) if value else None
        except (ValueError, TypeError, AttributeError):
            return None
    identities = sorted({value for row in rows if not str(row.get("CalcDealerNumber") or "").strip() and (value := key(row))})
    numbers = {}
    with connection.cursor() as cursor:
        for offset in range(0, len(identities), 500):
            batch = identities[offset:offset + 500]
            cursor.execute("SELECT _IDRRef, _Fld44858 FROM [WST\WST].[oknastyle].[dbo].[_Document44856] WHERE _IDRRef IN (" + ",".join(["%s"] * len(batch)) + ")", batch)
            numbers.update((bytes(row[0]), str(row[1] or "").strip()) for row in cursor.fetchall())
    for row in rows:
        if not str(row.get("CalcDealerNumber") or "").strip():
            row["CalcDealerNumber"] = numbers.get(key(row), "")
    return rows
