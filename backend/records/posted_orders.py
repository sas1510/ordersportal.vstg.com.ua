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
    posted = set()
    with connection.cursor() as cursor:
        for offset in range(0, len(identities), 500):
            batch = identities[offset:offset + 500]
            cursor.execute('SELECT Ссылка FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] WHERE Проведен=0x01 AND ПометкаУдаления=0x00 AND Ссылка IN (' + ','.join(['%s'] * len(batch)) + ')', batch)
            posted.update(bytes(row[0]) for row in cursor.fetchall())
    for row in rows:
        row['_posted_order'] = key(row) in posted
    return rows
