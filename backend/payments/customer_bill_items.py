"""Read-only access to management invoices and their original goods rows."""
from datetime import timedelta
from decimal import Decimal

from django.db import connection
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.api_helpers import safe_view
from backend.utils.BinToGuid1C import convert_row
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.contractor import resolve_contractor
from backend.utils.dates import parse_date
from backend.utils.finance_access import finance_access_denied_response
from .views import get_maintenance_json_response


SOURCE = "[oknastyle_biV2].[dbo]."
HEADER_SQL = f"""
SELECT d.Ссылка AS BillGuid, d.Номер AS BillNumber, d.Дата AS BillDate,
       d.СуммаДокумента AS DocumentAmount, d.Комментарий AS Comment,
       CAST(d.Проведен AS int) AS IsPosted,
       CAST(d.СуммаВключаетНДС AS int) AS SumIncludesVAT,
       c.Наименование AS ContractorName, v.Наименование AS Currency
FROM {SOURCE}[Документы.СчетНаОплатуПокупателю] d
LEFT JOIN {SOURCE}[Справочники.Контрагенты] c ON c.Ссылка = d.Контрагент
LEFT JOIN {SOURCE}[Справочники.Валюты] v ON v.Ссылка = d.ВалютаДокумента
"""
ITEMS_SQL = f"""
SELECT t.НомерСтроки AS LineNumber, n.Наименование AS ItemName,
       h.Наименование AS Characteristic, h2.Наименование AS ProductionCharacteristic,
       e.Наименование AS Unit, t.Количество AS Quantity,
       t.Коэффициент AS Coefficient, t.Цена AS Price,
       t.ПроцентСкидкиНаценки AS ManualDiscountPercent,
       t.ПроцентАвтоматическихСкидок AS AutoDiscountPercent,
       t.Сумма AS Amount, t.СуммаНДС AS VATAmount
FROM {SOURCE}[Документы.СчетНаОплатуПокупателю.Товары] t
JOIN {SOURCE}[Документы.СчетНаОплатуПокупателю] d ON d.Ссылка = t.Ссылка
LEFT JOIN {SOURCE}[Справочники.Номенклатура] n ON n.Ссылка = t.Номенклатура
LEFT JOIN {SOURCE}[Справочники.ХарактеристикиНоменклатуры] h
    ON h.Ссылка = t.ХарактеристикаНоменклатуры
LEFT JOIN {SOURCE}[Справочники.ХарактеристикиНоменклатуры] h2
    ON h2.Ссылка = t.Характеристика
LEFT JOIN {SOURCE}[Справочники.ЕдиницыИзмерения] e ON e.Ссылка = t.ЕдиницаИзмерения
WHERE d.Контрагент = %s AND d.Ссылка = %s AND d.ПометкаУдаления = 0x00
ORDER BY t.НомерСтроки
"""


def fetch_rows(cursor):
    columns = [column[0] for column in cursor.description]
    return [convert_row(dict(zip(columns, row))) for row in cursor.fetchall()]


def goods_totals(items):
    # Sum stored amounts using decimals, rather than reconstructing discounted prices.
    return {
        "LineCount": len(items),
        "GoodsAmount": str(sum((Decimal(str(row["Amount"] or 0)) for row in items), Decimal("0"))),
        "VATAmount": str(sum((Decimal(str(row["VATAmount"] or 0)) for row in items), Decimal("0"))),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def customer_bill_items_view(request):
    denied = finance_access_denied_response(request)
    if denied is not None:
        return denied
    maintenance = get_maintenance_json_response()
    if maintenance is not None:
        return maintenance
    contractor_bin, contractor_guid = resolve_contractor(
        request, allow_admin=True, admin_param="contractor",
        elevated_roles=("admin", "manager", "region_manager", "branch_manager", "branches_director"),
    )
    bill_guid = request.GET.get("bill")
    with connection.cursor() as cursor:
        if bill_guid:
            try:
                bill_bin = guid_to_1c_bin(bill_guid)
            except Exception as exc:
                raise ValueError("Некоректний ідентифікатор рахунку.") from exc
            # Both queries enforce ownership, including for a guessed document GUID.
            cursor.execute(HEADER_SQL + " WHERE d.Контрагент = %s AND d.Ссылка = %s AND d.ПометкаУдаления = 0x00", [contractor_bin, bill_bin])
            headers = fetch_rows(cursor)
            if not headers:
                return Response({"detail": "Рахунок не знайдено."}, status=404)
            cursor.execute(ITEMS_SQL, [contractor_bin, bill_bin])
            items = fetch_rows(cursor)
            if request.GET.get("download") == "pdf":
                from .customer_bill_pdf import build_customer_bill_pdf
                document = headers[0]
                pdf = build_customer_bill_pdf(document, items, goods_totals(items))
                response = FileResponse(pdf, as_attachment=True, filename=f"Invoice-{document['BillNumber'].strip()}.pdf", content_type="application/pdf")
                response["Cache-Control"] = "private, no-store"
                return response
            return Response({"document": headers[0], "items": items, "totals": goods_totals(items)})

        start = parse_date(request.GET.get("date_from"), "date_from")
        end = parse_date(request.GET.get("date_to"), "date_to")
        if not start or not end or end < start or (end - start).days > 366:
            raise ValueError("Оберіть коректний період тривалістю до 366 днів.")
        try:
            next_day = end + timedelta(days=1)
        except OverflowError as exc:
            raise ValueError("Некоректна кінцева дата.") from exc
        try:
            page = int(request.GET.get("page", "1"))
        except (TypeError, ValueError) as exc:
            raise ValueError("Некоректний номер сторінки.") from exc
        if not 1 <= page <= 100000:
            raise ValueError("Некоректний номер сторінки.")
        where = " WHERE d.Контрагент = %s AND d.ПометкаУдаления = 0x00 AND d.Дата >= %s AND d.Дата < %s"
        params = [contractor_bin, start, next_day]
        cursor.execute(f"SELECT COUNT(*) FROM {SOURCE}[Документы.СчетНаОплатуПокупателю] d" + where, params)
        count = cursor.fetchone()[0]
        cursor.execute(HEADER_SQL + where + " ORDER BY d.Дата DESC, d.Ссылка OFFSET %s ROWS FETCH NEXT 50 ROWS ONLY", params + [(page - 1) * 50])
        return Response({"contractor": contractor_guid, "items": fetch_rows(cursor), "count": count, "page": page, "page_size": 50})
