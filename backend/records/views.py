from django.shortcuts import render

from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


from rest_framework.response import Response
from rest_framework import status

from .models import Message
from .serializers import MessageSerializer


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

    # Отримуємо рік із GET-параметра або беремо поточний
    year_str = request.GET.get("year")
    contractor_id_guid = request.GET.get("contractor")
    contractor_id = guid_to_1c_bin(contractor_id_guid)
    try:
        year = int(year_str) if year_str else None
    except ValueError:
        return JsonResponse({"error": "Invalid year format"}, status=400)

    with connection.cursor() as cursor:
        # Викликаємо процедуру
        cursor.execute("""
            EXEC [dbo].[GetComplaintsFull] 
                @User1C_ID = %s, 
                @Year = %s
        """, [contractor_id, year])

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
                "webNumber": row.get("WebNumber") or "",
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
            "idGuid": row.get("OrderID_GUID"),
            # "id": row.get("OrderID"),
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
            "organizationName": row.get("OrganizationName"),
            "managerName": row.get("ManagerName"),
            
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
    contractor_id_guid = request.GET.get("contractor_guid")
    contractor_id = guid_to_1c_bin(contractor_id_guid)



    data = get_orders_by_year_and_contractor(year, contractor_id)
    return Response({"status": "success", "data": {"calculation": data}})



# from django.db import connection
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def additional_orders_view(request):
#     """
#     Повертає дозакази користувача у потрібному JSON-форматі.
#     """
#     try:
#         user_id = request.user.id
#     except AttributeError:
#         return Response({"error": "Invalid user object"}, status=400)

#     year_str = request.GET.get("year")
#     try:
#         year = int(year_str) if year_str else None
#     except ValueError:
#         return Response({"error": "Invalid year format"}, status=400)

#     with connection.cursor() as cursor:
#         cursor.execute("""
#             EXEC [dbo].[GetAdditionalOrder] 
#                 @User_ID = %s,
#                 @Year = %s
#         """, [user_id, year])

#         columns = [col[0] for col in cursor.description]
#         rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

#     # Групуємо дозакази та формуємо структуру для фронту
#     orders_dict = {}
#     for row in rows:
#         main_order_number = row.get("OrderNumber") or "unknown"
#         add_order_id = f"{row.get('AdditionalOrderNumber') or '000'}"
#         if add_order_id not in orders_dict:
#             orders_dict[add_order_id] = {
#                 "id": add_order_id,
#                 "number": f"Дод. Замовлення {row.get('AdditionalOrderNumber') or '000'}",
#                 "mainOrderNumber": main_order_number,
#                 "date": row.get("AdditionalOrderDate") or None,
#                 "mainOrderDate": row.get("MainOrderDate") or None,
#                 # "date": row.get("Дата"),  # залишаємо як є (можна форматувати)
#                 "constructionsQTY": int(row.get("ConstructionsQTY") or 0),
#                 "dealer": row.get("Customer") or "",
#                 "debt": float(row.get("DocumentAmount") or 0) - float(row.get("TotalPayments") or 0),
#                 "file": row.get("File") or "",
#                 "message": row.get("Message") or "",
#                 "orderCountInCalc": 0,
#                 # "constructionsCount": int(row.get("БВ_КоличествоКонструкций") or 0),
#                 "amount": float(row.get("DocumentAmount") or 0),
#                 "orders": [],
#                 "statuses": {}
#             }

#         # Додаємо вкладені замовлення
#         order_item = {
#             "id": f"{row.get('ClaimOrderNumber') or '000'}",
#             "number": row.get("ClaimOrderNumber") or "",
#             # "dateRaw": row.get("ClaimOrderDate") or None,
#             "date": row.get("ClaimOrderDate"),
#             "status": row.get("StatusName") or "Новий",
#             "amount": float(row.get("DocumentAmount") or 0),
#             "count": int(row.get("ConstructionsQTY") or 0),
#             "paid": float(row.get("TotalPayments") or 0),
#             "realizationDate": row.get("SoldDate"),
#             # "deliveryAddress": row.get("DeliveryAddress") or "",
#         }

#         # Оновлюємо агрегати
#         add_order = orders_dict[add_order_id]
#         add_order["orders"].append(order_item)
#         add_order["orderCountInCalc"] = len(add_order["orders"])
#         add_order["constructionsCount"] += int(row.get("ConstructionsQTY") or 0)
#         # Статуси
#         st = order_item["status"]
#         add_order["statuses"][st] = add_order["s]()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def additional_orders_view(request):
    """
    Повертає дозакази користувача у потрібному JSON-форматі.
    Кожен рядок SQL-процедури розглядається як одне Додаткове Замовлення (Претензія).
    """
    try:
        user_id = request.user.id
    except AttributeError:
        return Response({"error": "Invalid user object"}, status=400)

    year_str = request.GET.get("year")
    try:
        year = int(year_str) if year_str else None
    except ValueError:
        return Response({"error": "Invalid year format"}, status=400)

    # --- ФУНКЦІЯ-ПОМІЧНИК ДЛЯ ОЧИЩЕННЯ ДАТИ ---
    def clean_date_stub(date_value):
        """Перевіряє, чи не є значення датою-заглушкою, інакше повертає None."""
        if not date_value:
            return None
        
        date_str = str(date_value).strip()
        
        # Дати-заглушки можуть бути: 0001-01-01, 2001-01-01, або 1753-01-01 (SQL min date)
        # Перевіряємо лише перші 10 символів (YYYY-MM-DD)
        if date_str.startswith('0001-01-01') or date_str.startswith('2001-01-01') or date_str.startswith('1753-01-01'):
            return None
        
        return date_value
    # ------------------------------------------

    with connection.cursor() as cursor:
        cursor.execute("""
            EXEC [dbo].[GetAdditionalOrder] 
                @User_ID = %s,
                @Year = %s
        """, [user_id, year])

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    formatted_orders = []
    
    for row in rows:
        # Парсинг AdditionalInformation
        full_text = row.get('AdditionalInformation')
        # parse_reclamation_details повинна бути імпортована
        parsed_info = parse_reclamation_details(full_text) 
        # Припускаємо, що parsed_info.get('ParsedDescription') повертає None, якщо не знайдено
        # parsed_info = {'ParsedDescription': None} 
        
        # Використовуємо ComplaintNumber як унікальний ID дозамовлення
        complaint_number = row.get("AdditionalOrderNumber") or "unknown"
        order_sum = float(row.get("DocumentAmount") or 0)
        total_paid = float(row.get("TotalPayments") or 0)
        status_name = row.get("StatusName") or "Новий"
        constructions_qty = int(row.get("ConstructionsQTY") or 0)

        # Очищення всіх дат від заглушок
        main_order_date = clean_date_stub(row.get('MainOrderDate'))
        additional_order_date = clean_date_stub(row.get("AdditionalOrderDate"))
        claim_order_date = clean_date_stub(row.get("ClaimOrderDate"))
        sold_date = clean_date_stub(row.get("SoldDate"))
        date_launched = clean_date_stub(row.get("DateLaunched"))
        date_transferred = clean_date_stub(row.get("DateTransferredToWarehouse"))
        produced_date = clean_date_stub(row.get("ProducedDate"))
        
        # Створення основного об'єкта дод. замовлення (для фронту це "calc")
        additional_order = {
            "id": complaint_number,
            "number": f"{complaint_number}",
            "numberWEB": row.get('NumberWEB'),
            "mainOrderNumber": row.get('OrderNumber'),
            "mainOrderDate": main_order_date, # 🔥 ОЧИЩЕНО
            "dateRaw": additional_order_date, # 🔥 ОЧИЩЕНО
            "date": additional_order_date, # 🔥 ОЧИЩЕНО
            "dealer": row.get("Customer") or row.get("OrganizationName") or "",
            "managerName": row.get("LastManagerName"),
            "organizationName": row.get("OrganizationName"),
            "debt": order_sum - total_paid,
            "file": None, 
            "message": parsed_info.get('ParsedDescription') or full_text,
            "orderCountInCalc": 1, 
            "constructionsCount": constructions_qty,
            "constructionsQTY": constructions_qty,
            "amount": order_sum,
            "statuses": {status_name: 1}, 
            "orders": [
                {
                    # Використовуємо ComplaintNumber, якщо ClaimOrderNumber порожній/недійсний
                    "id": row.get('ClaimOrderNumber') or complaint_number, 
                    "number": row.get('ClaimOrderNumber') or "", # Порожній рядок, якщо номер претензії порожній (для фронту)
                    "dateRaw": claim_order_date, # 🔥 ОЧИЩЕНО
                    "date": claim_order_date, # 🔥 ОЧИЩЕНО
                    "status": status_name,
                    "amount": order_sum,
                    "count": constructions_qty,
                    "paid": total_paid,
                    "realizationDate": sold_date, # 🔥 ОЧИЩЕНО
                    "routeStatus": row.get("RouteStatus"),
                    "seriesList": row.get("SeriesList"),
                    "resolutionPaths": row.get('ResolutionPaths'),
                    "organizationName": row.get("OrganizationName"),
                    "planProduction": date_launched, # 🔥 ОЧИЩЕНО
                    "factStartProduction" : date_transferred, # 🔥 ОЧИЩЕНО
                    "factReady" : produced_date, # 🔥 ОЧИЩЕНО
                }
            ],
        }
        
        formatted_orders.append(additional_order)

    return Response({
        "status": "success",
        "data": {"calculation": formatted_orders} 
    })


from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


from django.http import JsonResponse
from django.db import connection, DatabaseError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_files_view(request, order_guid):
    """
    Отримує всі файли (ZKZ, фото, документи) для замовлення через SQL.
    Повертає список файлів для React-модалки.
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetOrdersFiles @OrderLinkGUID=%s",
                [order_guid]
            )

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        files = [
            {
                "fileGuid": row_dict["File_GUID"],
                "fileName": row_dict["File_FileName"],
                "type": row_dict["File_DataType_Name"],
                "date": row_dict["File_Date"],
            }
            for row_dict in (dict(zip(columns, row)) for row in rows)
        ]

        return JsonResponse(
            {"status": "success", "files": files},
            status=200
        )

    except DatabaseError as e:
        logger.exception("DB error in order_files_view")
        return JsonResponse(
            {
                "status": "error",
                "message": "Помилка отримання файлів замовлення"
            },
            status=500
        )

    except Exception as e:
        logger.exception("Unexpected error in order_files_view")
        return JsonResponse(
            {
                "status": "error",
                "message": "Внутрішня помилка сервера"
            },
            status=500
        )


import subprocess
from django.http import StreamingHttpResponse, Http404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# Вам необхідно додати ці імпорти на початку Django views.py
# from django.conf import settings
# import subprocess


# ======================== ТИМЧАСОВИЙ КОД ДЛЯ ДІАГНОСТИКИ ========================
import subprocess
from django.http import StreamingHttpResponse, Http404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

import subprocess
import logging
from django.http import StreamingHttpResponse, Http404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.GuidToBin1C import guid_to_1c_bin


logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_order_file(request, order_guid, file_guid, filename):
    server = settings.SMB_SERVER
    share = settings.SMB_SHARE
    username = settings.SMB_USERNAME
    password = settings.SMB_PASSWORD

    full_username = f"VSTG\\{username}"

    # Кириличний шлях у 1С
    remote_path = f'Заказ покупателя/{order_guid}/{file_guid}/{filename}'

    try:
        process = subprocess.Popen(
            [
                "smbclient",
                f"//{server}/{share}",
                "-U", full_username,
                "-c", f'get "{remote_path}" -'
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={"PASSWD": password},
        )


        stderr = process.stderr.read()

        if stderr:
            error_msg = stderr.decode("utf-8", errors="ignore")
            logger.error("SMB error: %s", error_msg)

            raise Http404("Файл не знайдено або доступ заборонено")

        response = StreamingHttpResponse(
            streaming_content=process.stdout,
            content_type="application/octet-stream"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        return response

    except FileNotFoundError:
        logger.exception("smbclient not installed")
        raise Http404("Сервіс завантаження файлів недоступний")

    except Exception as e:
        logger.exception("Download error")
        raise Http404(f"Помилка доступу до файлу")




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_message(request):
    serializer = MessageSerializer(data=request.data)

    if serializer.is_valid():
        message = serializer.save()
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


