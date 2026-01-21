from django.shortcuts import render

from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from backend.utils.BinToGuid1C import bin_to_guid_1c
from .utils import get_author_from_1c
from rest_framework.response import Response
from rest_framework import status

from .models import Message
# from .serializers import MessageSerializer
from backend.permissions import  IsAdminJWTOr1CApiKey, IsAuthenticatedOr1CApiKey
from backend.utils.BinToGuid1C import convert_row

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, inline_serializer, OpenApiResponse, OpenApiExample
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes

from drf_spectacular.types import OpenApiTypes
import re

from backend.permissions import IsAdminJWT
from .serializers import MessageCreateSerializer
from .services.messages import save_message
from backend.users.models import CustomUser


from backend.utils.contractor import resolve_contractor
from backend.utils.api_helpers import safe_view
from backend.utils.dates import parse_date, clean_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from backend.permissions import IsAuthenticatedOr1CApiKey

from django.http import JsonResponse
from django.db import connection
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin
from django.http import JsonResponse
from django.db import connection


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




@extend_schema(
    summary="Get complaints by contractor",
    description=(
        "Повертає рекламації за контрагентом.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT:\n"
        "  - admin → може передати contractor\n"
        "  - інші ролі → тільки свій контрагент\n"
        "- 1C API key → автоматично використовується UserId1C\n\n"
        "📌 **Параметри:**\n"
        "- contractor — GUID контрагента (обовʼязково ТІЛЬКИ для admin)\n"
        "- year — рік (необовʼязково)"
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (обовʼязково ТІЛЬКИ для admin через JWT, інакше ігнорується)",
        ),
        OpenApiParameter(
            name="year",
            type=int,
            location=OpenApiParameter.QUERY,
            required=False,
            description="Рік (якщо не передано — всі роки)",
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def complaints_view(request):

    contractor_bin, _ = resolve_contractor(request)
    year = int(request.GET.get("year")) if request.GET.get("year") else None

    with connection.cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetComplaintsFull @User1C_ID=%s, @Year=%s",
            [contractor_bin, year]
        )

        columns = [c[0] for c in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor.fetchall()]

    for row in rows:
        if row.get("ComplaintGuid"):
            row["ComplaintGuid"] = bin_to_guid_1c(row["ComplaintGuid"])
            row["CustomerLink"] = bin_to_guid_1c(row["CustomerLink"])

        full_text = row.get("AdditionalInformation")
        parsed_info = parse_reclamation_details(full_text)

        row["DeliveryDateText"] = parsed_info.get("ParsedDeliveryDate")
        row["DeterminationDateText"] = parsed_info.get("ParsedDeterminationDate")
        row["ParsedDescription"] = (
            parsed_info.get("ParsedDescription") or full_text
        )

    return Response({"status": "success", "data": rows})





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
                "dealerId": bin_to_guid_1c(row.get("ContractorID")),
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



@extend_schema(
    summary="Отримання інформації про замовлення",
    description="Повертає список замовлень за вказаний рік для конкретного контрагента.",
    parameters=[
        OpenApiParameter(
            name="year",
            type=int,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Рік (наприклад, 2025)",
        ),
        OpenApiParameter(
            name="contractor_guid",
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def api_get_orders(request):
    # ---------- PARAMS ----------
    year_str = request.GET.get("year")
    if not year_str:
        return Response({"error": "year is required"}, status=400)

    try:
        year = int(year_str)
    except ValueError:
        return Response({"error": "Invalid year"}, status=400)

    # ---------- 🔐 CONTRACTOR (DRY) ----------
    try:
        contractor_bin, _ = resolve_contractor(
            request,
            allow_admin=True,
            admin_param="contractor_guid",
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except PermissionError as e:
        return Response({"detail": str(e)}, status=403)

    # ---------- 📦 DATA ----------
    data = get_orders_by_year_and_contractor(year, contractor_bin)

    return Response({
        "status": "success",
        "data": {
            "calculation": data
        }
    })


@extend_schema(
    summary="Повертає дозакази (Additional Orders)",
    description=(
        "Повертає дозакази за контрагентом.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT admin → може передати contractor\n"
        "- JWT dealer/customer → тільки свій контрагент\n"
        "- 1C API key → автоматично по UserId1C\n\n"
        "📌 **Параметри:**\n"
        "- contractor — GUID контрагента (обовʼязково ТІЛЬКИ для admin)\n"
        "- year — рік (необовʼязково)"
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            description="GUID контрагента (тільки для admin)",
            required=False,
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="year",
            description="Рік (необовʼязково). Якщо не передано — всі роки",
            required=False,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def additional_orders_view(request):
    # -------------------------------------------------
    # PARAMS
    # -------------------------------------------------
    year = int(request.GET.get("year")) if request.GET.get("year") else None

    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, _ = resolve_contractor(request)

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetAdditionalOrder
                @User1C_ID = %s,
                @Year = %s
            """,
            [contractor_bin, year]
        )

        columns = [c[0] for c in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor.fetchall()]

    # -------------------------------------------------
    # 🎛 FORMAT DATA
    # -------------------------------------------------
    formatted = []

    for r in rows:
        if r.get("AdditionalOrderGuid"):
            r["AdditionalOrderGuid"] = bin_to_guid_1c(r["AdditionalOrderGuid"])

        parsed = parse_reclamation_details(r.get("AdditionalInformation"))

        order_sum = float(r.get("DocumentAmount") or 0)
        total_paid = float(r.get("TotalPayments") or 0)
        qty = int(r.get("ConstructionsQTY") or 0)
        status = r.get("StatusName") or "Новий"
        number = r.get("AdditionalOrderNumber") or "unknown"

        formatted.append({
            "guid": r.get("AdditionalOrderGuid"),
            "id": number,
            "number": number,
            "numberWEB": r.get("NumberWEB"),
            "mainOrderNumber": r.get("OrderNumber"),
            "mainOrderDate": clean_date(r.get("MainOrderDate")),
            "dateRaw": clean_date(r.get("AdditionalOrderDate")),
            "date": clean_date(r.get("AdditionalOrderDate")),
            "dealer": r.get("Customer") or r.get("OrganizationName") or "",
            "dealerId": bin_to_guid_1c(r.get("CustomerID")),
            "managerName": r.get("LastManagerName"),
            "organizationName": r.get("OrganizationName"),
            "debt": order_sum - total_paid,
            "file": None,
            "message": parsed.get("ParsedDescription") or r.get("AdditionalInformation"),
            "orderCountInCalc": 1,
            "constructionsCount": qty,
            "constructionsQTY": qty,
            "amount": order_sum,
            "statuses": {status: 1},
            "orders": [
                {
                    "id": r.get("ClaimOrderNumber") or number,
                    "number": r.get("ClaimOrderNumber") or "",
                    "dateRaw": clean_date(r.get("ClaimOrderDate")),
                    "date": clean_date(r.get("ClaimOrderDate")),
                    "status": status,
                    "amount": order_sum,
                    "count": qty,
                    "paid": total_paid,
                    "realizationDate": clean_date(r.get("SoldDate")),
                    "routeStatus": r.get("RouteStatus"),
                    "seriesList": r.get("SeriesList"),
                    "resolutionPaths": r.get("ResolutionPaths"),
                    "organizationName": r.get("OrganizationName"),
                    "planProduction": clean_date(r.get("DateLaunched")),
                    "factStartProduction": clean_date(r.get("DateTransferredToWarehouse")),
                    "factReady": clean_date(r.get("ProducedDate")),
                }
            ],
        })

    return Response({
        "status": "success",
        "data": {
            "calculation": formatted
        }
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



@extend_schema(
    summary="Отримати файли замовлення",
    description=(
        "Повертає **всі файли замовлення** (ZKZ, фото, документи), "
        "які зберігаються в 1С.\n\n"
        "📦 Дані отримуються через SQL-процедуру **dbo.GetOrdersFiles**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT (авторизований користувач порталу)\n"
        "- або 1C API Key\n\n"
        "🖥 Використовується для відображення файлів у React-модалці."
    ),
    parameters=[
        OpenApiParameter(
            name="order_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="GUID замовлення",
            required=True,
        ),
    ],
    responses={
        200: inline_serializer(
            name="OrderFilesResponse",
            fields={
                "status": serializers.CharField(
                ),
                "files": serializers.ListField(
                    child=inline_serializer(
                        name="OrderFileItem",
                        fields={
                            "fileGuid": serializers.CharField(
                                help_text="GUID файлу"
                            ),
                            "fileName": serializers.CharField(
                                help_text="Назва файлу"
                            ),
                            "type": serializers.CharField(
                                help_text="Тип файлу (ZKZ, фото, документ тощо)"
                            ),
                            "date": serializers.DateTimeField(
                                help_text="Дата додавання файлу"
                            ),
                        },
                    ),
                    help_text="Список файлів замовлення",
                ),
            },
        ),
    },
    tags=["order"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
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
            status=200,
            json_dumps_params={"ensure_ascii": False}
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
import subprocess
import logging
from urllib.parse import unquote
from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings

logger = logging.getLogger(__name__)
# views.py

import subprocess
import logging
import mimetypes
from urllib.parse import unquote

from django.conf import settings
from django.http import StreamingHttpResponse, Http404
from django.views.decorators.http import require_GET

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated




logger = logging.getLogger(__name__)



@extend_schema(
    summary="Завантажити файл замовлення",
    description=(
        "Завантажує **файл замовлення** (ZKZ, фото, документ) "
        "безпосередньо з файлового сховища **1С (SMB)**.\n\n"
        "📦 Файл зчитується зі спільного ресурсу 1С по шляху:\n"
        "`Заказ покупателя/{order_guid}/{file_guid}/{filename}`\n\n"
        "🔐 **Доступ:**\n"
        "- JWT (авторизований користувач порталу)\n"
        "- або **1C API Key**\n\n"
        "⚠️ **Обовʼязково:** параметр `filename` має бути переданий у query.\n\n"
        "⬇️ Відповідь повертається як **binary stream** з заголовком "
        "`Content-Disposition: attachment`."
    ),
    parameters=[
        OpenApiParameter(
            name="order_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="GUID замовлення",
            required=True,
        ),
        OpenApiParameter(
            name="file_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="GUID файлу замовлення",
            required=True,
        ),
        OpenApiParameter(
            name="filename",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Назва файлу (наприклад: СР42749.ZKZ)",
            required=True,
        ),
    ],
    responses={
        200: {
            "description": "Файл успішно завантажено (binary stream)",
            "content": {
                "application/octet-stream": {}
            },
        },
        401: OpenApiTypes.OBJECT,
        403: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT,
    },
    tags=["order"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def download_order_file(request, order_guid, file_guid):
    """
    Завантажує файл замовлення з SMB (1С).

    Обовʼязковий query-параметр:
        ?filename=СР42749.ZKZ
    """

    # =========================
    # PARAMS
    # =========================
    filename = request.GET.get("filename")
    if not filename:
        raise Http404("Filename is required")

    # decode кирилиці
    filename = unquote(filename)

    # =========================
    # SMB CONFIG
    # =========================
    server = settings.SMB_SERVER      # наприклад: "1c"
    share = settings.SMB_SHARE        # наприклад: "1c_data"
    username = settings.SMB_USERNAME  # наприклад: "tetiana.flora"
    password = settings.SMB_PASSWORD

    full_username = f"VSTG\\{username}"

    # =========================
    # SMB PATH (ПЕРЕВІРЕНИЙ)
    # =========================
    remote_path = (
        f'Заказ покупателя/{order_guid}/{file_guid}/{filename}'
    )

    # =========================
    # SMB DOWNLOAD
    # =========================
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

        stdout, stderr = process.communicate()

        if process.returncode != 0:
            logger.error(
                "SMB error (%s): %s",
                process.returncode,
                stderr.decode("utf-8", errors="ignore")
            )
            raise Http404("Файл не знайдено або доступ заборонено")

        # =========================
        # RESPONSE
        # =========================
        content_type, _ = mimetypes.guess_type(filename)
        content_type = content_type or "application/octet-stream"

        response = StreamingHttpResponse(
            stdout,
            content_type=content_type
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        return response

    except FileNotFoundError:
        logger.exception("smbclient not installed")
        raise Http404("Сервіс завантаження файлів недоступний")

    except Exception:
        logger.exception("Download error")
        raise Http404("Помилка доступу до файлу")


# @api_view(["POST"])
# @permission_classes([IsAuthenticatedOr1CApiKey])
# def create_message(request):
#     serializer = MessageSerializer(
#             data=request.data,
#             context={"request": request}
#         )


#     if serializer.is_valid():
#         message = serializer.save()
#         return Response(
#             MessageSerializer(message).data,
#             status=status.HTTP_201_CREATED
#         )

#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection

from backend.utils.BinToGuid1C import convert_row

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection

from backend.utils.BinToGuid1C import convert_row
from backend.utils.GuidToBin1C import guid_to_1c_bin

@extend_schema(
    summary="Повертає всі дозакази за місяць (ADMIN)",
    description=(
        "ADMIN ONLY.\n\n"
        "Повертає **всі дозакази** за вказаний рік і місяць.\n\n"
        "🔐 Доступ:\n"
        "- JWT (роль admin)\n"
        "- або 1C API Key\n\n"
        "📦 Структура відповіді **ідентична additional_orders_view**."
    ),
    parameters=[
        OpenApiParameter(
            name="year",
            description="Рік (наприклад 2025)",
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="month",
            description="Місяць (1–12)",
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
        ),
    ],
    auth=[
        {"jwtAuth": []},
    ],
    exclude=True
)
@api_view(["GET"])
@permission_classes([IsAdminJWT])
def get_additional_orders_info_all(request):
    """
    ADMIN ONLY
    Повертає ВСІ дозакази за місяць
    СТРУКТУРА = additional_orders_view
    """

    year = request.GET.get("year")
    month = request.GET.get("month")

    if not year or not month:
        return Response({"error": "year and month are required"}, status=400)

    try:
        year = int(year)
        month = int(month)
        if not 1 <= month <= 12:
            raise ValueError
    except ValueError:
        return Response({"error": "Invalid year or month"}, status=400)

    # ---------- helper ----------
    def clean_date_stub(date_value):
        if not date_value:
            return None
        s = str(date_value)
        if s.startswith(("0001-01-01", "2001-01-01", "1753-01-01")):
            return None
        return date_value
    # ---------------------------

    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC [dbo].[GetAdditionalOrdersByMonth_ForPortalUsers]
                @Year = %s,
                @Month = %s
            """,
            [year, month]
        )
        columns = [c[0] for c in cursor.description]
        raw_rows = cursor.fetchall()

    # ✅ ПРАВИЛЬНО формуємо rows
    rows = []
    for r in raw_rows:
        raw = dict(zip(columns, r))

        # ⬅️ ГАРАНТОВАНО зберігаємо binary GUID
        raw_guid = raw.get("AdditionalOrderGuid")

        if isinstance(raw_guid, memoryview):
            raw_guid = raw_guid.tobytes()

        raw["_AdditionalOrderGuid_raw"] = raw_guid

        rows.append(raw)

    formatted_orders = []

    for row in rows:
        full_text = row.get("AdditionalInformation")
        parsed_info = parse_reclamation_details(full_text)

        complaint_number = row.get("AdditionalOrderNumber") or "unknown"

        order_sum = float(row.get("DocumentAmount") or 0)
        total_paid = float(row.get("TotalPayments") or 0)
        constructions_qty = int(row.get("ConstructionsQTY") or 0)
        status_name = row.get("StatusName") or "Новий"

        additional_order_date = clean_date_stub(row.get("AdditionalOrderDate"))
        main_order_date = clean_date_stub(row.get("MainOrderDate"))
        claim_order_date = clean_date_stub(row.get("ClaimOrderDate"))

        sold_date = clean_date_stub(row.get("SoldDate"))
        date_launched = clean_date_stub(row.get("DateLaunched"))
        date_transferred = clean_date_stub(row.get("DateTransferredToWarehouse"))
        produced_date = clean_date_stub(row.get("ProducedDate"))

        raw_guid = row.get("_AdditionalOrderGuid_raw")
        additional_order_guid = bin_to_guid_1c(raw_guid) if raw_guid else None

        calc = {
            "guid": additional_order_guid,
            "id": complaint_number,
            "number": complaint_number,
            "numberWEB": row.get("NumberWEB"),
            "mainOrderNumber": row.get("OrderNumber"),
            "mainOrderDate": main_order_date,
            "dateRaw": additional_order_date,
            "date": additional_order_date,
            "dealer": row.get("Customer") or row.get("OrganizationName") or "",
            "dealerId": bin_to_guid_1c(row.get("CustomerID")),
            "managerName": row.get("ResponsibleName"),
            "organizationName": row.get("OrganizationName"),
            "debt": order_sum - total_paid,
            "file": None,
            "message": parsed_info.get("ParsedDescription") or full_text,
            "orderCountInCalc": 1,
            "constructionsCount": constructions_qty,
            "constructionsQTY": constructions_qty,
            "amount": order_sum,
            "statuses": {status_name: 1},
            "orders": [
                {
                    "id": row.get("ClaimOrderNumber") or complaint_number,
                    "number": row.get("ClaimOrderNumber") or "",
                    "dateRaw": claim_order_date,
                    "date": claim_order_date,
                    "status": status_name,
                    "amount": order_sum,
                    "count": constructions_qty,
                    "paid": total_paid,
                    "realizationDate": sold_date,
                    "routeStatus": row.get("RouteStatus"),
                    "seriesList": row.get("SeriesList"),
                    "resolutionPaths": row.get("ResolutionPaths"),
                    "organizationName": row.get("OrganizationName"),
                    "planProduction": date_launched,
                    "factStartProduction": date_transferred,
                    "factReady": produced_date,
                }
            ],
        }

        formatted_orders.append(calc)

    return Response({
        "status": "success",
        "data": {
            "calculation": formatted_orders
        }
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.db import connection

from backend.utils.BinToGuid1C import convert_row
# from .utils import parse_reclamation_details

@extend_schema(
    summary="Усі рекламації за місяць (ADMIN)",
    description=(
        "🔒 **ADMIN ONLY**\n\n"
        "Повертає **всі рекламації** за вказаний рік і місяць.\n\n"
        "**Доступ:**\n"
        "- JWT (користувач з роллю `admin`)\n"
        "- або 1C API Key\n\n"
        "**SQL:** `GetComplaintsFull_ByMonth`"
    ),
    parameters=[
        OpenApiParameter(
            name="year",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Рік (наприклад 2025)",
            required=True,
        ),
        OpenApiParameter(
            name="month",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Місяць (1–12)",
            required=True,
        ),
    ],
    auth=[
        {"jwtAuth": []},
    ],
    exclude=True
)
@api_view(["GET"])
@permission_classes([IsAdminJWT])
def complaints_view_all_by_month(request):
    """
    ADMIN ONLY
    Повертає ВСІ рекламації за МІСЯЦЬ
    SQL: GetComplaintsFull_ByMonth
    """

    year_str = request.GET.get("year")
    month_str = request.GET.get("month")

    if not year_str or not month_str:
        return JsonResponse(
            {"error": "year and month are required"},
            status=400
        )

    try:
        year = int(year_str)
        month = int(month_str)
        if not 1 <= month <= 12:
            raise ValueError
    except ValueError:
        return JsonResponse(
            {"error": "Invalid year or month"},
            status=400
        )

    # =========================
    # SQL
    # =========================
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC [dbo].[GetComplaintsFull_ByMonth]
                @Year = %s,
                @Month = %s
            """,
            [year, month]
        )

        columns = [col[0] for col in cursor.description]
        raw_rows = cursor.fetchall()

    processed_rows = []

    for r in raw_rows:
        row = dict(zip(columns, r))
        row["CustomerLink"] = bin_to_guid_1c(row["CustomerLink"])
        # =========================
        # GUID: BINARY(16) → string
        # =========================
        raw_guid = row.get("ComplaintGuid")

        if isinstance(raw_guid, memoryview):
            raw_guid = raw_guid.tobytes()

        if isinstance(raw_guid, (bytes, bytearray)):
            row["ComplaintGuid"] = bin_to_guid_1c(raw_guid)
        else:
            row["ComplaintGuid"] = None

        # =========================
        # PARSE AdditionalInformation
        # =========================
        full_text = row.get("AdditionalInformation")
        parsed_info = parse_reclamation_details(full_text)

        row["DeliveryDateText"] = parsed_info.get("ParsedDeliveryDate")
        row["DeterminationDateText"] = parsed_info.get("ParsedDeterminationDate")
        row["ParsedDescription"] = (
            parsed_info.get("ParsedDescription") or full_text
        )

        processed_rows.append(row)

    return JsonResponse({
        "status": "success",
        "data": processed_rows
    }, json_dumps_params={"ensure_ascii": False})




from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.db import connection




# from backend.utils.BinToGuid1C import convert_row
@extend_schema(
    summary="Усі замовлення за місяць (ADMIN)",
    description="Повертає ВСІ замовлення порталу за вказаний місяць",
    parameters=[
        OpenApiParameter(
            name="year",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Рік (наприклад 2025)",
            required=True,
        ),
        OpenApiParameter(
            name="month",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Місяць (1–12)",
            required=True,
        ),
    ],
    auth=[
        {"jwtAuth": []},
    ],
    exclude=True
)
@api_view(["GET"])
@permission_classes([IsAdminJWT])
def orders_view_all_by_month(request):
    """
    ADMIN ONLY
    Повертає ВСІ замовлення порталу за МІСЯЦЬ
    Структура ПОВНІСТЮ ідентична get_orders_by_year_and_contractor
    """


    year_str = request.GET.get("year")
    month_str = request.GET.get("month")

    if not year_str or not month_str:
        return JsonResponse({"error": "year and month are required"}, status=400)

    try:
        year = int(year_str)
        month = int(month_str)
        if not 1 <= month <= 12:
            raise ValueError
    except ValueError:
        return JsonResponse({"error": "Invalid year or month"}, status=400)

    # =====================================================
    # SQL
    # =====================================================
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC [dbo].[GetOrdersMonth]
                @Year = %s,
                @Month = %s
            """,
            [year, month]
        )
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # =====================================================
    # GROUP → CALCULATION (1:1 логіка)
    # =====================================================
    calcs_dict = {}

    for row in rows:
        calc_id = row.get("ClientOrderNumber") or "default"

        constructions_count = int(row.get("ConstructionsCount") or 0)
        calculation_date = row.get("CalculationDate")
        order_date = row.get("OrderDate")

        if calc_id not in calcs_dict:
            calcs_dict[calc_id] = {
                "id": calc_id,
                "number": row.get("ClientOrderNumber") or "",
                "webNumber": row.get("WebNumber") or "",
                "dateRaw": calculation_date,
                "date": calculation_date,
                "orders": [],
                "dealer": row.get("Customer"),
                "dealerId": bin_to_guid_1c(row.get("ContractorID")),
                "constructionsQTY": constructions_count,
                "file": row.get("File"),
                "message": row.get("Message"),
                "raw_order_dates": [order_date] if order_date else [],
            }
        else:
            calcs_dict[calc_id]["constructionsQTY"] += constructions_count
            if order_date:
                calcs_dict[calc_id]["raw_order_dates"].append(order_date)

        # ---------- ORDER ----------
        order = {
            "id": row.get("OrderID"),
            "idGuid": row.get("OrderID_GUID"),
            "number": row.get("OrderNumber") or "",
            "dateRaw": row.get("OrderDate"),
            "date": row.get("OrderDate"),
            "status": row.get("OrderStage") or "Новий",
            "amount": float(row.get("OrderSum") or 0),
            "count": constructions_count,
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

    # =====================================================
    # AGGREGATES
    # =====================================================
    formatted_calcs = []

    for calc in calcs_dict.values():
        orders = calc["orders"]
        status_counts = {}
        total_amount = 0
        total_paid = 0

        # 📌 дата прорахунку (fallback)
        if not calc["dateRaw"] and calc["raw_order_dates"]:
            min_date = min(d for d in calc["raw_order_dates"] if d)
            calc["dateRaw"] = min_date
            calc["date"] = min_date

        del calc["raw_order_dates"]

        for o in orders:
            st = o["status"]
            if st:
                status_counts[st] = status_counts.get(st, 0) + 1

            if st != "Відмова":
                total_amount += o["amount"]
                total_paid += o["paid"]

        calc["statuses"] = status_counts
        calc["orderCountInCalc"] = len(orders)
        calc["constructionsCount"] = calc["constructionsQTY"]
        calc["amount"] = total_amount
        calc["debt"] = total_amount - total_paid

        formatted_calcs.append(calc)

    # =====================================================
    # RESPONSE
    # =====================================================
    return JsonResponse(
        {
            "status": "success",
            "data": {
                "calculation": formatted_calcs
            }
        },
        json_dumps_params={"ensure_ascii": False},
        safe=False
    )


import json
import base64

from rest_framework import viewsets, status
from rest_framework.response import Response

@extend_schema(
    summary="Створення прорахунку та відправка в 1С",
    description=(
        "Створює новий прорахунок та відправляє його в 1С.\n\n"
        "📌 **Формат:** JSON (без multipart)\n"
        "📎 **Файл:** base64\n\n"
        "🔐 **Доступ:**\n"
        "- JWT (portal)\n"
        "- 1C API key\n\n"
        "❗ Контрагент:\n"
        "- admin / manager → передається в payload\n"
        "- dealer / api key → визначається автоматично"
    ),
    request=inline_serializer(
        name="CreateCalculationRequest",
        fields={
            "contractor_guid": serializers.UUIDField(
                required=False,
                allow_null=True,
                help_text="GUID контрагента (тільки для admin)"
            ),
            "order_number": serializers.CharField(),
            "items_count": serializers.IntegerField(),
            "delivery_address_guid": serializers.UUIDField(
                required=False,
                allow_null=True
            ),
            "comment": serializers.CharField(
                required=False,
                allow_blank=True
            ),
            "file": inline_serializer(
                name="CalculationFile",
                fields={
                    "fileName": serializers.CharField(),
                    "fileDataB64": serializers.CharField(),
                }
            ),
        }
    ),
    responses={201: ..., 400: ...},
    tags={"order"}
)
class CreateCalculationViewSet(viewsets.ViewSet):

    permission_classes = [IsAuthenticatedOr1CApiKey]

    def create(self, request):
        try:
            # ---------- 🔐 CONTRACTOR (DRY, ЄДИНЕ МІСЦЕ) ----------
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )

            order_number = request.data.get("order_number")
            items_count = request.data.get("items_count")
            comment = request.data.get("comment", "")
            address_guid = request.data.get("delivery_address_guid")

            if not order_number:
                raise ValueError("order_number обовʼязковий")

            # ---------- FILE ----------
            file_data = request.data.get("file")
            if not file_data:
                raise ValueError("Файл прорахунку обовʼязковий")

            file_name = file_data.get("fileName")
            file_b64 = file_data.get("fileDataB64")

            if not file_name or not file_b64:
                raise ValueError("Некоректні дані файлу")

            try:
                base64.b64decode(file_b64)
            except Exception:
                raise ValueError("Невалідний base64 у файлі")

            # ---------- PAYLOAD ДЛЯ 1С ----------
            payload = {
                "kontragentGUID": contractor_guid,
                "orderNumber": order_number,
                "itemsCount": int(items_count),
                "addressGUID": address_guid,
                "comment": comment,
                "file": {
                    "fileName": file_name,
                    "fileDataB64": file_b64,
                }
            }

            result = self._send_to_1c(payload)

            if not result.get("success"):
                raise ValueError("1C не змогла створити прорахунок")

            return Response({"success": True}, status=201)

        except Exception as e:
            return Response(
                {"success": False, "error": str(e)},
                status=400
            )

    def _send_to_1c(self, payload):
        """
        MOCK 1C (JSON → JSON)
        """

        print("📤 PAYLOAD TO 1C:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))

        return {
            "success": True,
            # "calculationGuid": f"mock-{payload['orderNumber']}",
        }

        # 🔥 КОЛИ БУДЕ РЕАЛЬНА 1C:
        # response = requests.post(
        #     "https://1c-endpoint/calculations",
        #     json=payload,
        #     timeout=20
        # )
        # response.raise_for_status()
        # return response.json()



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection


@extend_schema(
    summary="Адреси дилера (доставка / юридичні)",
    description=(
        "Повертає список **адрес дилера** (доставка та/або юридичні).\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetDealerAddresses**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT:\n"
        "  - admin   → можуть передати contractor\n"
        "  - customer / dealer → тільки свій контрагент\n"
        "- 1C API Key → автоматично по UserId1C\n\n"
        "📥 **Параметри:**\n"
        "- `contractor` — GUID контрагента (обовʼязково ТІЛЬКИ для admin)"
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="GUID контрагента (тільки для admin )",
            required=False,
        ),
    ],
    tags=["Dealer information"],
    auth=[
        {"jwtAuth": []},
        {"ApiKeyAuth": []},
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_dealer_addresses(request):

    contractor_bin, _ = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor"
    )

    with connection.cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetDealerAddresses @ContractorLink=%s",
            [contractor_bin]
        )
        columns = [c[0] for c in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor.fetchall()]

    return Response({"success": True, "addresses": rows})



# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection

from datetime import datetime
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@extend_schema(
    summary="Отримати WDS-коди по контрагенту",
    description=(
        "Повертає список **WDS-кодів** для контрагента.\n\n"
        "📌 Дані отримуються з процедури **dbo.GetWDSCodes_ByContractor**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT:\n"
        "  - admin → може передати contractor\n"
        "  - dealer / customer → тільки свій контрагент\n"
        "- 1C API Key → автоматично по UserId1C\n\n"
        "📅 Можна обмежити вибірку датами (`date_from`, `date_to`).\n"
        "Формат дат: **YYYY-MM-DD**."
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            description="GUID контрагента (обовʼязковий ТІЛЬКИ для admin)",
            required=False,
        ),
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Дата початку періоду (YYYY-MM-DD)",
            required=False,
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Дата кінця періоду (YYYY-MM-DD)",
            required=False,
        ),
    ],
    tags=["Dealer information"],
    auth=[
        {"jwtAuth": []},
        {"ApiKeyAuth": []},
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def wds_codes_by_contractor(request):

    contractor_bin, contractor_guid = resolve_contractor(request)

    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetWDSCodes_ByContractor
                @Контрагент = %s,
                @DateFrom   = %s,
                @DateTo     = %s
            """,
            [contractor_bin, date_from, date_to]
        )

        columns = [c[0] for c in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor.fetchall()]

    return Response({
        "contractor": contractor_guid,
        "date_from": request.GET.get("date_from"),
        "date_to": request.GET.get("date_to"),
        "count": len(rows),
        "items": rows
    })






@extend_schema(
    summary="Створити коментар до транзакції",
   description="""
Створює новий коментар для транзакції (замовлення, додаткового замовлення тощо).

Коментар привʼязується до:

• Типу транзакції (`transaction_type_id`):
  - **1** — Прорахунок (прорахунок клієнта)
  - **2** — Рекламація (рекламація клієнта)
  - **3** — Доп. замовлення (додаткове замовлення клієнта)

• Конкретного документа 1C (`base_transaction_guid`)


""",
    request=MessageCreateSerializer,
    responses={
        201: OpenApiResponse(
            description="Коментар успішно створений",
            examples=[
                OpenApiExample(
                    name="Success",
                    value={
                        "id": 54,
                        "created_at": "2026-01-14T10:06:51Z",
                        "message": "Текст коментаря",
                        "author": {
                            "username": "shop_ruta",
                            "full_name": "Магазин Рута"
                        }
                    },
                )
            ],
        ),
        400: OpenApiResponse(
            description="Помилка валідації",
            examples=[
                OpenApiExample(
                    name="Validation error",
                    value={"error": "Invalid input data"},
                )
            ],
        ),
        401: OpenApiResponse(
            description="Неавторизовано",
            examples=[
                OpenApiExample(
                    name="Unauthorized",
                    value={"detail": "Authentication credentials were not provided."},
                )
            ],
        ),
    },
    tags=["Messages"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def create_message(request):
    serializer = MessageCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    is_1c = request.auth == "1C_API_KEY"

    # 🔐 ВИЗНАЧАЄМО АВТОРА
    writer_id_1c = None

    if is_1c:
        # 🔑 1C API key → writer = user.user_id_1C
        writer_id_1c = getattr(user, "user_id_1C", None)
        if not writer_id_1c:
            raise PermissionError("API key user has no UserId1C")
    else:
        # 🔐 JWT → writer = поточний користувач
        writer_id_1c = getattr(user, "user_id_1C", None)

    # ❗ writer може бути None (наприклад, системні коментарі)
    message = save_message(
        transaction_type_id=serializer.validated_data["transaction_type_id"],
        base_transaction_guid=serializer.validated_data.get("base_transaction_guid"),
        message_text=serializer.validated_data["message"],
        writer_guid=bin_to_guid_1c(writer_id_1c) if writer_id_1c else None,
    )

    # 👤 ФОРМУЄМО АВТОРА ДЛЯ ВІДПОВІДІ
    author = None
    if writer_id_1c:
        user_obj = CustomUser.objects.filter(user_id_1C=writer_id_1c).first()
        if user_obj:
            author = {
                "username": user_obj.username,
                "full_name": (
                    user_obj.full_name
                    or f"{user_obj.first_name} {user_obj.last_name}".strip()
                )
            }

    return Response(
        {
            "id": message.id,
            "created_at": message.created_at,
            "message": message.message,
            "author": author
        },
        status=201
    )



# records/views.py



@extend_schema(
    summary="Отримати історію коментарів транзакції",
    description="""
Повертає список коментарів для заданої транзакції.

Коментарі:
- фільтруються за `base_transaction_guid`
- фільтруються за `transaction_type_id`
- відсортовані за датою створення (від старих до нових)

""",
    parameters=[
        OpenApiParameter(
            name="base_transaction_guid",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="GUID транзакції з 1C",
        ),
        OpenApiParameter(
            name="transaction_type_id",
            type=int,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Тип транзакції",
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Список коментарів",
            examples=[
                OpenApiExample(
                    name="Success",
                    value=[
                        {
                            "id": 3,
                            "created_at": "2026-01-14T10:03:02Z",
                            "message": "3",
                            "author": {
                                "id_1c": "84551b88-b55b-11f0-9b71-4cd98f08e56d",
                                "username": "shop_ruta",
                                "full_name": "Магазин Рута"
                            }
                        },
                        {
                            "id": 4,
                            "created_at": "2026-01-14T10:05:46Z",
                            "message": "4",
                            "author": None
                        }
                    ],
                )
            ],
        ),
        400: OpenApiResponse(
            description="Некоректні параметри",
            examples=[
                OpenApiExample(
                    name="Bad request",
                    value={
                        "error": "base_transaction_guid and transaction_type_id are required"
                    },
                )
            ],
        ),
        401: OpenApiResponse(
            description="Неавторизовано",
            examples=[
                OpenApiExample(
                    name="Unauthorized",
                    value={"detail": "Authentication credentials were not provided."},
                )
            ],
        ),
    },
    tags=["Messages"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request):
    base_transaction_guid = request.GET.get("base_transaction_guid")
    transaction_type_id = request.GET.get("transaction_type_id")

    if not base_transaction_guid or not transaction_type_id:
        return Response(
            {"error": "base_transaction_guid and transaction_type_id are required"},
            status=400
        )

    try:
        base_transaction_bin = guid_to_1c_bin(base_transaction_guid)
    except Exception:
        return Response({"error": "Invalid base_transaction_guid"}, status=400)

    messages = (
        Message.objects
        .filter(
            base_transaction_id=base_transaction_bin,
            transaction_type_id=transaction_type_id
        )
        .order_by("created_at")
    )

    # --------- Writer IDs з повідомлень ----------
    writer_ids = {
        m.writer_id
        for m in messages
        if isinstance(m.writer_id, (bytes, bytearray))
    }

    # --------- Користувачі порталу ----------
    users_map = {
        u.user_id_1C: u
        for u in CustomUser.objects.filter(user_id_1C__in=writer_ids)
    }

    result = []

    for m in messages:
        author = None

        if isinstance(m.writer_id, (bytes, bytearray)):
            # 1️⃣ Спроба знайти в порталі
            user = users_map.get(m.writer_id)

            if user:
                author = {
                    "id_1c": bin_to_guid_1c(m.writer_id),
                    "username": user.username,
                    "full_name": (
                        user.full_name
                        or f"{user.first_name} {user.last_name}".strip()
                    ),
                    "type": "PortalUser",
                }
            else:
                # 2️⃣ Fallback → 1С
                author_1c = get_author_from_1c(m.writer_id)
                if author_1c:
                    author = author_1c

        result.append({
            "id": m.id,
            "message": m.message,
            "created_at": m.created_at,
            "author": author,
        })

    return Response(result)
