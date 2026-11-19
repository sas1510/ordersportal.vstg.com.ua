"""Read production document dates for already scoped additional orders."""
from django.db import connection


def _document_date(value):
    if value is not None and value.year >= 3753:
        return value.replace(year=value.year - 2000)
    return value


def attach_additional_production_dates(rows):
    ids = list(dict.fromkeys(
        bytes(row["OrderGUID"]) for row in rows
        if isinstance(row.get("OrderGUID"), (bytes, bytearray, memoryview))
        and len(row["OrderGUID"]) == 16 and any(row["OrderGUID"])
    ))
    dates = {}
    for offset in range(0, len(ids), 200):
        batch = ids[offset:offset + 200]
        values = ", ".join("(CONVERT(binary(16), %s))" for _ in batch)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT O.OrderID, P.DocumentDate, R.DocumentDate
                FROM (VALUES """ + values + """) AS O(OrderID)
                OUTER APPLY (
                    SELECT MAX(D._Date_Time) AS DocumentDate
                    FROM [oknastyle].dbo._Document380_VT6116 L
                    JOIN [oknastyle].dbo._Document380 D ON D._IDRRef = L._Document380_IDRRef
                    WHERE L._Fld6127_TYPE = 0x08 AND L._Fld6127_RTRef = 0x0000017D
                      AND L._Fld6127_RRRef = O.OrderID
                      AND D._Posted = 0x01 AND D._Marked = 0x00
                ) P
                OUTER APPLY (
                    SELECT MAX(D._Date_Time) AS DocumentDate
                    FROM [oknastyle].dbo._Document488_VT10534 L
                    JOIN [oknastyle].dbo._Document488 D ON D._IDRRef = L._Document488_IDRRef
                    WHERE L._Fld10575_TYPE = 0x08 AND L._Fld10575_RTRef = 0x0000017D
                      AND L._Fld10575_RRRef = O.OrderID
                      AND D._Posted = 0x01 AND D._Marked = 0x00
                ) R
                """, batch)
            for guid, production, report in cursor.fetchall():
                dates[bytes(guid)] = (_document_date(production), _document_date(report))
    for row in rows:
        guid = row.get("OrderGUID")
        if isinstance(guid, (bytes, bytearray, memoryview)) and bytes(guid) in dates:
            production, report = dates[bytes(guid)]
            row["ProductionOrderDate"] = production
            if report:
                row["ProducedDate"] = report
    return rows
