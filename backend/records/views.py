from django.shortcuts import render

from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


import re
# Вам потрібно переконатися, що 'import re' додано на початку вашого файлу Django views.

def parse_reclamation_details(text):
    """
    Витягує Дату доставки, Дату визначення та Опис рекламації з неструктурованого тексту.
    Опис витягується лише якщо присутній маркер 'Опис рекламації:'.
    """
    if not text:
        return {}

    # 1. Пошук дат
    date_delivery_match = re.search(r"Дата доставки:\s*([\d\.\s:]+)", text, re.IGNORECASE)
    date_determination_match = re.search(r"Дата визначення рекламації\s*:\s*([\d\.\s:]+)", text, re.IGNORECASE)

    # 2. Пошук маркерів
    order_prefix_match = re.search(
        r"(Заказ покупателя|Заказ покупателя претензия)\s*[\d\w-]+\s*(dated|от)",
        text,
        re.IGNORECASE
    )
    description_prefix_match = re.search(r"Опис рекламації:\s*", text, re.IGNORECASE)

    # 🔹 Якщо маркера "Опис рекламації:" немає — не парсимо опис
    if not description_prefix_match:
        return {
            'ParsedDeliveryDate': date_delivery_match.group(1).strip() if date_delivery_match else None,
            'ParsedDeterminationDate': date_determination_match.group(1).strip() if date_determination_match else None,
            'ParsedDescription': None
        }

    # 3. Якщо є — визначаємо межі опису
    start_index = description_prefix_match.end()
    end_index = order_prefix_match.start() if order_prefix_match else len(text)

    raw_description = text[start_index:end_index].strip()

    # 4. Очищення
    clean_description = re.sub(
        r"Дата доставки:\s*[\d\.\s:]+|Дата визначення\s*:\s*[\d\.\s:]+|Номер замовлення\s*:\s*[\d\w\s-]*",
        "",
        raw_description,
        flags=re.IGNORECASE
    ).strip()

    return {
        'ParsedDeliveryDate': date_delivery_match.group(1).strip() if date_delivery_match else None,
        'ParsedDeterminationDate': date_determination_match.group(1).strip() if date_determination_match else None,
        'ParsedDescription': clean_description if clean_description else None,
    }



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def complaints_view(request):
    try:
        user_id = request.user.id
    except AttributeError:
        return JsonResponse({"error": "Invalid user object"}, status=400)

    # Отримуємо рік із GET-параметра або беремо поточний
    year_str = request.GET.get("year")
    try:
        year = int(year_str) if year_str else None
    except ValueError:
        return JsonResponse({"error": "Invalid year format"}, status=400)

    with connection.cursor() as cursor:
        # Викликаємо процедуру
        cursor.execute("""
            EXEC [dbo].[GetComplaintsFull] 
                @User_ID = %s, 
                @Year = %s
        """, [user_id, year])

        # Отримуємо дані (якщо процедура повертає SELECT)
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]


    # safe_rows = decode_bytes(rows)

    # Крок 2: Парсинг додаткової інформації та додавання нових полів
    processed_rows = []
    for row in rows:
        # Поле, в якому зберігаються всі неструктуровані дані
        full_text = row.get('AdditionalInformation')
        
        # Парсинг, навіть якщо AdditionalInformation є None або порожнє
        parsed_info = parse_reclamation_details(full_text)
        
        # Додаємо нові, розпаршені поля до словника
        row['DeliveryDateText'] = parsed_info.get('ParsedDeliveryDate')
        row['DeterminationDateText'] = parsed_info.get('ParsedDeterminationDate')
        
        # Якщо в AdditionalInformation не було знайдено явного "Опису рекламації:",
        # залишаємо оригінальний AdditionalInformation в описі.
        row['ParsedDescription'] = parsed_info.get('ParsedDescription') or full_text
        
        processed_rows.append(row)

    return JsonResponse({
        "status": "success",
        "data": rows
    })



from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime

def format_date_human(date_str):
    if not date_str:
        return None
    try:
        date = datetime.fromisoformat(date_str)
        return date.strftime("%d %b %Y")  # наприклад, "14 Nov 2025"
    except ValueError:
        return None

def get_orders_by_year_and_contractor(year: int, contractor_id: str):
    """
    Викликає SQL-процедуру [GetOrdersByYearAndContractor] 
    та повертає результат у вигляді готової структури для фронту.
    
    Якщо CalculationDate відсутня, використовує найранішу OrderDate.
    """
    query = """
        EXEC [GetOrdersByYearAndContractor] @Year=%s, @Contractor_ID=%s
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [year, contractor_id])
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    calcs_dict = {}
    for row in rows:
        calc_id = row.get("ClientOrderNumber") or "default"
        
        current_order_count = int(row.get("ConstructionsCount") or 0) 
        calculation_date = row.get("CalculationDate")
        order_date = row.get("OrderDate")
        
        if calc_id not in calcs_dict:
            calcs_dict[calc_id] = {
                "id": calc_id,
                "number": row.get("ClientOrderNumber") or "",
                "dateRaw": calculation_date,
                "date": calculation_date, # Буде оновлено пізніше, якщо потрібно
                "orders": [],
                "dealer": row.get("Customer"),
                "constructionsQTY": current_order_count, 
                "file": row.get("File"),
                "message": row.get("Message"),
                "raw_order_dates": [order_date] if order_date else [], # Тимчасове поле для дат
            }
        else:
            calcs_dict[calc_id]["constructionsQTY"] += current_order_count
            if order_date:
                 calcs_dict[calc_id]["raw_order_dates"].append(order_date)


        # Додаємо ордер до масиву
        order = {
            "id": row.get("OrderID"),
            "number": row.get("OrderNumber") or "",
            "dateRaw": row.get("OrderDate"),
            "date": row.get("OrderDate"),
            "status": row.get("OrderStage") or "Новий",
            "amount": float(row.get("OrderSum") or 0),
            "count": current_order_count,
            "paid": float(row.get("PaidAmount") or 0),
            "planProductionMin": row.get("ProductionDateMin"),
            "planProductionMax": row.get("ProductionDateMax"),
            "factProductionMin": row.get("ProductionStartDateMin"),
            "factProductionMax": row.get("ProductionStartDateMax"),
            "factReadyMin": row.get("ProductionReadyDateMin"),
            "factReadyMax": row.get("ProductionReadyDateMax"),
            "realizationDate": row.get("SaleDate"),
            "quantityRealized": float(row.get("SoldQuantity") or 0),
            "deliveryAddress": row.get("DeliveryAddress") or "",
            "planDeparture": row.get("PlannedDepartureDate"),
            "goodsInDelivery": int(row.get("ItemsInDeliveryCount") or 0),
            "arrivalTime": row.get("ArrivalTime"),
            "routeStatus": row.get("RouteStatus"),
        }
        calcs_dict[calc_id]["orders"].append(order)

    # --- Обчислюємо агрегати ---
    formatted_calcs = []
    for calc in calcs_dict.values():
        orders = calc["orders"]
        status_counts = {}
        total_amount = 0
        total_paid = 0

        # ВИЗНАЧЕННЯ ДАТИ ПРОРАХУНКУ, ЯКЩО ВОНА ВІДСУТНЯ
        if not calc["dateRaw"] and calc["raw_order_dates"]:
            # Знаходимо найменшу (найранішу) дату серед замовлень
            min_date = min(
                (d for d in calc["raw_order_dates"] if d), default=None
            )
            calc["dateRaw"] = min_date
            calc["date"] = min_date 
        
        # Видаляємо тимчасове поле
        del calc["raw_order_dates"]
        
        # Агрегати на рівні ордера (статуси, суми)
        for o in orders:
            st = o["status"]
            if st:
                status_counts[st] = status_counts.get(st, 0) + 1
            if st != "Відмова":
                total_amount += o["amount"]
                total_paid += o["paid"]

        # Агрегати на рівні просчету
        calc["statuses"] = status_counts
        calc["orderCountInCalc"] = len(orders)
        calc["constructionsCount"] = calc["constructionsQTY"] 
        calc["amount"] = total_amount
        calc["debt"] = total_amount - total_paid

        formatted_calcs.append(calc)

    return formatted_calcs

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_get_orders(request):
    year = int(request.GET.get("year"))
    contractor_id = request.user.user_id_1C 

    data = get_orders_by_year_and_contractor(year, contractor_id)
    return Response({"status": "success", "data": {"calculation": data}})
