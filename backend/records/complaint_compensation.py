"""Attach posted debt corrections to complaint rows already scoped by the API."""
from decimal import Decimal
from django.db import connection


RESOLVED_REASON_CODES = {"00614", "01262", "01116", "00814"}


def attach_complaint_compensation(rows):
    scoped = {}
    for row in rows:
        guid = row.get("ComplaintGuid")
        if isinstance(guid, (bytes, bytearray, memoryview)) and len(guid) == 16 and any(guid):
            scoped.setdefault(bytes(guid), []).append(row)
    ids = list(scoped)
    found = {}
    for offset in range(0, len(ids), 200):
        batch = ids[offset:offset + 200]
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT P.Ссылка, SUM(R.СуммаВзаиморасчетов), MAX(D.Дата)
                FROM [oknastyle_biV2].dbo.[Документы.БВ_Претензия] P
                JOIN [oknastyle_biV2].dbo.[Документы.КорректировкаДолга] D ON D.Сделка=P.Ссылка
                JOIN [oknastyle_biV2].dbo.[РегистрыНакопления.ВзаиморасчетыСКонтрагентами] R
                  ON R.Регистратор=D.Ссылка AND R.Контрагент=P.Контрагент
                WHERE P.Ссылка IN (""" + ",".join(["CONVERT(binary(16), %s, 2)"] * len(batch)) + """)
                  AND D.Проведен=0x01 AND D.ПометкаУдаления=0x00
                GROUP BY P.Ссылка
                OPTION (RECOMPILE)
            """, [guid.hex().upper() for guid in batch])
            for guid, amount, date in cursor.fetchall():
                found[bytes(guid)] = (amount, date)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT P.Ссылка, R.Наименование, R.Код
                FROM [oknastyle_biV2].dbo.[Документы.БВ_Претензия] P
                JOIN [oknastyle_biV2].dbo.[Справочники.БВ_ПричиныРекламаций] R
                  ON R.Ссылка = P.ПричинаПретензии AND R.ПометкаУдаления = 0x00
                WHERE P.Ссылка IN (""" + ",".join(["CONVERT(binary(16), %s, 2)"] * len(batch)) + ")",
                [guid.hex().upper() for guid in batch],
            )
            for guid, reason, code in cursor.fetchall():
                for row in scoped[bytes(guid)]:
                    row["ComplaintReasonName"] = reason
                    if str(code).strip() in RESOLVED_REASON_CODES:
                        row["StatusName"] = "Вирішено"
    for guid, targets in scoped.items():
        amount, date = found.get(guid, (Decimal("0"), None))
        for row in targets:
            row["DebtCorrectionAmount"] = amount
            row["DebtCorrectionDate"] = date
    return rows
