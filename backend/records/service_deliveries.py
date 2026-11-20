"""Attach route dates only to documents already authorized by their source view."""
from pathlib import Path
from django.db import connection
from utils.BinToGuid1C import bin_to_guid_1c


def attach_service_deliveries(rows):
    from .complaint_compensation import attach_complaint_compensation
    from .complaint_file_counts import attach_complaint_file_counts
    attach_complaint_compensation(rows)
    attach_complaint_file_counts(rows)
    numbers = sorted({str(row.get("ClaimOrderNumber") or "").strip() for row in rows} - {""})
    if not numbers:
        return rows
    template = (Path(__file__).parent / "sql" / "delivery_notification_70.sql").read_text()
    found = {}
    metadata = {}
    for offset in range(0, len(numbers), 400):
        batch = numbers[offset:offset + 400]
        sql = template.replace("Z.Контрагент = %s AND Z.Номер LIKE N'70-%%'", "Z.Номер IN (" + ",".join(["%s"] * len(batch)) + ")")
        with connection.cursor() as cursor:
            cursor.execute(sql, [*batch, "1900-01-01"])
            for guid, number, planned in cursor.fetchall():
                found[str(number).strip()] = (bin_to_guid_1c(bytes(guid)), planned)
    with connection.cursor() as cursor:
        for offset in range(0, len(numbers), 400):
            batch = numbers[offset:offset + 400]
            cursor.execute("""
                SELECT Z.Номер, Z.БВ_КоличествоКонструкций, Z.СуммаДокумента,
                       C.Наименование, S.Наименование, Z.Ссылка, Z.Дата
                FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z
                LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Валюты] C ON C.Ссылка=Z.ВалютаДокумента
                LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] S ON S.Ссылка=Z.БВ_СостояниеЗаказа
                WHERE Z.Проведен=0x01 AND Z.ПометкаУдаления=0x00 AND Z.Номер IN (
                """ + ",".join(["%s"] * len(batch)) + ")", batch)
            for number, count, amount, currency, order_status, order_guid, order_date in cursor.fetchall():
                metadata[str(number).strip()] = (count, amount, currency, order_status, order_guid, order_date)
    production_rows = []
    for row in rows:
        values = metadata.get(str(row.get("ClaimOrderNumber") or "").strip())
        if values:
            row.update(DeliveryOrderCount=values[0], DeliveryOrderAmount=values[1], DeliveryOrderCurrency=values[2], DeliveryOrderStatus=values[3])
            if row.get("ComplaintGuid"):
                row["CustomerOrderDate"] = values[5]
                production_rows.append(({"OrderGUID": values[4]}, row))
        match = found.get(str(row.get("ClaimOrderNumber") or "").strip())
        row["PlannedDeliveryDateTime"] = match[1] if match else None
        row["DeliveryOrderGuid"] = match[0] if match else None
    if production_rows:
        from .additional_production_dates import attach_additional_production_dates
        attach_additional_production_dates([item for item, _ in production_rows])
        for item, row in production_rows:
            row["ProductionOrderDate"] = item.get("ProductionOrderDate")
            if item.get("ProducedDate"):
                row["ProducedDate"] = item["ProducedDate"]
    return rows
