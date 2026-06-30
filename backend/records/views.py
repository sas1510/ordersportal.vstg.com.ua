import os
import re
import json
import base64
import time
import collections
import mimetypes
import requests
import smbclient
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from urllib.parse import unquote
from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import connection, connections, transaction, DatabaseError
from django.db.models import Q
from django.http import JsonResponse, StreamingHttpResponse, Http404
from django.shortcuts import render
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_GET
from rest_framework.response import Response
from rest_framework import status, viewsets, generics, serializers
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from asgiref.sync import async_to_sync, sync_to_async
from drf_spectacular.utils import (
    extend_schema, OpenApiParameter, OpenApiTypes, 
    inline_serializer, OpenApiResponse, OpenApiExample
)

from users.models import CustomUser
from .models import ChatMessage, TransactionType
from .serializers import ChatMessageSerializer, CalculationCreateSerializer
from .utils import get_author_from_1c
from backend.authentication import OneCApiKeyAuthentication
from backend.permissions import (
    IsAuthenticatedOr1CApiKey, 
    IsAdminJWTOr1CApiKey, 
    IsAdminJWT
)
from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.get_main_manager import get_contractor_main_manager_bin
from backend.utils.db_1c_lookups import (
    get_author_name_from_db, 
    get_document_number_by_guid, 
    get_document_year_by_guid
)
from backend.utils.contractor import resolve_contractor
from backend.utils.onec_api import send_to_1c
from backend.utils.api_helpers import safe_view
from backend.utils.dates import parse_date, clean_date
from backend.utils.logging_setup import logger


from .utils import (
    extract_1c_binary,
    guess_extension_from_bytes
)


SUPPORTED_PORTAL_TRANSLATION_LANGS = {"uk", "en", "de"}
ORDERSPORTAL_AI_TRANSLATE_URL = (
    os.getenv("ORDERSPORTAL_AI_TRANSLATE_URL")
    or os.getenv("ORDERSPORTAL_AI_WEBHOOK_URL")
    or "http://192.168.200.177:5678/webhook/ordersportal-ai-translate"
)
ORDERSPORTAL_AI_TRANSLATE_KEY = (
    os.getenv("ORDERSPORTAL_AI_TRANSLATE_KEY")
    or os.getenv("ORDERSPORTAL_AI_WEBHOOK_KEY")
)
try:
    ORDERSPORTAL_AI_TRANSLATE_TIMEOUT = float(
        os.getenv("ORDERSPORTAL_AI_TRANSLATE_TIMEOUT", "8")
    )
except (TypeError, ValueError):
    ORDERSPORTAL_AI_TRANSLATE_TIMEOUT = 8.0



def get_current_time_kyiv() -> str:
    return (
        datetime.now(timezone.utc)
        .astimezone(ZoneInfo("Europe/Kyiv"))
        .strftime("%Y-%m-%d %H:%M:%S")
    )


def parse_reclamation_details(text):
    """
    Витягує Дату доставки, Дату визначення та Опис рекламації з неструктурованого тексту.
    Опис витягується лише якщо присутній маркер 'Опис рекламації:'.
    """
    if not text:
        return {}


    date_delivery_match = re.search(r"Дата доставки:\s*([\d\.\s:]+)", text, re.IGNORECASE)
    date_determination_match = re.search(r"Дата визначення рекламації\s*:\s*([\d\.\s:]+)", text, re.IGNORECASE)


    order_prefix_match = re.search(
        r"(Заказ покупателя|Заказ покупателя претензия)\s*[\d\w-]+\s*(dated|от)",
        text,
        re.IGNORECASE
    )
  
    description_prefix_match = re.search(r"(?:Опис(?: рекламації)?|Коментар):\s*", text, re.IGNORECASE)

  
    if not description_prefix_match:
        return {
            'ParsedDeliveryDate': date_delivery_match.group(1).strip() if date_delivery_match else None,
            'ParsedDeterminationDate': date_determination_match.group(1).strip() if date_determination_match else None,
            'ParsedDescription': None
        }


    start_index = description_prefix_match.end()
    end_index = order_prefix_match.start() if order_prefix_match else len(text)

    raw_description = text[start_index:end_index].strip()

    
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



def normalize_portal_language(value, fallback="uk"):
    normalized_fallback = str(fallback or "uk").strip().lower()[:2]
    if normalized_fallback not in SUPPORTED_PORTAL_TRANSLATION_LANGS:
        normalized_fallback = "uk"

    candidate = str(value or "").strip().lower().replace("_", "-")
    if not candidate:
        return normalized_fallback

    primary = candidate.split(",")[0].split(";")[0].split("-")[0].strip()
    if primary in SUPPORTED_PORTAL_TRANSLATION_LANGS:
        return primary

    return normalized_fallback



def get_requested_portal_language(request, fallback="uk"):
    return normalize_portal_language(
        request.GET.get("lang")
        or request.headers.get("X-Portal-Language")
        or request.headers.get("Accept-Language")
        or getattr(request, "LANGUAGE_CODE", None),
        fallback=fallback,
    )



def translate_portal_message_for_view(
    text,
    target_language,
    *,
    field_name="chat_message",
    entity_type="message",
    entity_id=None,
    source_locale_hint="uk",
):
    clean_text = str(text or "").strip()
    normalized_target = normalize_portal_language(target_language, fallback="uk")
    normalized_hint = normalize_portal_language(source_locale_hint, fallback="uk")

    response_payload = {
        "message": clean_text,
        "original_message": clean_text,
        "message_language": None,
        "display_language": normalized_target,
        "is_auto_translated": False,
    }

    if not clean_text:
        response_payload["original_message"] = ""
        return response_payload

    if normalized_target == normalized_hint:
        response_payload["message_language"] = normalized_hint
        return response_payload

    if not ORDERSPORTAL_AI_TRANSLATE_URL or not ORDERSPORTAL_AI_TRANSLATE_KEY:
        return response_payload

    try:
        response = requests.post(
            ORDERSPORTAL_AI_TRANSLATE_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-KEY": ORDERSPORTAL_AI_TRANSLATE_KEY,
            },
            json={
                "text": clean_text,
                "targets": [normalized_target],
                "field_name": field_name,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id is not None else None,
                "source_locale_hint": normalized_hint,
            },
            timeout=ORDERSPORTAL_AI_TRANSLATE_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        logger.warning(
            "AI message translation failed for entity %s (%s): %s",
            entity_id,
            normalized_target,
            str(exc),
        )
        return response_payload

    translations = payload.get("translations") or {}
    translated_text = translations.get(normalized_target)
    if isinstance(translated_text, str) and translated_text.strip():
        translated_text = translated_text.strip()
        response_payload["message"] = translated_text
        response_payload["is_auto_translated"] = translated_text != clean_text

    source_language = payload.get("source_language")
    if isinstance(source_language, str) and source_language.strip():
        response_payload["message_language"] = normalize_portal_language(
            source_language,
            fallback=normalized_hint,
        )

    return response_payload




# @extend_schema(
#     summary="Get complaints by contractor",
#     description=(
#         "Повертає рекламації за контрагентом.\n\n"
#         " **Доступ:**\n"
#         "- JWT:\n"
#         "  - admin → може передати contractor\n"
#         "  - інші ролі → тільки свій контрагент\n"
#         "- 1C API key → автоматично використовується UserId1C\n\n"
#         " **Параметри:**\n"
#         "- contractor — GUID контрагента (обовʼязково ТІЛЬКИ для admin)\n"
#         "- year — рік (необовʼязково)"
#     ),
#     parameters=[
#         OpenApiParameter(
#             name="contractor",
#             type=str,
#             location=OpenApiParameter.QUERY,
#             required=False,
#             description="GUID контрагента (обовʼязково ТІЛЬКИ для admin через JWT, інакше ігнорується)",
#         ),
#         OpenApiParameter(
#             name="year",
#             type=int,
#             location=OpenApiParameter.QUERY,
#             required=False,
#             description="Рік (якщо не передано — всі роки)",
#         ),
#     ],
# )
# @api_view(["GET"])
# @permission_classes([IsAuthenticatedOr1CApiKey])
# @safe_view
# def complaints_view(request):
#     start_time = time.time()
    
    
#     try:
#         contractor_bin, contractor_guid = resolve_contractor(request)
#     except (ValueError, PermissionError) as e:
#         logger.warning(f"Unauthorized complaints access attempt: {str(e)}")
#         return Response({"error": str(e)}, status=403)

#     year_raw = request.GET.get("year")
#     try:
#         year = int(year_raw) if year_raw else None
#     except (ValueError, TypeError):
#         return Response({"error": "Рік має бути числом"}, status=400)

    
#     # logger.info(f"Fetching complaints from 1C", extra={
#     #     'tags': {'action': 'get_complaints', 'contractor': contractor_guid, 'year': year}
#     # })
    
#     try:
#         with connection.cursor() as cursor:
#             cursor.execute(
#                 "EXEC dbo.GetComplaintsFull @User1C_ID=%s, @Year=%s",
#                 [contractor_bin, year]
#             )
#             columns = [c[0] for c in cursor.description]
#             rows = [dict(zip(columns, r)) for r in cursor.fetchall()]
        
#         sql_duration = time.time() - start_time
#     except Exception as e:
#         logger.error(f"SQL Execution Error (GetComplaintsFull): {str(e)}", exc_info=True)
#         return Response({"error": "Помилка бази даних 1С"}, status=500)

  
#     complaint_bins = [row["ComplaintGuid"] for row in rows if row.get("ComplaintGuid")]
    
#     unread_complaint_bins = set(
#         ChatMessage.objects.filter(
#             related_object_id__in=complaint_bins,
#             is_read=False,
#             is_notification=False
#         )
#         .exclude(author=contractor_bin)
#         .values_list("related_object_id", flat=True)
#         .distinct()
#     )


#     all_messages = (
#         ChatMessage.objects.filter(
#             related_object_id__in=complaint_bins,
#             is_notification=False
#         )
#         .order_by('id')
#         .values('related_object_id', 'text')
#     )

#     # 2. Збираємо унікальну мапу в Python: { "id_рекламації": "текст_повідомлення" }
#     first_messages_map = {}
#     for msg in all_messages:
#         obj_id = msg['related_object_id']
        
#         # Якщо Django повернув сирі байти (bytes), перетворюємо їх через bin_to_guid_1c, 
#         # щоб отримати такий самий формат, як для рядків з 1С
#         if isinstance(obj_id, (bytes, bytearray)):
#             guid_str = bin_to_guid_1c(obj_id)
#         else:
#             guid_str = str(obj_id)
            
#         key = str(guid_str).lower().strip()
#         if key not in first_messages_map:
#             first_messages_map[key] = msg['text']
    
    
#     for row in rows:
#         c_guid_bin = row.get("ComplaintGuid")
#         row["HasUnreadMessages"] = c_guid_bin in unread_complaint_bins

#         c_guid_str = bin_to_guid_1c(c_guid_bin) if c_guid_bin else None
#         # customer_str = bin_to_guid_1c(row.get("CustomerLink")) if row.get("CustomerLink") else None
#         # manager_str = bin_to_guid_1c(row.get("ManagerLink")) if row.get("ManagerLink") else None

#         lookup_key = str(c_guid_str).lower().strip() if c_guid_str else None

#         row["FirstMessage"] = first_messages_map.get(lookup_key) if lookup_key else None

#         if c_guid_bin:
#             row["ComplaintGuid"] = bin_to_guid_1c(c_guid_bin)
#             row["CustomerLink"] = bin_to_guid_1c(row["CustomerLink"])
#             row["ManagerLink"] = bin_to_guid_1c(row["ManagerLink"])

#         full_text = row.get("AdditionalInformation")
    
#         try:
#             parsed_info = parse_reclamation_details(full_text)
#             row["DeliveryDateText"] = parsed_info.get("ParsedDeliveryDate")
#             row["DeterminationDateText"] = parsed_info.get("ParsedDeterminationDate")
#             row["ParsedDescription"] = parsed_info.get("ParsedDescription") or full_text
#         except Exception:
#             logger.warning(f"Failed to parse complaint details for {row.get('ComplaintGuid')}", exc_info=True)
#             row["ParsedDescription"] = full_text

    
#     total_duration = time.time() - start_time
#     logger.info(f"Complaints processed", extra={
#         'tags': {
#             'action': 'get_complaints',
#             'duration_total': round(total_duration, 3),
#             'duration_sql': round(sql_duration, 3),
#             'count': len(rows),
#             'contractor': contractor_guid
#         }
#     })

#     return Response({"status": "success", "data": rows})


import time
import logging
from django.db import connection
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from asgiref.sync import async_to_sync, sync_to_async



# 1. Асинхронна обгортка для збереженої процедури 1С
@sync_to_async
def execute_stored_procedure(contractor_bin, year):
    with connection.cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetComplaintsFull @User1C_ID=%s, @Year=%s",
            [contractor_bin, year]
        )
        columns = [c[0] for c in cursor.description]
        return [dict(zip(columns, r)) for r in cursor.fetchall()]


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def complaints_view(request):  # Знову синхронна для DRF
    start_time = time.time()

    # Створюємо внутрішню асинхронну функцію, яка виконає всю I/O логіку
    async def _async_data_fetch():
        try:
            # Загортаємо resolve_contractor, якщо вона робить синхронні запити в БД
            contractor_bin, contractor_guid = await sync_to_async(resolve_contractor)(request)
        except (ValueError, PermissionError) as e:
            return {"error": str(e), "status_code": 403}

        year_raw = request.GET.get("year")
        try:
            year = int(year_raw) if year_raw else None
        except (ValueError, TypeError):
            return {"error": "Рік має бути числом", "status_code": 400}

        # Виклик збереженої процедури 1С
        try:
            sql_start = time.time()
            rows = await execute_stored_procedure(contractor_bin, year)
            sql_duration = time.time() - sql_start
        except Exception as e:
            logger.error(f"SQL Execution Error (GetComplaintsFull): {str(e)}", exc_info=True)
            return {"error": "Помилка бази даних 1С", "status_code": 500}

        complaint_bins = [row["ComplaintGuid"] for row in rows if row.get("ComplaintGuid")]
        
        if not complaint_bins:
            return {"data": [], "sql_duration": sql_duration, "contractor_guid": contractor_guid}

        # Асинхронні запити до Django ORM через асинхронний ітератор `async for`
        unread_query = (
            ChatMessage.objects.filter(
                related_object_id__in=complaint_bins,
                is_read=False,
                is_notification=False
            )
            .exclude(author=contractor_bin)
            .values_list("related_object_id", flat=True)
            .distinct()
        )
        unread_complaint_bins = {obj_id async for obj_id in unread_query}

        all_messages_query = (
            ChatMessage.objects.filter(
                related_object_id__in=complaint_bins,
                is_notification=False
            )
            .order_by('id')
            .values('related_object_id', 'text')
        )
        
        first_messages_map = {}
        async for msg in all_messages_query:
            obj_id = msg['related_object_id']
            
            if isinstance(obj_id, (bytes, bytearray)):
                guid_str = bin_to_guid_1c(obj_id)
            else:
                guid_str = str(obj_id)
                
            key = str(guid_str).lower().strip()
            if key not in first_messages_map:
                first_messages_map[key] = msg['text']
        
        # Обробка та парсинг даних (CPU-bound процеси)
        for row in rows:
            c_guid_bin = row.get("ComplaintGuid")
            row["HasUnreadMessages"] = c_guid_bin in unread_complaint_bins

            c_guid_str = bin_to_guid_1c(c_guid_bin) if c_guid_bin else None
            lookup_key = str(c_guid_str).lower().strip() if c_guid_str else None

            row["FirstMessage"] = first_messages_map.get(lookup_key) if lookup_key else None

            if c_guid_bin:
                row["ComplaintGuid"] = bin_to_guid_1c(c_guid_bin)
                row["CustomerLink"] = bin_to_guid_1c(row["CustomerLink"])
                row["ManagerLink"] = bin_to_guid_1c(row["ManagerLink"])

            full_text = row.get("AdditionalInformation")
        
            try:
                parsed_info = parse_reclamation_details(full_text)
                row["DeliveryDateText"] = parsed_info.get("ParsedDeliveryDate")
                row["DeterminationDateText"] = parsed_info.get("ParsedDeterminationDate")
                row["ParsedDescription"] = parsed_info.get("ParsedDescription") or full_text
            except Exception:
                logger.warning(f"Failed to parse complaint details for {row.get('ComplaintGuid')}", exc_info=True)
                row["ParsedDescription"] = full_text

        return {
            "data": rows, 
            "sql_duration": sql_duration, 
            "contractor_guid": contractor_guid
        }

    # Магія: запускаємо асинхронний таск всередині синхронного контексту DRF
    result = async_to_sync(_async_data_fetch)()

    # Перевіряємо, чи не повернула асинхронна функція помилку валідації/бази
    if "error" in result:
        return Response({"error": result["error"]}, status=result["status_code"])

    total_duration = time.time() - start_time
    logger.info(f"Complaints processed", extra={
        'tags': {
            'action': 'get_complaints',
            'duration_total': round(total_duration, 3),
            'duration_sql': round(result["sql_duration"], 3),
            'count': len(result["data"]),
            'contractor': result["contractor_guid"]
        }
    })


    return Response({"status": "success", "data": result["data"]})



def get_orders_by_year_and_contractor(year: int, contractor_id: str):
    """
    Викликає SQL-процедуру [GetOrdersByYearAndContractor] 
    та повертає результат у вигляді готової структури для фронту.
    
    Якщо CalculationDate відсутня, використовує найранішу OrderDate.
    """
    
    # query = """
    #     EXEC [GetOrdersByYearAndContractor] @Year=%s, @Contractor_ID=%s
    # """
    try:
        year = int(year)
    except (ValueError, TypeError):
    
        return []

    query = """
        EXEC [GetCalculationsWithOrdersByYearAndContractor] @Year=%s, @Contractor_ID=%s
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [year, contractor_id])
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    calcs_dict = {}
    for row in rows:
        calc_id = row.get("CalcID_GUID") or row.get("ClientOrderNumber") or row.get("OrderNumber") or "default"
        
        current_order_count = int(row.get("ConstructionsCount") or 0) 
        calculation_date = row.get("CalcDate") or row.get("CalculationDate")
        order_date = row.get("OrderDate")
        
        if calc_id not in calcs_dict:
            calcs_dict[calc_id] = {
                "id": calc_id,
                "number": row.get("CalcDealerNumber") or row.get("ClientOrderNumber") or row.get("CalcNumber") or "",
                "webNumber": row.get("CalcDealerNumber") or row.get("WebNumber") or "",
                "dateRaw": calculation_date,
                "date": calculation_date, 
                "orders": [],
                "calcConstructionsFromSQL": row.get("CalcConstructionsCount"),
                "dealer": row.get("Customer"),
                "dealerId": bin_to_guid_1c(row.get("ContractorID")),
                "constructionsQTY": current_order_count, 
                "authorGuid": row.get("CalcAuthor_GUID") or "", 
                "authorName": row.get("CalcAuthorName") or "", 
                "recipient": row.get("Recipient") or row.get("Customer"), 
                "recipientPhone": row.get("RecipientPhone") or '', 
                "recipientAdditionalInfo": row.get("RecipientAdditionalInfo") or '', 
                "deliveryAddresses": row.get("DeliveryAddresses") or row.get('OrderAddress') or '', 
                "file": row.get("AllFileNames") or '',
                "fileName": row.get("AllFileNames") or '',
                "message": row.get("CalcComment"),
                "manager": bin_to_guid_1c(row.get("Manager")),
                "currency": row.get("Currency"),
                "raw_order_dates": [order_date] if order_date else [], 
            }
        else:
            calcs_dict[calc_id]["constructionsQTY"] += current_order_count
            if order_date:
                 calcs_dict[calc_id]["raw_order_dates"].append(order_date)


    
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
            "dateDelay": row.get("DateDelays"),
            "createDate": row.get("CreateDate"),
            "currency": row.get("Currency"),
            
            
        }
        calcs_dict[calc_id]["orders"].append(order)

   
    formatted_calcs = []
    for calc in calcs_dict.values():
        orders = calc["orders"]
        status_counts = {}
        total_amount = 0
        total_paid = 0

   
        if not calc["dateRaw"] and calc["raw_order_dates"]:
   
            min_date = min(
                (d for d in calc["raw_order_dates"] if d), default=None
            )
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
        
        calc["amount"] = total_amount
        calc["debt"] = total_amount - total_paid
        if calc.get("calcConstructionsFromSQL") is not None:
                constructions_qty = int(calc["calcConstructionsFromSQL"])
        else:
            constructions_qty = sum(o["count"] for o in orders)

        calc["constructionsQTY"] = constructions_qty
        calc["constructionsCount"] = constructions_qty

        formatted_calcs.append(calc)

    return formatted_calcs



from asgiref.sync import async_to_sync, sync_to_async
from django.db.models import Q


async_get_data = sync_to_async(get_orders_by_year_and_contractor, thread_sensitive=False)




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
    start_time = time.time()
    

    year_str = request.GET.get("year")
    if not year_str:
        return Response({"error": "year is required"}, status=400)

    try:
        year = int(year_str)
    except ValueError:
        return Response({"error": "Invalid year"}, status=400)


    try:
        contractor_bin, contractor_guid = resolve_contractor(
            request,
            allow_admin=True,
            admin_param="contractor_guid",
        )
    except (ValueError, PermissionError) as e:

        logger.warning(f"Access denied for orders: {str(e)}", extra={
            'tags': {'action': 'get_orders', 'status': 'forbidden'}
        })
        return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)


    # logger.info(f"Fetching orders for year {year}", extra={
    #     'tags': {'contractor': contractor_guid, 'year': year}
    # })

    try:
        data = async_to_sync(async_get_data)(year, contractor_bin)
        
   
        calc_bins = [guid_to_1c_bin(calc["id"]) for calc in data if calc.get("id")]
        calc_bins = []
        calc_to_bin_map = {}
        calc_to_str_map = {}

        for calc in data:
            calc_id = calc.get("id")
            if calc_id:
                # Перевіряємо тип, щоб не зламати guid_to_1c_bin / bin_to_guid_1c
                if isinstance(calc_id, (bytes, bytearray)):
                    c_bin = calc_id
                    c_str = bin_to_guid_1c(calc_id)
                else:
                    c_bin = guid_to_1c_bin(str(calc_id))
                    c_str = str(calc_id)
                
                calc_bins.append(c_bin)
                calc_to_bin_map[calc_id] = c_bin
                calc_to_str_map[calc_id] = c_str


        unread_calc_bins = set(
            ChatMessage.objects.filter(
                related_object_id__in=calc_bins,
                is_read=False,
                is_notification=False
            )
            .exclude(author=contractor_bin)
            .values_list("related_object_id", flat=True)
            .distinct()
        )

        all_messages = (
            ChatMessage.objects.filter(
                related_object_id__in=calc_bins,
                is_notification=False
            )
            .order_by('id')
            .values('related_object_id', 'text')
        )

        # Збираємо унікальну мапу в Python: { "id_прорахунку_строковий": "текст_повідомлення" }
        first_messages_map = {}
        for msg in all_messages:
            obj_id = msg['related_object_id']
            
            if isinstance(obj_id, (bytes, bytearray)):
                guid_str = bin_to_guid_1c(obj_id)
            else:
                guid_str = str(obj_id)
                
            key = str(guid_str).lower().strip()
            if key not in first_messages_map:
                first_messages_map[key] = msg['text']
        

        for calc in data:
            calc_id = calc.get("id")
            if not calc_id:
                continue

            # Беремо вже готові значення з кеш-мапи (захист від ValueError)
            calc_bin_key = calc_to_bin_map.get(calc_id)
            c_guid_str = calc_to_str_map.get(calc_id)
            
            lookup_key = c_guid_str.lower().strip() if c_guid_str else None

            # Проставляємо прапорець непрочитаних
            calc["hasUnreadMessages"] = calc_bin_key in unread_calc_bins

            # Перевіряємо, чи є повідомлення у мапі чату
            db_first_message = first_messages_map.get(lookup_key) if lookup_key else None

            # Якщо в об'єкті вже є message (CalcComment з SQL) і він не порожній — залишаємо його.
            # Якщо він порожній — записуємо туди перше повідомлення з чату
            current_msg = calc.get("message")
            if not current_msg or not str(current_msg).strip():
                calc["message"] = db_first_message

            # Додатково повертаємо FirstMessage як окреме поле, якщо фронт його очікує
            calc["firstMessage"] = db_first_message

    
        duration = time.time() - start_time
        logger.info(f"Orders fetched successfully", extra={
            'tags': {
                'action': 'get_orders',
                'duration_sec': round(duration, 3),
                'results_count': len(data),
                'contractor': contractor_guid
            }
        })

        return Response({
            "status": "success",
            "data": {"calculation": data}
        })

    except Exception as e:
    
        logger.error(f"Failed to fetch orders: {str(e)}", exc_info=True, extra={
            'tags': {'action': 'get_orders', 'contractor': contractor_guid}
        })
        return Response({"error": "Internal server error during data fetch"}, status=500)



@sync_to_async
def execute_additional_orders_procedure(contractor_bin, year):
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
        return [dict(zip(columns, r)) for r in cursor.fetchall()]



@extend_schema(
    summary="Повертає дозакази (Additional Orders)",
    description=(
        "Повертає дозакази за контрагентом.\n\n"
        " **Доступ:**\n"
        "- JWT admin → може передати contractor\n"
        "- JWT dealer/customer → тільки свій контрагент\n"
        "- 1C API key → автоматично по UserId1C\n\n"
        " **Параметри:**\n"
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
def additional_orders_view(request):  # Синхронна обгортка для DRF
    start_time = time.time()

    # Створюємо внутрішню асинхронну функцію для I/O операцій
    async def _async_data_fetch():
        try:
            # Загортаємо resolve_contractor на випадок синхронних запитів до БД всередині
            contractor_bin, contractor_guid = await sync_to_async(resolve_contractor)(request)
        except (ValueError, PermissionError) as e:
            return {"error": str(e), "status_code": 403}

        year_raw = request.GET.get("year")
        try:
            year = int(year_raw) if year_raw else None
        except (ValueError, TypeError):
            return {"error": "Рік має бути числом", "status_code": 400}

        # Виклик збереженої процедури 1С
        try:
            sql_start = time.time()
            rows = await execute_additional_orders_procedure(contractor_bin, year)
            sql_duration = time.time() - sql_start
        except Exception as e:
            logger.error(f"SQL Error in additional_orders_view: {str(e)}", exc_info=True)
            return {"error": "Internal database error", "status_code": 500}

        additional_order_bins = [
            r["AdditionalOrderGuid"]
            for r in rows
            if r.get("AdditionalOrderGuid")
        ]

        # Якщо замовлень немає, повертаємо порожній список без додаткових запитів до ORM
        if not additional_order_bins:
            return {"data": [], "sql_duration": sql_duration, "contractor_guid": contractor_guid}

        # Асинхронний запит до Django ORM за допомогою асинхронного ітератора
        unread_query = (
            ChatMessage.objects.filter(
                related_object_id__in=additional_order_bins,
                is_read=False,
                is_notification=False
            )
            .exclude(author=contractor_bin)
            .values_list("related_object_id", flat=True)
            .distinct()
        )
        unread_additional_orders = {obj_id async for obj_id in unread_query}

        # Форматування результатів (чистий CPU-bound процес у Python)
        formatted = []
        for r in rows:
            try:
                additional_guid_bin = r.get("AdditionalOrderGuid")
                has_unread = additional_guid_bin in unread_additional_orders
            
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
                    "hasUnreadMessages": has_unread,
                    "numberWEB": r.get("NumberWEB"),
                    "mainOrderNumber": r.get("OrderNumber"),
                    "mainOrderDate": clean_date(r.get("MainOrderDate")),
                    "dateRaw": clean_date(r.get("AdditionalOrderDate")),
                    "date": clean_date(r.get("AdditionalOrderDate")),
                    "dealer": r.get("Customer") or r.get("OrganizationName") or "",
                    "dealerId": bin_to_guid_1c(r.get("CustomerID")),
                    "managerName": r.get("ResponsibleName"),
                    "managerLink": bin_to_guid_1c(r.get("ManagerLink")),
                    "organizationName": r.get("OrganizationName"),
                    "debt": order_sum - total_paid,
                    "file": None,
                    "message": parsed.get("ParsedDescription") or r.get("AdditionalInformation"),
                    "orderCountInCalc": 1,
                    "constructionsCount": qty,
                    "constructionsQTY": qty,
                    "amount": order_sum,
                    "statuses": {status: 1},
                    "currency": r.get("Currency"),
                    "orders": [
                        {
                            "id": r.get("ClaimOrderNumber") or number,
                            "number": r.get("ClaimOrderNumber") or "",
                            "guid": bin_to_guid_1c(r.get("OrderGUID")) or "",
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
                            "currency": r.get("Currency"),
                        }
                    ],
                })
            except Exception as e:
                logger.error(f"Error formatting additional order row: {str(e)}", exc_info=True)
                continue

        return {
            "data": formatted,
            "sql_duration": sql_duration,
            "contractor_guid": contractor_guid
        }

    # Магія виконання асинхронного таска
    result = async_to_sync(_async_data_fetch)()


    if "error" in result:
        return Response({"error": result["error"]}, status=result["status_code"])

    total_duration = time.time() - start_time
    logger.info(f"Additional orders processed", extra={
        'tags': {
            'action': 'get_additional_orders',
            'duration_total': round(total_duration, 3),
            'duration_sql': round(result["sql_duration"], 3),
            'count': len(result["data"]),
            'contractor': result["contractor_guid"]
        }
    })

    return Response({
        "status": "success",
        "data": {
            "calculation": result["data"]
        }
    })


@extend_schema(
    summary="Отримати файли замовлення",
    description=(
        "Повертає **всі файли замовлення** (ZKZ, фото, документи), "
        "які зберігаються в 1С.\n\n"
        " Дані отримуються через SQL-процедуру **dbo.GetOrdersFiles**.\n\n"
        " **Доступ:**\n"
        "- JWT (авторизований користувач порталу)\n"
        "- або 1C API Key\n\n"
        " Використовується для відображення файлів у React-модалці."
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

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    # 1. Початковий лог (Debug або Info)
    # logger.info(f"Fetching files list for order {order_guid}", extra={
    #     'tags': {
    #         'action': 'get_order_files_list',
    #         'order_guid': order_guid,
    #         'user': user_name
    #     }
    # })

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetOrdersFiles @OrderLinkGUID=%s",
                [order_guid]
            )

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        sql_duration = time.time() - start_time

        files = [
            {
                "fileGuid": row_dict["File_GUID"],
                "fileName": row_dict["File_FileName"],
                "type": row_dict["File_DataType_Name"],
                "date": row_dict["File_Date"],
            }
            for row_dict in (dict(zip(columns, row)) for row in rows)
        ]

        total_duration = time.time() - start_time

        logger.info(f"Successfully got {len(files)} files for order {order_guid}", extra={
            'tags': {
                'action': 'get_order_files_list',
                'status': 'success',
                'count': len(files),
                'sql_duration': round(sql_duration, 4),
                'total_duration': round(total_duration, 4)
            }
        })

        return JsonResponse(
            {"status": "success", "files": files},
            status=200,
            json_dumps_params={"ensure_ascii": False}
        )


    except DatabaseError as e:
        logger.error(f"DB Error in order_files_view for order {order_guid}: {str(e)}", exc_info=True, extra={
            'tags': {'action': 'get_order_files_list', 'status': 'db_error'}
        })
        return JsonResponse(
            {
                "status": "error",
                "message": "Помилка отримання файлів замовлення"
            },
            status=500
        )

    except Exception as e:
        logger.error(f"Unexpected error in order_files_view for order {order_guid}: {str(e)}", exc_info=True, extra={
            'tags': {'action': 'get_order_files_list', 'status': 'unexpected_error'}
        })
        return JsonResponse(
            {
                "status": "error",
                "message": "Внутрішня помилка сервера"
            },
            status=500
        )









@extend_schema(
    summary="Завантажити файл замовлення",
    description=(
        "Завантажує **файл замовлення** (ZKZ, фото, документ) "
        "безпосередньо з файлового сховища **1С (SMB)**.\n\n"
        " Файл зчитується зі спільного ресурсу 1С по шляху:\n"
        "`Заказ покупателя/{order_guid}/{file_guid}/{filename}`\n\n"
        " **Доступ:**\n"
        "- JWT (авторизований користувач порталу)\n"
        "- або **1C API Key**\n\n"
        " **Обовʼязково:** параметр `filename` має бути переданий у query.\n\n"
        "⬇ Відповідь повертається як **binary stream** з заголовком "
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
    Завантажує файл замовлення з SMB (1С) без створення важких системних процесів.
    """

    """
    Завантажує файл прорахунку/фотографію з папки 'Заявка на просчет (ВМ)' через SMB 
    або витягує його з бази даних, якщо файл збережено в SQL.
    """
    start_time = time.time()
    filename = request.GET.get("filename")
    
    if not filename:
        raise Http404("Filename is required")

    filename = unquote(filename)
    content_type, _ = mimetypes.guess_type(filename)
    content_type = content_type or "application/octet-stream"

    # Визначаємо inline для фото/тексту, щоб вони відкривалися в браузері/модалці
    inline_extensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt"]
    file_ext = os.path.splitext(filename.lower())[1]
    disposition = "inline" if file_ext in inline_extensions else "attachment"

    # Шлях до сховища заявок на прорахунок
    remote_path = f"/{settings.SMB_SERVER}/{settings.SMB_SHARE}/Заказ покупателя/{order_guid}/{file_guid}/{filename}"

    # ==========================================
    # 🚀 СТРАТЕГІЯ 1: Спроба прочитати з SMB
    # ==========================================
    try:
        stat = smbclient.stat(remote_path)
        file_handle = smbclient.open_file(remote_path, mode="rb")
        
        response = StreamingHttpResponse(file_handle, content_type=content_type)
        response["Content-Length"] = stat.st_size
        response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        response["Access-Control-Expose-Headers"] = "Content-Disposition"
        
        return response

    except Exception as smb_error:
        logger.warning(
            f"SMB calculation file missing, switching to DB fallback. Path: {remote_path} | Reason: {str(smb_error)}",
            extra={'tags': {'action': 'download_calc', 'stage': 'smb_fallback'}}
        )

    # ==========================================
    # 🗄 СТРАТЕГІЯ 2: Fallback в Базу Даних (SQL)
    # ==========================================
    try:
        binary_guid = guid_to_1c_bin(file_guid)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC [dbo].[GetBinaryFile] @FileLink = %s",
                [binary_guid]
            )
            row = cursor.fetchone()

            if not row or not row[0]:
                logger.error(f"Calculation file not found anywhere: {file_guid} ({filename})")
                return redirect(f"{settings.FRONTEND_URL}file-preview/not-found?filename={quote(filename)}")

            raw_db_blob = row[0]
            db_filename = row[1] or filename

        file_bytes = extract_1c_binary(raw_db_blob)
        if not file_bytes:
            logger.error(f"1C Binary extraction failed (corrupted blob) for calculation file: {file_guid}")
            return redirect(f"{settings.FRONTEND_URL}file-preview/corrupted?filename={quote(filename)}")
        

        current_ext = os.path.splitext(filename)[1]
        if not current_ext:  # Якщо в назві немає розширення
            detected_ext = guess_extension_from_bytes(file_bytes[:16])
            if detected_ext:
                filename += detected_ext
                # Оновлюємо контент-тип після додавання розширення
                content_type, _ = mimetypes.guess_type(filename)
                content_type = content_type or "application/octet-stream"

                if detected_ext in [".pdf", ".jpg", "jpg", "JPG", ".jpeg", ".png", ".webp"]:
                    disposition = "inline"

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
        tmp.write(file_bytes)
        tmp.close()

        response = RangedFileResponse(
            request,
            open(tmp.name, "rb"),
            content_type=content_type
        )
        response["Content-Disposition"] = f'{disposition}; filename="{filename or db_filename}"'
        
        return response

    except Exception as db_error:
        logger.exception(f"Critical error in download_calc DB extraction: {str(db_error)}")
        return redirect(f"{settings.FRONTEND_URL}file-preview/not-found?filename={quote(filename)}")
    
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



@extend_schema(
    summary="Повертає всі дозакази за місяць (ADMIN)",
    description=(
        "ADMIN ONLY.\n\n"
        "Повертає **всі дозакази** за вказаний рік і місяць.\n\n"
        " Доступ:\n"
        "- JWT (роль admin)\n"
        "- або 1C API Key\n\n"
        " Структура відповіді **ідентична additional_orders_view**."
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
    start_time = time.time()


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
    

    logger.info(f"ADMIN: Fetching ALL additional orders for {year}-{month:02d}", extra={
        'tags': {
            'action': 'admin_get_all_additional_orders',
            'year': year,
            'month': month,
            'admin_user': request.user.username if request.user else 'unknown'
        }
    })


    def clean_date_stub(date_value):
        if not date_value:
            return None
        s = str(date_value)
        if s.startswith(("0001-01-01", "2001-01-01", "1753-01-01")):
            return None
        return date_value

    try: 

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

        sql_duration = time.time() - start_time


        rows = []
        for r in raw_rows:
            raw = dict(zip(columns, r))

    
            raw_guid = raw.get("AdditionalOrderGuid")

            if isinstance(raw_guid, memoryview):
                raw_guid = raw_guid.tobytes()

            raw["_AdditionalOrderGuid_raw"] = raw_guid

            rows.append(raw)

        formatted_orders = []

        for row in rows:
            try:
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

                
                raw_guid_manager = row.get("ManagerLink")

                if isinstance(raw_guid_manager, memoryview):
                    raw_guid_manager = raw_guid_manager.tobytes()

                if isinstance(raw_guid_manager, (bytes, bytearray)):
                    row["ManagerLink"] = bin_to_guid_1c(raw_guid_manager)
                else:
                    row["ManagerLink"] = None


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
                    "managerLink": row.get("ManagerLink"),
                    "currency": row.get("Currency"),
                    "orders": [
                        {
                            "guid": bin_to_guid_1c(row.get("OrderGUID")) or "",
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
                            "currency": row.get("Currency"),
                        }
                    ],
                }

                formatted_orders.append(calc)
            except Exception as row_error:

                logger.error(f"Error formatting row {row.get('AdditionalOrderNumber')}: {str(row_error)}")
                continue

        
        total_duration = time.time() - start_time
        
      
        logger.info(f"ADMIN: Successfully fetched {len(formatted_orders)} additional orders", extra={
            'tags': {
                'action': 'admin_get_all_additional_orders',
                'sql_duration': round(sql_duration, 3),
                'total_duration': round(total_duration, 3),
                'count': len(formatted_orders)
            }
        })
            

        return Response({
            "status": "success",
            "data": {
                "calculation": formatted_orders
            }
        })
    
    except Exception as e:
        logger.error(f"ADMIN: Critical failure fetching monthly orders: {str(e)}", exc_info=True)
        return Response({"error": "Внутрішня помилка при генерації звіту"}, status=500)





@extend_schema(
    summary="Усі рекламації за місяць (ADMIN)",
    description=(
        " **ADMIN ONLY**\n\n"
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
    start_time = time.time()

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
    
    # logger.info(f"ADMIN: Fetching ALL complaints for {year}-{month:02d}", extra={
    #     'tags': {
    #         'action': 'admin_get_all_complaints',
    #         'year': year,
    #         'month': month,
    #         'admin_user': request.user.username if request.user else 'unknown'
    #     }
    # })



    try:
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
            
        sql_duration = time.time() - start_time
        processed_rows = []

        for r in raw_rows:
            try:
                row = dict(zip(columns, r))
                row["CustomerLink"] = bin_to_guid_1c(row["CustomerLink"])
          
                raw_guid = row.get("ComplaintGuid")

                if isinstance(raw_guid, memoryview):
                    raw_guid = raw_guid.tobytes()

                if isinstance(raw_guid, (bytes, bytearray)):
                    row["ComplaintGuid"] = bin_to_guid_1c(raw_guid)
                else:
                    row["ComplaintGuid"] = None


                raw_guid_manager = row.get("ManagerLink")

                if isinstance(raw_guid_manager, memoryview):
                    raw_guid_manager = raw_guid_manager.tobytes()

                if isinstance(raw_guid_manager, (bytes, bytearray)):
                    row["ManagerLink"] = bin_to_guid_1c(raw_guid_manager)
                else:
                    row["ManagerLink"] = None

    
                full_text = row.get("AdditionalInformation")
                parsed_info = parse_reclamation_details(full_text)

                row["DeliveryDateText"] = parsed_info.get("ParsedDeliveryDate")
                row["DeterminationDateText"] = parsed_info.get("ParsedDeterminationDate")
                row["ParsedDescription"] = (
                    parsed_info.get("ParsedDescription") or full_text
                )

                processed_rows.append(row)

            except Exception as row_error:

                logger.error(f"Error processing complaint row: {str(row_error)}", exc_info=True)
                continue

        total_duration = time.time() - start_time

        logger.info(f"ADMIN: Successfully processed {len(processed_rows)} complaints", extra={
            'tags': {
                'action': 'admin_get_all_complaints',
                'sql_duration': round(sql_duration, 3),
                'total_duration': round(total_duration, 3),
                'count': len(processed_rows)
            }
        })
            

        return JsonResponse({
            "status": "success",
            "data": processed_rows
        }, json_dumps_params={"ensure_ascii": False})
    
    except Exception as e:

        logger.error(f"ADMIN: Critical failure in complaints_view_all_by_month: {str(e)}", exc_info=True)
        return JsonResponse({
            "status": "error",
            "message": "Внутрішня помилка сервера при отриманні рекламацій"
        }, status=500)






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
    start_time = time.time()


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
    

    # logger.info(f"ADMIN: Fetching ALL orders for month {year}-{month:02d}", extra={
    #     'tags': {
    #         'action': 'admin_get_monthly_orders',
    #         'year': year,
    #         'month': month,
    #         'admin_user': request.user.username if request.user else 'unknown'
    #     }
    # })


    try:
        with connection.cursor() as cursor:
            #  EXEC [dbo].[GetOrdersMonth]
            cursor.execute(
                """
                EXEC [dbo].[GetOrdersMonthWithCalculations]
                    @Year = %s,
                    @Month = %s
                """,
                [year, month]
            )
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        sql_duration = time.time() - start_time

  
        calcs_dict = {}

        for row in rows:
            try:
                calc_id = row.get("CalcID_GUID") or row.get("ClientOrderNumber") or row.get("OrderNumber") or "default"

                constructions_count = int(row.get("CalcConstructionsCount") or 0)
                calculation_date = row.get("CalcDate") or row.get("CalculationDate")
                order_date = row.get("OrderDate")

                if calc_id not in calcs_dict:
                    calcs_dict[calc_id] = {
                        "id": calc_id,
                        "number": row.get("CalcDealerNumber") or row.get("ClientOrderNumber") or row.get("OrderNumber") or "",
                        "webNumber": row.get("CalcDealerNumber") or row.get("WebNumber")  or row.get("OrderNumber") or "",
                        "dateRaw": calculation_date,
                        "date": calculation_date,
                        "orders": [],
                        "dealer": row.get("Customer"),
                        "dealerId": bin_to_guid_1c(row.get("ContractorID")),
                        "constructionsQTY": constructions_count,
                        "authorGuid": row.get("CalcAuthor_GUID") or "", 
                        "authorName": row.get("CalcAuthorName") or "", 
                        "recipient": row.get("Recipient") or row.get("Customer"), 
                        "recipientPhone": row.get("RecipientPhone") or '', 
                        "recipientAdditionalInfo": row.get("RecipientAdditionalInfo") or '', 
                        "deliveryAddresses": row.get("DeliveryAddresses") or row.get('OrderAddress') or '', 
                        "file": row.get("AllFileNames") or '',
                        "fileName": row.get("AllFileNames") or '',
                        "message": row.get("Message"),
                        "manager": bin_to_guid_1c(row.get("Manager")),
                        "raw_order_dates": [order_date] if order_date else [],
                        "currency": row.get("Currency") or '',
                    }
                else:
                    calcs_dict[calc_id]["constructionsQTY"] += constructions_count
                    if order_date:
                        calcs_dict[calc_id]["raw_order_dates"].append(order_date)

               
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
                    "dateDelay": row.get("DateDelays"),
                    "currency": row.get("Currency") or '',
                }

                calcs_dict[calc_id]["orders"].append(order)

            except Exception as row_error:
                logger.error(f"Error processing order row: {str(row_error)}", exc_info=True)
                continue

        formatted_calcs = []

        for calc in calcs_dict.values():
            orders = calc["orders"]
            status_counts = {}
            total_amount = 0
            total_paid = 0


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
            calc["constructionsCount"] = row.get("CalcConstructionsCount") or calc["constructionsQTY"] 
            calc["amount"] = total_amount
            calc["debt"] = total_amount - total_paid
            if not calc["constructionsQTY"] or calc["constructionsQTY"] == 0:
                calc["constructionsQTY"] = row.get("CalcConstructionsCount")


            formatted_calcs.append(calc)


        total_duration = time.time() - start_time

        logger.info(f"ADMIN: Successfully processed {len(formatted_calcs)} calculations", extra={
            'tags': {
                'action': 'admin_get_monthly_orders',
                'sql_duration': round(sql_duration, 3),
                'total_duration': round(total_duration, 3),
                'rows_count': len(rows),
                'calcs_count': len(formatted_calcs)
            }
        })

        
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
    
    except Exception as e:
        logger.error(f"ADMIN: Critical failure in orders_view_all_by_month: {str(e)}", exc_info=True)
        return JsonResponse({"error": "Внутрішня помилка сервера"}, status=500)


def safe_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None



def build_address_name(addr: dict | None) -> str:
    if not isinstance(addr, dict):
        return ""

    parts = []

    def add(prefix, key, suffix=""):
        val = addr.get(key)
        if isinstance(val, str) and val.strip():
            parts.append(f"{prefix}{val.strip()}{suffix}")

    add("", "region")
    add("", "district", " район")
    add("м. ", "city")
    add("вул. ", "street")
    add("буд. ", "house")
    add("кв. ", "apartment")
    add("під'їзд ", "entrance")
    add("поверх ", "floor")

    return ", ".join(parts)

# def build_1c_payload(
#     *,
#     order_number,
#     items_count,
#     comment,
#     contractor_guid,
#     delivery_address_guid=None,
#     delivery_address_coordinates=None,
#     client_address: dict | None = None,
#     file_name=None,
#     file_b64=None,
# ):
#     payload = {
#         "calculations": [
#             {
#                 # "createdAt": now().strftime("%Y-%m-%d %H:%M:%S"),
#                 "createdAt": get_current_time_kyiv(),
            
#                 "calculationNumber": order_number,
#                 "itemsCount": int(items_count),
#                 "comment": comment or "",

#                 "kontragentGUID": str(contractor_guid),
#                 "authorGUID": str(contractor_guid),

#                 "file": [
#                     {
#                         "fileName": file_name,
#                         "fileDataB64": file_b64,
#                         "fileExtension": "ZKZ",
#                     }
#                 ],

#                 "orders": [],
#             }
#         ]
#     }

#     calc = payload["calculations"][0]

  
#     if delivery_address_guid:

#         coords = delivery_address_coordinates or {} 
        
#         calc["address"] = {
#             "addressGUID": str(delivery_address_guid),
#             "addressName": None,
#             "addressCoordinates": {
#                 "lat": coords.get("lat"),
#                 "lng": coords.get("lng"),
#             },
#             "addressAdditionalInfo": None,
#         }
#         return payload


#     if not isinstance(client_address, dict):
#         raise ValidationError("client_address is required for client delivery")

#     address_name = build_address_name(client_address)

#     calc["address"] = {
#         "addressGUID": None,
#         "addressName": address_name,
#         "addressCoordinates": {
#             "lat": safe_float(client_address.get("lat")),
#             "lng": safe_float(client_address.get("lng")),
#         },
#         "addressAdditionalInfo": client_address.get("note", ""),
#     }

#     calc["recipient"] = {
#         "recipientName": client_address.get("full_name"),
#         "recipientPhone": client_address.get("phone"),
#         "recipientAddionalInformation":
#             client_address.get("extra_info", "") or "",
#     }

#     return payload


import os


import os


def get_file_extension(file_name: str | None, default_ext: str = "BIN") -> str:
    if not file_name:
        return default_ext

    ext = os.path.splitext(file_name)[1]

    if not ext:
        return default_ext

    return ext.replace(".", "").upper()


def build_1c_payload(
    *,
    order_number,
    items_count,
    comment,
    contractor_guid,
    delivery_address_guid=None,
    delivery_address_coordinates=None,
    client_address: dict | None = None,
    file_name=None,
    file_b64=None,
    photos=None,
):
    if photos is None:
        photos = []

    all_files = []

    if file_b64:
        actual_file_name = file_name or f"order_{order_number}.bin"
        file_ext = get_file_extension(actual_file_name)

        all_files.append({
            "fileName": actual_file_name,
            "fileDataB64": file_b64,
            "fileExtension": file_ext,
            "fileDataType": "Calculation"
        })

    for p in photos:
        photo_name = p.get("fileName") or "photo.jpg"
        photo_ext = get_file_extension(photo_name, "JPG")

        all_files.append({
            "fileName": photo_name,
            "fileDataB64": p["fileDataB64"],
            "fileExtension": photo_ext,
            "fileDataType": "Photo"
        })

    payload = {
        "calculations": [
            {
                "createdAt": get_current_time_kyiv(),
                "calculationNumber": order_number,
                "itemsCount": int(items_count),
                "comment": comment or "",
                "kontragentGUID": str(contractor_guid),
                "authorGUID": str(contractor_guid),
                "file": all_files,
                "orders": [],
            }
        ]
    }

    calc = payload["calculations"][0]

    if delivery_address_guid:
        coords = delivery_address_coordinates or {}
        calc["address"] = {
            "type": "delivery",
            "guid": str(delivery_address_guid),
            "coordinates": coords,
        }

    elif client_address:
        address_name = build_address_name(client_address)

        calc["address"] = {
            "addressGUID": None,
            "addressName": address_name,
            "addressCoordinates": {
                "lat": safe_float(client_address.get("lat")),
                "lng": safe_float(client_address.get("lng")),
            },
            "addressAdditionalInfo": client_address.get("note", "") or "",
        }
        calc["recipient"] = {
            "recipientName": client_address.get("full_name"),
            "recipientPhone": client_address.get("phone"),
            "recipientAddionalInformation": client_address.get("extra_info", "") or "",
        }

    return payload

def extract_calculation_guid(result) -> str | None:
    if not isinstance(result, dict):
        return None

    results = result.get("results")

    if not isinstance(results, list) or not results:
        return None

    first = results[0]
    if not isinstance(first, dict):
        return None

    return first.get("calculationGUID")





# @extend_schema(
#     summary="Створення прорахунку та відправка в 1С",
#     description=(
#         "Створює новий прорахунок та відправляє його в 1С.\n\n"
#         " **Формат:** JSON (без multipart)\n"
#         " **Файл:** base64\n\n"
#         " **Доступ:**\n"
#         "- JWT (portal)\n"
#         "- 1C API key\n\n"
#         " Контрагент:\n"
#         "- admin / manager → передається в payload\n"
#         "- dealer / api key → визначається автоматично"
#     ),
#     request=inline_serializer(
#         name="CreateCalculationRequest",
#         fields={
#             "contractor_guid": serializers.UUIDField(
#                 required=False,
#                 allow_null=True,
#                 help_text="GUID контрагента (тільки для admin)"
#             ),
#             "order_number": serializers.CharField(),
#             "items_count": serializers.IntegerField(),
#             "delivery_address_guid": serializers.UUIDField(
#                 required=False,
#                 allow_null=True
#             ),
#             "comment": serializers.CharField(
#                 required=False,
#                 allow_blank=True
#             ),
#             "file": inline_serializer(
#                 name="CalculationFile",
#                 fields={
#                     "fileName": serializers.CharField(),
#                     "fileDataB64": serializers.CharField(),
#                 }
#             ),
#         }
#     ),
#     responses={201: ..., 400: ...},
#     tags={"order"}
# )
# class CreateCalculationViewSet(viewsets.ViewSet):


#     permission_classes = [IsAuthenticatedOr1CApiKey]

        
        
#     def _send_to_1c(self, payload: dict) -> dict:


#         start_time = time.time()
#         query_type = payload.get('Query', 'Unknown')
        
#         # logger.info(f"Sending request to 1C", extra={'tags': {'query': query_type}})
#         try:
#             auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
#             auth_b64 = base64.b64encode(auth_raw.encode("utf-8")).decode("ascii")

#             response = requests.post(
#                 settings.ONE_C_URL,
 
#                 json=payload,
#                 headers={
#                     "Content-Type": "application/json; charset=utf-8",
#                     "Accept": "application/json",
#                     "Authorization": f"Basic {auth_b64}",
#                     "Query": "CreateCalculation"
#                 },
#                 timeout=30,
#                 verify=settings.ONE_C_VERIFY_SSL,
#             )


#             duration = time.time() - start_time
#             logger.info(f"1C Response received", extra={
#                 'tags': {
#                     'service': '1c-api', 
#                     'duration_sec': duration,
#                     'status_code': response.status_code
#                 }
#             })



#             response.raise_for_status()
#             return response.json()

#         except Exception as e:

#             logger.error(f"1C Integration Failed", exc_info=True, extra={
#                 'tags': {'service': '1c-api', 'action': 'create_calculation'}
#             })
#             raise




#     def create(self, request):
#         # logger.info("CreateCalculation START", extra={
#         #     "tags": {
#         #         "action": "create_calculation",
#         #         "stage": "start"
#         #     }
#         # })

#         serializer = CalculationCreateSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data

#         contractor_bin, contractor_guid = resolve_contractor(
#             request,
#             allow_admin=True,
#             admin_param="contractor_guid",
#         )

#     #     logger.info("Contractor resolved", extra={
#     #     "tags": {
#     #         "contractor_guid": str(contractor_guid),
#     #     }
#     # })

#         file = data["file"]

#         payload = build_1c_payload(
#             order_number=data["order_number"],
#             items_count=data["items_count"],
#             comment=data.get("comment", ""),
#             contractor_guid=contractor_guid,
#             delivery_address_guid=data.get("delivery_address_guid"),
#             delivery_address_coordinates=data.get("delivery_address_coordinates"),
#             client_address=data.get("client_address"),
#             file_name=file["fileName"],
#             file_b64=file["fileDataB64"],
#         )

#         # logger.info("Payload built for 1C", extra={
#         #     "tags": {
#         #         "action": "create_calculation",
#         #         "stage": "payload_ready",
#         #         "order_number": data.get("order_number"),
#         #     }
#         # })

#         # # ---------- 1C CALL ----------
#         # logger.info("Sending request to 1C", extra={
#         #     "tags": {
#         #         "service": "1c",
#         #         "action": "request_send"
#         #     }
#         # })

#         result = self._send_to_1c(payload)


#         # logger.info("1C response received", extra={
#         #     "tags": {
#         #         "service": "1c",
#         #         "stage": "response_received",
#         #         "success": result.get("success", True),
#         #     }
#         # })


#         if not result.get("success", True):
#             logger.error("1C returned error", extra={
#                 "tags": {
#                     "service": "1c",
#                     "status": "error",
#                 }
#             })
#             raise ValidationError(
#                 {
#                     "detail": "1С повернула помилку",
#                     "1c_response": result,
#                     "payload_sent_to_1c": payload,
#                 }
#             )
        
#         calculation_guid = extract_calculation_guid(result)

#         if not calculation_guid:
#             logger.error("Missing calculation GUID from 1C response", extra={
#                 "tags": {
#                     "service": "1c",
#                     "error": "missing_guid"
#                 }
#             })

#             raise ValidationError({
#                 "detail": "1С не повернула calculationGUID",
#                 "1c_response": result,
#             })

     
#         # writer_guid = None
#         # if request.user and request.user.is_authenticated:
#         #     writer_guid = request.user.user_id_1C

#         # save_calculation_comment(
#         #     calculation_bin=guid_to_1c_bin(calculation_guid),
#         #     comment=data.get("comment", ""),
#         #     writer_guid=writer_guid,
#         # )
#         try:
           
#             calculation_bin = guid_to_1c_bin(str(calculation_guid))
#             main_manager_bin = get_contractor_main_manager_bin(contractor_bin)
          
#             final_recipient = main_manager_bin if main_manager_bin else contractor_bin
            
#             # writer_bin = None
#             # if request.user and request.user.is_authenticated:
#             #     # Отримуємо значення
#             #     raw_writer_id = getattr(request.user, 'user_id_1C', None)
                
#                 # if raw_writer_id:
#                     # ВИПРАВЛЕННЯ: якщо raw_writer_id це bytes, декодуємо в str, 
#                     # якщо це str, функція guid_to_1c_bin має його обробити.
#                     # Але судячи з помилки, функція хоче bytes для методу replace? 
#                     # Це дивно для GUID. Спробуємо примусово привести до str:
#                     # writer_bin = guid_to_1c_bin(str(raw_writer_id))

#             # logger.info("Creating ChatMessage", extra={
#             #     "tags": {
#             #         "chat": "create",
#             #         "calculation_guid": str(calculation_guid)
#             #     }
#             # })


#             ChatMessage.objects.create(
#                 chat_id=f"1_{calculation_guid}", 
#                 related_object_id=calculation_bin,
#                 author=contractor_bin,                      
#                 recipient=final_recipient,               
#                 text=data.get("comment"), 
#                 is_read=False,
#                 is_sent_vtg=True,
#                 is_notification=False,
#                 # event_type="CalculationCreated", # Додав, бо в моделі воно обов'язкове
#                 transaction_type_id=1 
#             )

#             # logger.info("ChatMessage created successfully", extra={
#             #     "tags": {
#             #         "chat": "success",
#             #         "calculation_guid": str(calculation_guid)
#             #     }
#             # })

#         except Exception as e:
#             import traceback
#             logger.error(f"Помилка створення ChatMessage для GUID {calculation_guid}: {str(e)}")
#             logger.error(traceback.format_exc())

#         # save_message(
#         #     transaction_type_id=serializer.validated_data["transaction_type_id"],
#         #     base_transaction_guid=serializer.validated_data.get("base_transaction_guid"),
#         #     message_text=serializer.validated_data["comment"],
#         #     writer_guid=writer_guid,
#         # )

#         logger.info(f"CreateCalculation END", extra={
#             "tags": {
#                 "action": "create_calculation",
#                 "stage": "end",
#                 "calculation_guid": str(calculation_guid),
#                 "contractor_guid": str(contractor_guid)
#             }
#         })



#         return Response(
#             {
#                 "success": True,
#                 "calculation_guid": result.get("calculationGUID"),

#                 "payload_sent_to_1c": payload,

      
#                 "result_1c": result,
#             },
#             status=201,
#         )


class CreateCalculationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOr1CApiKey]

    def _send_to_1c(self, payload: dict) -> dict:
        start_time = time.time()
        try:
            auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
            auth_b64 = base64.b64encode(auth_raw.encode("utf-8")).decode("ascii")

            response = requests.post(
                settings.ONE_C_URL,
                json=payload,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": f"Basic {auth_b64}",
                    "Query": "CreateCalculation"
                },
                timeout=30,
                verify=settings.ONE_C_VERIFY_SSL,
            )

            duration = time.time() - start_time
            logger.info("1C Response received", extra={
                'tags': {
                    'service': '1c-api', 
                    'duration_sec': duration,
                    'status_code': response.status_code
                }
            })

            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error("1C Integration Failed", exc_info=True, extra={
                'tags': {'service': '1c-api', 'action': 'create_calculation'}
            })
            raise

    @extend_schema(
        summary="Створення прорахунку та відправка в 1С",
        description=(
            "Створює новий прорахунок та відправляє його в 1С разом із супутніми файлами та фото.\n\n"
            " **Формат:** JSON (без multipart)\n"
            " **Файли та фото:** Передаються масивом об'єктів з Base64-кодуванням даних.\n\n"
            " **Доступ:**\n"
            "- JWT (portal)\n"
            "- 1C API key\n\n"
            " Контрагент:\n"
            "- admin / manager → передається в payload (можна вказати contractor_guid)\n"
            "- dealer / api key → визначається автоматично"
        ),
        # Використовуємо реальний серіалізатор, Swagger сам згенерує схему для file та photos[]
        request=CalculationCreateSerializer,
        responses={
            201: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "calculation_guid": {"type": "string", "format": "uuid"},
                    "payload_sent_to_1c": {"type": "object"},
                    "result_1c": {"type": "object"}
                }
            },
            400: {"description": "Помилка валідації вхідних даних або відмова 1С"}
        },
        tags=["order"]
    )
    def create(self, request):
        serializer = CalculationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            logger.warning(f"Access denied for create calculation: {str(e)}", extra={
                "tags": {
                    "action": "create_calculation",
                    "status": "forbidden"
                }
            })
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        file = data["file"]
        photos = data.get("photos", []) 

      
        payload = build_1c_payload(
            order_number=data["order_number"],
            items_count=data["items_count"],
            comment=data.get("comment", ""),
            contractor_guid=contractor_guid,
            delivery_address_guid=data.get("delivery_address_guid"),
            delivery_address_coordinates=data.get("delivery_address_coordinates"),
            client_address=data.get("client_address"),
            file_name=file["fileName"],
            file_b64=file["fileDataB64"],
            photos=photos,  
        )


        result = self._send_to_1c(payload)

        if not result.get("success", True):
            logger.error("1C returned error", extra={
                "tags": {"service": "1c", "status": "error"}
            })
            raise ValidationError({
                "detail": "1С повернула помилку",
                "1c_response": result,
                "payload_sent_to_1c": payload,
            })
        
        calculation_guid = extract_calculation_guid(result)

        if not calculation_guid:
            logger.error("Missing calculation GUID from 1C response", extra={
                "tags": {"service": "1c", "error": "missing_guid"}
            })
            raise ValidationError({
                "detail": "1С не повернула calculationGUID",
                "1c_response": result,
            })

      
        try:
            calculation_bin = guid_to_1c_bin(str(calculation_guid))
            main_manager_bin = get_contractor_main_manager_bin(contractor_bin)
            final_recipient = main_manager_bin if main_manager_bin else contractor_bin
            
            comment_text = data.get("comment")
            comment_text = comment_text.strip() if comment_text else None

            if comment_text:
                ChatMessage.objects.create(
                    chat_id=f"1_{calculation_guid}", 
                    related_object_id=calculation_bin,
                    author=contractor_bin,                      
                    recipient=final_recipient,               
                    text=comment_text, 
                    is_read=False,
                    is_sent_vtg=True,
                    is_notification=False,
                    transaction_type_id=1 
                )
        except Exception as e:
            import traceback
            logger.error(f"Помилка створення ChatMessage для GUID {calculation_guid}: {str(e)}")
            logger.error(traceback.format_exc())

        logger.info("CreateCalculation END", extra={
            "tags": {
                "action": "create_calculation",
                "stage": "end",
                "calculation_guid": str(calculation_guid),
                "contractor_guid": str(contractor_guid)
            }
        })

        return Response(
            {
                "success": True,
                "calculation_guid": result.get("calculationGUID"),
                "payload_sent_to_1c": payload,
                "result_1c": result,
            },
            status=status.HTTP_201_CREATED,
        )



@extend_schema(
    summary="Адреси дилера (доставка / юридичні)",
    description=(
        "Повертає список **адрес дилера** (доставка та/або юридичні).\n\n"
        " Дані беруться з SQL-процедури **dbo.GetDealerAddresses**.\n\n"
        " **Доступ:**\n"
        "- JWT:\n"
        "  - admin   → можуть передати contractor\n"
        "  - customer / dealer → тільки свій контрагент\n"
        "- 1C API Key → автоматично по UserId1C\n\n"
        " **Параметри:**\n"
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
    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    contractor_bin, contractor_guid = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor"
    )

    # logger.info(f"Fetching addresses for contractor", extra={
    #     'tags': {
    #         'action': 'get_dealer_addresses',
    #         'contractor': contractor_guid,
    #         'user': user_name
    #     }
    # })

    try:

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetDealerAddresses @ContractorLink=%s",
                [contractor_bin]
            )
            columns = [c[0] for c in cursor.description]
            rows = [dict(zip(columns, r)) for r in cursor.fetchall()]


        duration = time.time() - start_time

        # logger.info(f"Successfully retrieved {len(rows)} addresses", extra={
        #     'tags': {
        #         'action': 'get_dealer_addresses',
        #         'status': 'success',
        #         'contractor': contractor_guid,
        #         'count': len(rows),
        #         'duration_sec': round(duration, 4)
        #     }
        # })

        return Response({"success": True, "addresses": rows})

    except Exception as e:
       
        logger.error(f"Error retrieving dealer addresses: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_dealer_addresses',
                'status': 'error',
                'contractor': contractor_guid
            }
        })

        raise e




@extend_schema(
    summary="Отримати WDS-коди по контрагенту",
    description=(
        "Повертає список **WDS-кодів** для контрагента.\n\n"
        " Дані отримуються з процедури **dbo.GetWDSCodes_ByContractor**.\n\n"
        " **Доступ:**\n"
        "- JWT:\n"
        "  - admin → може передати contractor\n"
        "  - dealer / customer → тільки свій контрагент\n"
        "- 1C API Key → автоматично по UserId1C\n\n"
        " Можна обмежити вибірку датами (`date_from`, `date_to`).\n"
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
    
    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    contractor_bin, contractor_guid = resolve_contractor(request)

    raw_from = request.GET.get("date_from")
    raw_to = request.GET.get("date_to")
    
    date_from = parse_date(raw_from, "date_from")
    date_to = parse_date(raw_to, "date_to")

    # logger.info(f"Fetching WDS codes for contractor", extra={
    #     'tags': {
    #         'action': 'get_wds_codes',
    #         'contractor': contractor_guid,
    #         'user': user_name,
    #         'period_start': raw_from,
    #         'period_end': raw_to
    #     }
    # })


    try:

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


        
        duration = time.time() - start_time


        logger.info(f"Successfully got {len(rows)} WDS codes", extra={
            'tags': {
                'action': 'get_wds_codes',
                'status': 'success',
                'contractor': contractor_guid,
                'count': len(rows),
                'duration_sec': round(duration, 4)
            }
        })

        return Response({
            "contractor": contractor_guid,
            "date_from": request.GET.get("date_from"),
            "date_to": request.GET.get("date_to"),
            "count": len(rows),
            "items": rows
        })
    except Exception as e:

        logger.error(f"Error retrieving WDS codes: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_wds_codes',
                'status': 'error',
                'contractor': contractor_guid
            }
        })
        raise e
    




@extend_schema(
    summary="Отримати історію коментарів транзакції",
    description="""
Повертає список коментарів. Якщо запит йде через API Key, обов'язково передавайте 'author_guid' у QUERY параметрах, 
щоб система знала, чиї повідомлення НЕ треба помічати як прочитані.
""",
    parameters=[
        OpenApiParameter(name="base_transaction_guid", type=str, location=OpenApiParameter.QUERY, required=True),
        OpenApiParameter(name="transaction_type_id", type=int, location=OpenApiParameter.QUERY, required=True),
        OpenApiParameter(
            name="author_guid", 
            type=str, 
            location=OpenApiParameter.QUERY, 
            required=False, 
            description="GUID автора запиту (обов'язково для API Key)"
        ),
        OpenApiParameter(
            name="lang",
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description="Мова відображення повідомлень (uk, en, de). Якщо передано, вільний текст перекладається під час перегляду без збереження в БД."
        ),
    ],
    responses={200: OpenApiResponse(description="Список повідомлень")},
    tags=["Messages"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_messages(request):


    start_time = time.time()


    base_transaction_guid = request.GET.get("base_transaction_guid")
    transaction_type_id = request.GET.get("transaction_type_id")
    author_guid_param = request.GET.get("author_guid")
    requested_language = get_requested_portal_language(request, fallback="uk")

    if not base_transaction_guid or not transaction_type_id:
        return Response(
            {"error": "base_transaction_guid and transaction_type_id are required"},
            status=400
        )

    current_author_bin = None
    auth_method = "JWT" if request.auth != "1C_API_KEY" else "1C_API_KEY"

    
    if request.auth == "1C_API_KEY":

        if not author_guid_param:
            return Response({"error": "author_guid parameter is required for API Key auth"}, status=400)
        try:
            current_author_bin = guid_to_1c_bin(author_guid_param)
        except Exception:
            return Response({"error": "Invalid author_guid format"}, status=400)
    else:
 
        current_author_bin = getattr(request.user, 'user_id_1C', None)

    try:
        base_transaction_bin = guid_to_1c_bin(base_transaction_guid)
    except Exception:
        return Response({"error": "Invalid base_transaction_guid"}, status=400)


    messages_qs = ChatMessage.objects.filter(
        related_object_id=base_transaction_bin,
        transaction_type_id=transaction_type_id,
        is_notification=False
    ).order_by("timestamp")

 
    if current_author_bin:
        messages_qs.filter(
            is_read=False
        ).exclude(
            author=current_author_bin
        ).update(is_read=True)


    messages = list(messages_qs)

  
    author_ids = {
        m.author
        for m in messages
        if isinstance(m.author, (bytes, bytearray))
    }

    users_map = {
        u.user_id_1C: u
        for u in CustomUser.objects.filter(user_id_1C__in=author_ids)
    }

    translated_messages = {}
    result = []
    for m in messages:
        author_data = None
        if isinstance(m.author, (bytes, bytearray)):
            user = users_map.get(m.author)
            if user:
                author_data = {
                    "id_1c": bin_to_guid_1c(m.author),
                    # "username": user.username,
                    "full_name": (user.full_name or user.username),
                    # "type": "PortalUser",
                }
            else:
                author_data = get_author_from_1c(m.author)

        original_message = m.text or ""
        if original_message not in translated_messages:
            translated_messages[original_message] = translate_portal_message_for_view(
                original_message,
                requested_language,
                field_name="chat_message",
                entity_type="chat_message",
                entity_id=m.id,
                source_locale_hint="uk",
            )
        translated = translated_messages[original_message]

        result.append({
            "id": m.id,
            "message": translated["message"],
            "original_message": translated["original_message"],
            "message_language": translated["message_language"],
            "display_language": translated["display_language"],
            "is_auto_translated": translated["is_auto_translated"],
            "created_at": m.timestamp,
            "is_read": m.is_read,
            "author": author_data,
        })

    duration = time.time() - start_time
    

    # logger.info(f"Messages retrieved for transaction {base_transaction_guid}", extra={
    #     'tags': {
    #         'action': 'get_messages',
    #         'transaction_id': base_transaction_guid,
    #         'auth_type': auth_method,
    #         'messages_count': len(result),
    #         'duration_sec': round(duration, 4)
    #     }
    # })

    return Response(result)




@extend_schema(
    summary="Завантажити файл заявки на прорахунок",
    description=(
        "Завантажує файл зі сховища **1С (SMB)** для заявок на прорахунок (ВМ).\n\n"
        " Шлях у сховищі:\n"
        "`я/{calc_guid}/{file_guid}/{filename}`"
    ),
    parameters=[
        OpenApiParameter(name="calc_guid", type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description="GUID заявки (прорахунку)", required=True),
        OpenApiParameter(name="file_guid", type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description="GUID файлу", required=True),
        OpenApiParameter(name="filename", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Назва файлу з розширенням", required=True),
    ],
    responses={200: {"content": {"application/octet-stream": {}}}, 404: OpenApiTypes.OBJECT},
    tags=["finance"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def download_calculation_file(request, calc_guid, file_guid):
    """
    Завантажує файл заявки на прорахунок (ВМ) 
    """


    start_time = time.time()

    filename = request.GET.get("filename")
    if not filename:
        raise Http404("Filename is required")

    filename = unquote(filename)

    remote_path = f"/{settings.SMB_SERVER}/{settings.SMB_SHARE}/Заявка на просчет (ВМ)/{calc_guid}/{file_guid}/{filename}"

    
    # logger.info(f"Start get a file {remote_path}")

    try:

        stat = smbclient.stat(remote_path)

        file_handle = smbclient.open_file(remote_path, mode="rb")

        content_type, _ = mimetypes.guess_type(filename)
        

        response = StreamingHttpResponse(
            file_handle, 
            content_type=content_type or "application/octet-stream"
        )
        
  
        response["Content-Length"] = stat.st_size
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response

    except Exception as e:

        logger.error(f"SMB Download Error for path {remote_path}: {str(e)}", exc_info=True, extra={
            'tags': {'action': 'download_calculation_file'}})
        raise Http404("Файл не знайдено або помилка доступу")
    





@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_order(request, order_id):
    start_time = time.time()
    user = request.user


    # logger.info(f"User {user.username} is confirming order №{order_id}", extra={
    #     'tags': {
    #         'action': 'confirm_order',
    #         'order_id': order_id,
    #         'user': user.username,
    #         'status': 'initiated'
    #     }
    # })

    try:
        query_name = "ConfirmOrder"
        payload = {
            "order_id": str(order_id),
            "confirmed_by_user": user.username 
        }

  
        result = send_to_1c(query_name, payload)
        
        duration = time.time() - start_time


        logger.info(f"Successfully confirmed order №{order_id} in 1C", extra={
            'tags': {
                'action': 'confirm_order',
                'order_id': order_id,
                'user': user.username,
                'status': 'success',
                'duration_sec': round(duration, 3)
            },
            '1c_response': result 
        })

        return Response({
            "success": True,
            "message": "Замовлення підтверджено в 1С",
            "data_from_1c": result
        }, status=status.HTTP_200_OK)

    except ValidationError as e:
        duration = time.time() - start_time
        logger.error(f"Validation error in confirm order №{order_id}: {str(e)}", extra={
            'tags': {
                'action': 'confirm_order',
                'order_id': order_id,
                'status': 'validation_error',
                'duration_sec': round(duration, 3)
            }
        })
        return Response(e.detail, status=status.HTTP_502_BAD_GATEWAY)

    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Unexpected error in confirm order №{order_id}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'confirm_order',
                'order_id': order_id,
                'status': 'critical_error',
                'duration_sec': round(duration, 3)
            }
        })
        return Response({"detail": "Внутрішня помилка сервера"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



class DeleteCalculationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, calculation_guid):
        """
        Видалення прорахунку + відправка в 1С
        """

        start_time = time.time()
        user = request.user
        user_name = user.username if user.is_authenticated else "anonymous"

        # 1. Логуємо намір видалення
        # logger.info(f"User {user_name} is deleting calculation {calculation_guid}", extra={
        #     'tags': {
        #         'action': 'delete_calculation',
        #         'status': 'initiated',
        #         'calculation_id': str(calculation_guid),
        #         'user': user_name
        #     }
        # })


        payload = {
            "calculation_id": str(calculation_guid),
        }

        try:

            result = send_to_1c("DeleteCalculation", payload)

            duration = time.time() - start_time

            if not result.get("success", True):
                logger.warning(f"1C rejected deletion of calculation {calculation_guid}", extra={
                    'tags': {
                        'action': 'delete_calculation',
                        'status': 'failed_by_1c',
                        'calculation_id': str(calculation_guid),
                        'duration_sec': round(duration, 3)
                    },
                    'result_1c': result
                })


                return Response(
                    {
                        "detail": "1С повернула помилку",
                        "result_1c": result,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            

            logger.info(f"Successfully deleted calculation {calculation_guid}", extra={
                'tags': {
                    'action': 'delete_calculation',
                    'status': 'success',
                    'calculation_id': str(calculation_guid),
                    'user': user_name,
                    'duration_sec': round(duration, 3)
                }
            })

            return Response(
                {
                    "success": True,
                    "calculation_id": str(calculation_guid),
                    "result_1c": result,
                },
                status=status.HTTP_200_OK,
            )
    
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Error during calculation deletion {calculation_guid}: {str(e)}", exc_info=True, extra={
                'tags': {
                    'action': 'delete_calculation',
                    'status': 'error',
                    'calculation_id': str(calculation_guid),
                    'duration_sec': round(duration, 3)
                }
            })
            return Response(
                {"detail": "Внутрішня помилка при видаленні прорахунку"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        


class ProductionStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            return Response({"detail": str(e)}, status=400)

        year = int(request.GET.get("year", 2025))
        top_count = int(request.GET.get("top", 100000))

        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC dbo.GetProductionStatistics
                    @Year = %s,
                    @Contractor_ID = %s,
                    @TopCount = %s
            """, [year, contractor_bin, top_count])

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            

        items = [dict(zip(columns, row)) for row in rows]

        summary = collections.defaultdict(float)
        for item in items:
            cat = item.get('CategoryName_UA', 'Інше')
            summary[cat] += float(item.get('TotalQuantity', 0))

        chart_data = {
            "labels": list(summary.keys()),
            "values": list(summary.values())
        }

        return Response({
            "contractor_guid": contractor_guid,
            "year": year,
            "summary_chart": chart_data, 
            "items": items,              
        })
    

class DealerDetailedStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            return Response({"detail": str(e)}, status=400)


        year = int(request.GET.get("year", 2025))


        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC [dbo].[GetDetailedDealerStatistics]
                    @Year = %s,
                    @Contractor_ID = %s
            """, [year, contractor_bin])

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()


        items = [dict(zip(columns, row)) for row in rows]


        summary = {
            "avg_check" : items[0]["AvgOrderValue"] if items else 0,
            "avg_production": items[0]["AvgProductionDays"] if items else 0,
            "avg_delivery": items[0]["AvgDeliveryDaysFact"] if items else 0,
            "total_lifecycle": items[0]["AvgTotalLifecycleDays"] if items else 0,
            "complaint_rate": items[0]["ComplaintRatePercent"] if items else 0,
            "total_sum": items[0]["TotalSumYear"] if items else 0,
        }

        return Response({
            "contractor_guid": contractor_guid,
            "year": year,
            "kpi": summary,      
            "items": items,      
        })
    


class DealerFullAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            return Response({"detail": str(e)}, status=400)

        
        date_from = request.GET.get("date_from", "2026-01-01")
        date_to = request.GET.get("date_to", "2026-12-31")
        db_alias = 'default'


        try:
            with connections[db_alias].cursor() as cursor:

                cursor.execute(
                    "SET ANSI_WARNINGS OFF; EXEC [dbo].[GetProductionStatistics] %s, %s, %s, 100000", 
                    [date_from, date_to, contractor_bin]
                )
                tech_items = self.dictfetchall(cursor)


                cursor.execute(
                    "SET ANSI_WARNINGS OFF; EXEC [dbo].[GetContractorMonthlyTop] %s, %s, %s", 
                    [date_from, date_to, contractor_bin]
                )
                monthly_stats = self.dictfetchall(cursor)
                
        except DatabaseError as e:
            error_msg = str(e)
    
            if "927" in error_msg or "процессе восстановления" in error_msg.lower():
                return Response({
                    "error": "database_recovery",
                    "detail": "База даних оновлюється (процес відновлення). Спробуйте через 3 хвилини. Точну відповідь скажу пізніше."
                }, status=503)
            

            return Response({
                "detail": "Помилка при зверненні до бази даних. Спробуйте пізніше."
            }, status=500)

 
        total_constructions = sum(item.get("TotalQuantity", 0) for item in tech_items)
        
        return Response({
            "contractor_guid": contractor_guid,
            "period": {"from": date_from, "to": date_to},
            "charts": {
                "monthly": monthly_stats
            },
            "tables": {
                "tech_details": tech_items,
            },
            "summary": {
                "total_constructions": total_constructions
            }
        })

    def dictfetchall(self, cursor):
        if cursor.description is None: return []
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


    


class OrdersDealerStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            return Response({"detail": str(e)}, status=400)

        date_from = request.GET.get("date_from", "2026-01-01")
        date_to = request.GET.get("date_to", "2026-12-31")
        db_alias = 'default'
        
 
        try:
            with connections[db_alias].cursor() as cursor:
                cursor.execute("SET ANSI_WARNINGS OFF; EXEC [dbo].[GetFullDealerAnalytics] %s, %s, %s", 
                               [date_from, date_to, contractor_bin])
                
              
                hardware_items = self.dictfetchall(cursor)
                
                hardware_kpi = {
                    "total_orders": hardware_items[0].get("КількістьЗамовлень") if hardware_items else 0,
                    "delivery_days": hardware_items[0].get("СрокПоставки") if hardware_items else 0,
                    "abc_class": hardware_items[0].get("ABC") if hardware_items else None,
                }

             
                cursor.nextset()
                profile_color_items = self.dictfetchall(cursor)
                cursor.nextset()
                profile_system_items = self.dictfetchall(cursor)
                cursor.nextset()
                prefix_items = self.dictfetchall(cursor)

        except DatabaseError as e:
   
            print(f"MSSQL Error: {str(e)}")
            
  
            error_msg = str(e)
            if "927" in error_msg or "процессе восстановления" in error_msg.lower():
                return Response({
                    "error": "database_recovery",
                    "detail": "База даних оновлюється. Спробуйте через 3 хвилини."
                }, status=503) 
            
         
            return Response({
                "detail": "Тимчасова помилка бази даних. Спробуйте пізніше."
            }, status=500)


        return Response({
            "contractor_guid": contractor_guid,
            "period": {"from": date_from, "to": date_to},
            "hardware": {
                "kpi": hardware_kpi,
                "items": hardware_items,
            },
            "profile_color": profile_color_items,
            "profile_system": profile_system_items,
            "prefixes": prefix_items,
        })
    

    def dictfetchall(self, cursor):
        """Допоміжний метод для перетворення результатів курсора в список словників"""
        if cursor.description is None:
            return []
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]



# class DashboardConfigView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get_default_layout(self):

#         return {
#             "dashboards": [
#                 {
#                     "id": 1, 
#                     "name": "Основний", 
#                     "components": [
#                         {"id": "comp-1", "type": "PrefixCategoryDisplay", "colSpan": 12, "rowSpan": 25},
#                         {"id": "comp-2", "type": "EfficiencyChart", "colSpan": 6, "rowSpan": 13},
#                         {"id": "comp-3", "type": "VolumeChart", "colSpan": 6, "rowSpan": 13},
#                         {"id": "comp-4", "type": "ProfileColorChart", "colSpan": 6, "rowSpan": 17},
#                         {"id": "comp-5", "type": "ProfileSystemChart", "colSpan": 6, "rowSpan": 17},
#                         {"id": "comp-6", "type": "ColorSystemHeatmap", "colSpan": 12, "rowSpan": 17},
#                         {"id": "comp-7", "type": "FurnitureChart", "colSpan": 12, "rowSpan": 17},
#                         {"id": "comp-8", "type": "ComplexityDonut", "colSpan": 12, "rowSpan": 17},
#                         {"id": "comp-9", "type": "ComplexityTreemap", "colSpan": 12, "rowSpan": 16},
#                     ]
#                 }
#             ]
#         }

#     def get(self, request):
#         config_obj = UserDashboardConfig.objects.filter(
#             user=request.user, 
#             layout_name='default'
#         ).first()

#         if config_obj:
#             data = config_obj.config

#             if "components" in data and "dashboards" not in data:
#                 return Response({
#                     "dashboards": [
#                         {"id": 1, "name": "Мій Дашборд", "components": data["components"]}
#                     ]
#                 })
#             return Response(data)
        
#         return Response(self.get_default_layout())

#     def post(self, request):
#         new_config_data = request.data
        
#         # Оновлена перевірка: шукаємо або 'dashboards', або старий 'components'
#         if not new_config_data.get('dashboards') and not new_config_data.get('components'):
#             return Response({"error": "Config data is required (dashboards or components)"}, status=400)

#         # Оновлюємо або створюємо запис
#         config_obj, created = UserDashboardConfig.objects.update_or_create(
#             user=request.user,
#             layout_name='default',
#             defaults={'config': new_config_data}
#         )

#         return Response({"status": "success", "message": "Saved"}, status=status.HTTP_200_OK)
    





class PartnerDebtsView(APIView):
    permission_classes = [IsAuthenticated]

    def dictfetchall(self, cursor):
        """Повертає всі рядки з курсору як словники"""
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get(self, request):

        start_time = time.time()
        user_name = request.user.username if request.user.is_authenticated else "unknown"

        try:


         
            contractor_bin, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            logger.warning(f"Unauthorized debt access attempt by {user_name}: {str(e)}")
            return Response({"detail": str(e)}, status=400)

        # db_alias = 'db_2' 

        # logger.info(f"Fetching partner debts for {contractor_guid}", extra={
        #     'tags': {
        #         'action': 'get_partner_debts',
        #         'user': user_name,
        #         'contractor': contractor_guid
        #     }
        # })

        try:
            with connection.cursor() as cursor:

                cursor.execute("EXEC [dbo].[GetPartnerDebtsDirect] @TargetPartnerID=%s", 
                               [contractor_bin])
                
     
                raw_data = self.dictfetchall(cursor)

                orders = [item for item in raw_data if item.get('SortOrder') == 0]
                summary = next((item for item in raw_data if item.get('SortOrder') == 1), None)


            duration = time.time() - start_time

            logger.info(f"Successfully got debts for {contractor_guid}", extra={
                'tags': {
                    'action': 'get_partner_debts',
                    'status': 'success',
                    'duration_sec': round(duration, 4),
                    'items_count': len(orders)
                }
            })

            return Response({
                "contractor_guid": contractor_guid,
                "debts": {
                    "items": orders,
                    "total": summary
                }
            })



        except DatabaseError as e:
            duration = time.time() - start_time
            error_msg = str(e)

            # Специфічне логування помилки відновлення бази (927)
            if "927" in error_msg or "recovery" in error_msg.lower():
                logger.error(f"Database in recovery mode during debt request: {error_msg}", extra={
                    'tags': {'action': 'get_partner_debts', 'status': 'db_recovery', 'duration_sec': round(duration, 4)}
                })
                return Response({
                    "error": "database_recovery",
                    "detail": "База даних оновлюється. Спробуйте через декілька хвилин."
                }, status=503)
            
           
            logger.error(f"SQL Error in PartnerDebtsView: {error_msg}", exc_info=True, extra={
                'tags': {'action': 'get_partner_debts', 'status': 'db_error', 'contractor': contractor_guid}
            })
            return Response({
                "detail": f"Помилка бази даних: {error_msg}"
            }, status=500)





@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """
    Повертає список сповіщень. 
    Підтримує фільтрацію за конкретним контрагентом для адмінів через параметри запиту.
    """

    

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "unknown"

    try:

        contractor_bin, contractor_guid = resolve_contractor(request)
    except (PermissionError, ValueError) as e:
        logger.warning(f"Notification access denied for {user_name}: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # logger.info(f"User {user_name} fetching notifications", extra={
    #     'tags': {
    #         'action': 'get_notifications',
    #         'user': user_name,
    #         'contractor': contractor_guid
    #     }
    # })

    try:

        notifications_qs = ChatMessage.objects.filter(
            recipient=contractor_bin,
            is_notification=True
        ).select_related('transaction_type').order_by('-timestamp')[:100]

        result = []
        for msg in notifications_qs:

            t_type_id = msg.transaction_type_id if msg.transaction_type_id else 0
            
            doc_num = get_document_number_by_guid(msg.related_object_id, t_type_id)

            doc_year = get_document_year_by_guid(msg.related_object_id, t_type_id)

            result.append({
                "id": msg.id,
                "eventType": msg.event_type,
                "message": msg.text,
                "isRead": msg.is_read,
                "createdAt": msg.timestamp,
                "transactionType": msg.transaction_type.type_name if msg.transaction_type else None,
                "doc_number": doc_num,
                "relatedObjectId": bin_to_guid_1c(msg.related_object_id) if msg.related_object_id else None,
                "authorId": bin_to_guid_1c(msg.author) if msg.author else None,
                "chatId": msg.chat_id,
                "docYear": doc_year,
            })

        duration = time.time() - start_time

        # logger.info(f"Successfully retrieved {len(result)} notifications", extra={
        #     'tags': {
        #         'action': 'get_notifications',
        #         'status': 'success',
        #         'contractor': contractor_guid,
        #         'count': len(result),
        #         'duration_sec': round(duration, 4)
        #     }
        # })


        return Response({
            "status": "success",
            "data": result
        })
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Error fetching notifications for {user_name}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_notifications',
                'status': 'error',
                'duration_sec': round(duration, 4)
            }
        })
        return Response({
            "status": "error", 
            "message": "Внутрішня помилка при отриманні сповіщень"
        }, status=500)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
@safe_view
def get_notifications_count(request):
    """
    Повертає кількість непрочитаних сповіщень для поточного контрагента (асинхронно).
    """
    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "unknown"

    # Внутрішня асинхронна функція для роботи з I/O
    async def _async_logic():
        try:
            # Загортаємо resolve_contractor, якщо вона робить синхронні запити в БД
            contractor_bin, contractor_guid = await sync_to_async(resolve_contractor)(request)
        except (PermissionError, ValueError) as e:
            return {"error_type": "auth", "message": str(e), "status_code": status.HTTP_400_BAD_REQUEST}

        try:
            # Використовуємо нативний асинхронний метод Django ORM для підрахунку рядків
            unread_count = await ChatMessage.objects.filter(
                recipient=contractor_bin,
                is_notification=True,
                is_read=False
            ).acount()  # <--- Асинхронний count

            return {
                "status": "success",
                "unreadCount": unread_count,
                "contractor_guid": contractor_guid
            }

        except Exception as e:
            return {
                "error_type": "server",
                "message": str(e),
                "status_code": 500,
                "contractor_guid": contractor_guid if 'contractor_guid' in locals() else "unknown"
            }

    # Виконуємо асинхронну логіку всередині синхронного контексту DRF
    result = async_to_sync(_async_logic)()

    # Обробка помилок
    if "error_type" in result:
        duration = time.time() - start_time
        err_type = result["error_type"]
        
        if err_type == "auth":
            logger.warning(f"Notification count access denied for {user_name}: {result['message']}")
            return Response({"status": "error", "message": result["message"]}, status=result["status_code"])
            
        if err_type == "server":
            logger.error(f"Error counting notifications for {user_name}: {result['message']}", exc_info=True, extra={
                'tags': {
                    'action': 'get_notifications_count',
                    'status': 'error',
                    'duration_sec': round(duration, 4)
                }
            })
            return Response({"status": "error", "message": "Internal server error during counting"}, status=result["status_code"])

    # Успішна відповідь
    duration = time.time() - start_time
    
    # Роскомментуйте, якщо логгер потрібен на продакшені:
    # logger.info(f"Unread notifications count for {user_name}: {result['unreadCount']}", extra={
    #     'tags': {
    #         'action': 'get_notifications_count',
    #         'status': 'success',
    #         'user': user_name,
    #         'contractor': result['contractor_guid'],
    #         'unread_val': result['unreadCount'],
    #         'duration_sec': round(duration, 4)
    #     }
    # })

    return Response({
        "status": "success",
        "unreadCount": result["unreadCount"]
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notifications_as_read(request):
    """
    Позначає всі сповіщення (is_notification=True) поточного контрагента як прочитані.
    """
    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "unknown"

    try:

        contractor_bin, contractor_guid = resolve_contractor(request)
    except (PermissionError, ValueError) as e:

        logger.error(f"Unauthorized mark_as_read attempt by {user_name}: {str(e)}", extra={
            'tags': {'action': 'mark_notifications_read', 'status': 'auth_error', 'user': user_name}
        })
        return Response({
            "status": "error", 
            "message": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


    try:
        updated_count = ChatMessage.objects.filter(
            recipient=contractor_bin,
            is_notification=True,
            is_read=False
        ).update(is_read=True)

        duration = time.time() - start_time

        # 3. Лог успіху
        # logger.info(f"User {user_name} marked {updated_count} notifications as read", extra={
        #     'tags': {
        #         'action': 'mark_notifications_read',
        #         'status': 'success',
        #         'user': user_name,
        #         'contractor': contractor_guid,
        #         'updated_count': updated_count,
        #         'duration_sec': round(duration, 4)
        #     }
        # })



        return Response({
            "status": "success", 
            "message": f"Позначено як прочитані: {updated_count} сповіщень"
        })
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Error marking notifications as read for {user_name}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'mark_notifications_read',
                'status': 'error',
                'duration_sec': round(duration, 4)
            }
        })
        return Response({
            "status": "error", 
            "message": "Внутрішня помилка сервера при оновленні сповіщень"
        }, status=500)







class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        return ChatMessage.objects.filter(chat_id=chat_id).order_by('timestamp')
    


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_single_notification_as_read(request, pk):

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "unknown"

    try:
       
        from records.models import ChatMessage
        contractor_bin, contractor_guid = resolve_contractor(request)
        
        notification = ChatMessage.objects.get(pk=pk, recipient=contractor_bin)
        notification.is_read = True
        notification.save()

        duration = time.time() - start_time

        # 3. Лог успіху
        # logger.info(f"Notification {pk} marked as read by {user_name}", extra={
        #     'tags': {
        #         'action': 'mark_single_notification_read',
        #         'status': 'success',
        #         'notification_id': pk,
        #         'user': user_name,
        #         'contractor': contractor_guid,
        #         'duration_sec': round(duration, 4)
        #     }
        # })
        
        return Response({"status": "success"})
    
    except ChatMessage.DoesNotExist:
        logger.warning(f"Notification {pk} not found for user {user_name}", extra={
            'tags': {
                'action': 'mark_single_notification_read',
                'status': 'not_found',
                'notification_id': pk
            }
        })
        return Response({"status": "error", "message": "Notification not found"}, status=404)
    



class PortalManagerReportView(APIView):
    """
    Повертає звіт про менеджерів та закріплених за ними дилерів порталу.
    Викликає SQL-процедуру та повертає чистий JSON.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        start_time = time.time()
        user_name = request.user.username if request.user.is_authenticated else "unknown"

        # logger.info(f"User {user_name} requested Portal Manager Report", extra={
        #     'tags': {
        #         'action': 'get_manager_report',
        #         'user': user_name
        #     }
        # })

        try:
            with connection.cursor() as cursor:
       
                cursor.execute("EXEC [dbo].[GetPortalManagersWithDealers]")
                
             
                columns = [col[0] for col in cursor.description]
                
              
                managers_list = []
                for row in cursor.fetchall():
                
                    row_dict = dict(zip(columns, row))
                    
     
                    if row_dict.get("ManagerID"):
                        row_dict["ManagerID"] = bin_to_guid_1c(row_dict["ManagerID"])
                    
                    managers_list.append(row_dict)

            duration = time.time() - start_time

            logger.info(f"Portal Manager Report generated successfully", extra={
                'tags': {
                    'action': 'get_manager_report',
                    'status': 'success',
                    'count': len(managers_list),
                    'duration_sec': round(duration, 4)
                }
            })

            return Response({
                "success": True,
                "count": len(managers_list),
                "managers": managers_list
            })

        except Exception as e:
            duration = time.time() - start_time
   
            logger.error(f"PortalManagerReport error: {str(e)}", exc_info=True, extra={
                'tags': {
                    'action': 'get_manager_report',
                    'status': 'error',
                    'duration_sec': round(duration, 4)
                }
            })
            
            return Response({
                "success": False, 
                "error": "Не вдалося отримати звіт з бази даних."
            }, status=500)
        


import os
import time
import mimetypes
import logging
import tempfile
from urllib.parse import unquote, quote
import smbclient
from django.conf import settings
from django.http import Http404, StreamingHttpResponse
from django.db import connection, DatabaseError
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from ranged_fileresponse import RangedFileResponse


from django.http import StreamingHttpResponse, Http404
from django.shortcuts import redirect
from urllib.parse import quote, unquote
import mimetypes
import os
import tempfile
import smbclient


def content_disposition_header(disposition, filename):
    safe_ascii = filename.encode("ascii", "ignore").decode() or "file"
    quoted = quote(filename)
    return f'{disposition}; filename="{safe_ascii}"; filename*=UTF-8\'\'{quoted}'


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def download_calc(request, order_guid, file_guid):
    filename = request.GET.get("filename")

    if not filename:
        raise Http404("Filename is required")

    filename = unquote(filename)
    file_ext = os.path.splitext(filename.lower())[1]

    content_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".txt": "text/plain; charset=utf-8",
        ".xml": "application/xml",
        ".zkz": "application/octet-stream",
    }

    content_type = content_types.get(file_ext)
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        content_type = content_type or "application/octet-stream"

    inline_extensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt"]
    disposition = "inline" if file_ext in inline_extensions else "attachment"

    remote_path = (
        f"/{settings.SMB_SERVER}/{settings.SMB_SHARE}/"
        f"Заявка на просчет (ВМ)/{order_guid}/{file_guid}/{filename}"
    )

    try:
        stat = smbclient.stat(remote_path)
        file_handle = smbclient.open_file(remote_path, mode="rb")

        response = StreamingHttpResponse(file_handle, content_type=content_type)
        response["Content-Length"] = stat.st_size
        response["Content-Disposition"] = content_disposition_header(disposition, filename)
        response["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Length"

        return response

    except Exception as smb_error:
        logger.warning(
            f"SMB calculation file missing, switching to DB fallback. Path: {remote_path} | Reason: {str(smb_error)}",
            extra={"tags": {"action": "download_calc", "stage": "smb_fallback"}}
        )

    try:
        binary_guid = guid_to_1c_bin(file_guid)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC [dbo].[GetBinaryFile] @FileLink = %s",
                [binary_guid]
            )
            row = cursor.fetchone()

        if not row or not row[0]:
            return redirect(f"{settings.FRONTEND_URL}file-preview/not-found?filename={quote(filename)}")

        raw_db_blob = row[0]
        db_filename = row[1] or filename

        file_bytes = extract_1c_binary(raw_db_blob)

        if not file_bytes:
            return redirect(f"{settings.FRONTEND_URL}file-preview/corrupted?filename={quote(filename)}")

        current_ext = os.path.splitext(filename)[1]

        if not current_ext:
            detected_ext = guess_extension_from_bytes(file_bytes[:32])
            if detected_ext:
                filename += detected_ext
                file_ext = detected_ext.lower()

        content_type = content_types.get(file_ext)
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            content_type = content_type or "application/octet-stream"

        disposition = "inline" if file_ext in inline_extensions else "attachment"

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
        tmp.write(file_bytes)
        tmp.close()

        response = RangedFileResponse(
            request,
            open(tmp.name, "rb"),
            content_type=content_type
        )

        response["Content-Length"] = str(len(file_bytes))
        response["Content-Disposition"] = content_disposition_header(disposition, filename or db_filename)
        response["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Length"

        return response

    except Exception as db_error:
        logger.exception(f"Critical error in download_calc DB extraction: {str(db_error)}")
        return redirect(f"{settings.FRONTEND_URL}file-preview/not-found?filename={quote(filename)}")

@extend_schema(
    summary="Отримати список файлів прорахунку",
    description=(
        "Повертає список усіх файлів (ZKZ, фото, документи), які прив'язані до "
        "конкретної заявки на прорахунок в 1С.\n\n"
        "Дані вичитуються через SQL-процедуру `dbo.GetOrdersFiles`.\n"
        "Використовується для первинного рендерингу списку всередині React-модалки прев'ю."
    ),
    parameters=[
        OpenApiParameter(
            name="order_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="GUID заявки на прорахунок (order_guid)",
            required=True,
        ),
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "status": {"type": "string", "example": "success"},
                "files": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "fileGuid": {"type": "string", "example": "b1b2c3d4-..."},
                            "fileName": {"type": "string", "example": "чертеж.png"},
                            "type": {"type": "string", "example": "Фото обьекта"},
                            "date": {"type": "string", "format": "date-time"}
                        }
                    }
                }
            }
        },
        400: {"description": "Некоректний формат GUID"},
        500: {"description": "Внутрішня помилка сервера або БД"}
    },
    tags=["order"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated]) # Або ваша кастомна IsAuthenticatedOr1CApiKey
def get_calc_files(request, order_guid):
    """
    Отримує список метаданих файлів (ZKZ, фото) для модалки.
    """
    start_time = time.time()
    
    if not order_guid or len(str(order_guid)) < 32:
        return Response({"status": "error", "message": "Invalid GUID format"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetCalcFiles @OrderLinkGUID=%s", [str(order_guid)])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        files = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            
            f_guid = row_dict.get("File_GUID")
            f_name = row_dict.get("File_FileName")
            f_type = row_dict.get("File_DataType_Name") or "Файл"
            f_date = row_dict.get("File_Date")

            # 1. ОБРОБКА ВІДСУТНЬОЇ НАЗВИ
            if not f_name:
                short_id = str(f_guid)[:8] if f_guid else "unknown"
                f_name = f"{f_type.replace(' ', '_')}_{short_id}"

            # 2. ВІРТУАЛЬНЕ РОЗШИРЕННЯ ДЛЯ ФРОНТЕНДУ (щоб працювали іконки)
            name_only, ext = os.path.splitext(f_name)
            if not ext:
                if "фото" in f_type.lower():
                    f_name = f"{name_only}.jpg"
                elif "просчет" in f_type.lower() or "заявка" in f_type.lower():
                    f_name = f"{name_only}.zkz"

            files.append({
                "fileGuid": f_guid,
                "fileName": f_name,
                "type": f_type,
                "date": f_date,
            })

        return Response({"status": "success", "files": files}, status=200)

    except Exception as e:
        # logger.error(f"Error in get_calc_files: {e}")
        return Response({"status": "error", "message": "Внутрішня помилка сервера"}, status=500)
    


from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services.manager_service import (
    get_manager_by_contractor,
    get_telegram_id_by_manager,
)
from .services.telegram_service import send_telegram_message, send_telegram_file
from .services.video_processing import maybe_prepare_video_upload

import os

from rest_framework.decorators import api_view
from rest_framework.response import Response

from backend.utils.GuidToBin1C import guid_to_1c_bin

from .models import ChatMessage, ChatMessageAttachment, ChatTelegramMap
from .services.manager_service import (
    get_manager_by_contractor,
    get_telegram_id_by_manager,
)
from .services.telegram_service import (
    send_telegram_message,
    send_telegram_file,
)


def detect_message_type(file_obj):
    if not file_obj:
        return "text"

    content_type = file_obj.content_type or ""

    if content_type.startswith("image/"):
        return "image"

    if content_type.startswith("video/"):
        return "video"

    if content_type.startswith("audio/"):
        return "voice"

    return "file"


def get_file_extension(filename):
    if not filename:
        return None

    ext = os.path.splitext(filename)[1]

    if not ext:
        return None

    return ext.replace(".", "").lower()

@api_view(["POST"])
def send_support_notification_to_telegram(request):
    contractor_id = request.data.get("contractorId")
    text = request.data.get("text") or "Нове повідомлення"
    client_name = request.data.get("clientName") or ""

    file_obj = request.FILES.get("file")
    message_type = request.data.get("messageType") or detect_message_type(file_obj)
    upload_file_obj = file_obj
    video_was_compressed = False

    if file_obj and message_type == "video":
        upload_file_obj, video_was_compressed, _ = maybe_prepare_video_upload(file_obj)

    if not contractor_id:
        return Response({"success": False, "error": "contractorId is required"}, status=400)

    try:
        contractor_bin = guid_to_1c_bin(contractor_id)
    except Exception as e:
        return Response({"success": False, "error": f"Invalid contractorId: {e}"}, status=400)

    manager_guid = get_manager_by_contractor(contractor_id)

    if not manager_guid:
        return Response({"success": False, "error": "Не знайдено менеджера для контрагента"}, status=404)

    telegram_id = get_telegram_id_by_manager(manager_guid)

    if not telegram_id:
        return Response({"success": False, "error": "Не знайдено Telegram ID менеджера"}, status=404)

    chat_id = f"support_{contractor_id}"

    message = ChatMessage.objects.create(
        chat_id=chat_id,
        text=text,
        author=contractor_bin,      # автор — дилер/контрагент
        recipient=manager_guid,     # отримувач — менеджер
        is_read=False,
        is_sent_vtg=False,
        is_notification=False,
        event_type="support",
        related_object_id=None,
        transaction_type_id=4,
    )

    attachment = None

    if upload_file_obj:
        file_bytes = upload_file_obj.read()
        upload_file_obj.seek(0)

        attachment = ChatMessageAttachment.objects.create(
            MessageId=message,
            AttachmentType=message_type,
            FileName=upload_file_obj.name,
            OriginalFileName=upload_file_obj.name,
            MimeType=upload_file_obj.content_type,
            FileExtension=get_file_extension(upload_file_obj.name),
            FileSize=upload_file_obj.size,
            FileData=file_bytes,
        )

    tg_text = f"""
<b>Нове звернення в підтримку</b>

{text}

Клієнт:
<code>{client_name}</code>

Щоб відповісти дилеру — натисніть Відповісти на це повідомлення.
"""

    fallback_download_url = None

    if attachment:
        from .services.attachment_tokens import build_support_chat_attachment_url

        fallback_download_url = build_support_chat_attachment_url(
            attachment.Id,
            "download_support_chat_attachment",
            request=request,
            absolute=True,
        )

    if upload_file_obj:
        upload_file_obj.seek(0)
        tg_response = send_telegram_file(
            telegram_chat_id=telegram_id,
            file_obj=upload_file_obj,
            caption=tg_text
        )
    else:
        tg_response = send_telegram_message(
            telegram_chat_id=telegram_id,
            text=tg_text
        )

    telegram_chat_id = int(telegram_id)
    telegram_message_id = None
    telegram_sent = bool(isinstance(tg_response, dict) and tg_response.get("ok"))
    telegram_error = None
    is_too_large_video = bool(
        attachment
        and message_type == "video"
        and isinstance(tg_response, dict)
        and (
            tg_response.get("status_code") == 413
            or "too large" in (tg_response.get("error", "").lower())
            or "завеликий" in (tg_response.get("error", "").lower())
        )
    )

    if telegram_sent:
        telegram_message_id = int(tg_response["result"]["message_id"])

        ChatTelegramMap.objects.create(
            MessageId=message,
            ChatId=chat_id,
            TelegramChatId=telegram_chat_id,
            TelegramMessageId=telegram_message_id,
            TelegramReplyToMessageId=None,
            Direction="PortalToTelegram",
        )

        message.is_sent_vtg = True
        message.save(update_fields=["is_sent_vtg"])
    else:
        telegram_error = (
            tg_response.get("description")
            or tg_response.get("error")
            or "Не вдалося надіслати повідомлення в Telegram"
        )

        if fallback_download_url and attachment:
            if is_too_large_video:
                fallback_text = (
                    f"{tg_text}\n\n"
                    f"<b>Відео завелике для надсилання напряму в Telegram.</b>\n"
                    f"Файл: <code>{attachment.OriginalFileName or attachment.FileName or 'file'}</code>\n"
                    f"<a href=\"{fallback_download_url}\">Завантажити відео</a>"
                )
            else:
                fallback_text = (
                    f"{tg_text}\n\n"
                    f"<b>Вкладення не вдалося завантажити напряму в Telegram.</b>\n"
                    f"Файл: <code>{attachment.OriginalFileName or attachment.FileName or 'file'}</code>\n"
                    f"<a href=\"{fallback_download_url}\">Завантажити файл</a>"
                )

            fallback_response = send_telegram_message(
                telegram_chat_id=telegram_id,
                text=fallback_text,
            )

            if isinstance(fallback_response, dict) and fallback_response.get("ok"):
                telegram_sent = True
                telegram_error = None
                telegram_message_id = int(fallback_response["result"]["message_id"])

                ChatTelegramMap.objects.create(
                    MessageId=message,
                    ChatId=chat_id,
                    TelegramChatId=telegram_chat_id,
                    TelegramMessageId=telegram_message_id,
                    TelegramReplyToMessageId=None,
                    Direction="PortalToTelegram",
                )

                message.is_sent_vtg = True
                message.save(update_fields=["is_sent_vtg"])
            else:
                telegram_error = (
                    fallback_response.get("description")
                    or fallback_response.get("error")
                    or telegram_error
                )

    return Response({
        "success": True,
        "chatId": chat_id,
        "messageId": message.id,
        "attachmentId": attachment.Id if attachment else None,
        "telegramId": telegram_chat_id,
        "telegramMessageId": telegram_message_id,
        "telegramSent": telegram_sent,
        "telegramError": telegram_error,
        "videoCompressed": video_was_compressed,
    })




from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

from backend.utils.GuidToBin1C import guid_to_1c_bin
from .models import ChatMessage, ChatTelegramMap


from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
import json

from .models import ChatMessage, ChatTelegramMap, ChatMessageAttachment
from .services.telegram_service import download_telegram_file


SUPPORT_TRANSACTION_TYPE_ID = 4
TELEGRAM_BOT_VIDEO_IMPORT_LIMIT_BYTES = 20 * 1024 * 1024

@csrf_exempt
def telegram_webhook(request):
    api_key = request.headers.get("X-API-KEY")

    if getattr(settings, "INTERNAL_API_KEY", None):
        if api_key != settings.INTERNAL_API_KEY:
            return JsonResponse({"error": "Unauthorized"}, status=401)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    msg = data.get("message")
    if not msg:
        return JsonResponse({"ok": True})

    telegram_chat_id = int(msg["chat"]["id"])
    telegram_message_id = int(msg["message_id"])

    reply = msg.get("reply_to_message")
    if not reply:
        return JsonResponse({"ok": True, "ignored": "not a reply"})

    reply_to_message_id = int(reply["message_id"])

    tg_map = ChatTelegramMap.objects.select_related("MessageId").filter(
        TelegramChatId=telegram_chat_id,
        TelegramMessageId=reply_to_message_id
    ).first()

    if not tg_map:
        return JsonResponse({
            "ok": True,
            "ignored": "reply source message not found"
        })

    original_message = tg_map.MessageId

    text = msg.get("text") or msg.get("caption") or ""

    manager_message = ChatMessage.objects.create(
        chat_id=tg_map.ChatId,
        text=text,
        author=original_message.recipient,     # автор — менеджер
        recipient=original_message.author,     # отримувач — дилер/контрагент
        is_read=False,
        is_sent_vtg=True,
        is_notification=False,
        event_type="support_reply",
        related_object_id=None,
        transaction_type_id=SUPPORT_TRANSACTION_TYPE_ID,
    )

    attachment = None
    telegram_attachment = extract_telegram_attachment(msg)

    def send_large_video_upload_prompt(file_name):
        note_prefix = f"{text}\n\n" if text else ""
        manager_message.text = f"{note_prefix}{SUPPORT_LARGE_VIDEO_UPLOAD_NOTE}"
        manager_message.save(update_fields=["text"])

        _, signed_upload_token = create_large_video_upload_token(
            message=manager_message,
            original_file_name=file_name,
            telegram_chat_id=telegram_chat_id,
            telegram_message_id=telegram_message_id,
        )
        upload_portal_url = build_large_video_upload_portal_url(signed_upload_token)
        reply_markup = {
            "inline_keyboard": [[
                {
                    "text": "Завантажити відео в портал",
                    "url": upload_portal_url,
                }
            ]]
        }

        return send_telegram_message(
            telegram_chat_id=telegram_chat_id,
            text=(
                "Відео завелике для автоматичного імпорту в портал.\n\n"
                "Натисніть кнопку нижче та завантажте його через портал.\n\n"
                "Посилання для завантаження дійсне протягом 2 годин."
            ),
            reply_markup=reply_markup
        )

    if telegram_attachment:
        if (
            telegram_attachment["type"] == "video"
            and (telegram_attachment.get("file_size") or 0) > TELEGRAM_BOT_VIDEO_IMPORT_LIMIT_BYTES
        ):
            send_large_video_upload_prompt(telegram_attachment["file_name"])
        else:
            downloaded = download_telegram_file(telegram_attachment["file_id"])

            file_name = telegram_attachment["file_name"]
            mime_type = telegram_attachment["mime_type"]
            downloaded_bytes = downloaded.get("bytes") if isinstance(downloaded, dict) else None

            if downloaded_bytes:
                attachment = ChatMessageAttachment.objects.create(
                    MessageId=manager_message,
                    AttachmentType=telegram_attachment["type"],
                    FileName=file_name,
                    OriginalFileName=file_name,
                    MimeType=mime_type,
                    FileExtension=get_extension_from_name(file_name),
                    FileSize=telegram_attachment.get("file_size") or downloaded.get("file_size"),
                    FileData=downloaded_bytes,
                    DurationSeconds=telegram_attachment.get("duration"),
                )
            elif telegram_attachment["type"] == "video":
                send_large_video_upload_prompt(file_name)

    ChatTelegramMap.objects.create(
        MessageId=manager_message,
        ChatId=tg_map.ChatId,
        TelegramChatId=telegram_chat_id,
        TelegramMessageId=telegram_message_id,
        TelegramReplyToMessageId=reply_to_message_id,
        Direction="TelegramToPortal",
    )

    return JsonResponse({
        "ok": True,
        "messageId": manager_message.id,
        "attachmentId": attachment.Id if attachment else None,
        "chatId": tg_map.ChatId,
    })

import os
import mimetypes

TELEGRAM_VIDEO_DOCUMENT_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm", "m4v"}


def get_extension_from_name(filename):
    if not filename:
        return None

    ext = os.path.splitext(filename)[1]
    if not ext:
        return None

    return ext.replace(".", "").lower()


def extract_telegram_attachment(msg):
    """
    Повертає:
    {
        "type": "image/video/voice/audio/file",
        "file_id": "...",
        "file_name": "...",
        "mime_type": "...",
        "file_size": 123
    }
    або None
    """

    if msg.get("photo"):
        photo = msg["photo"][-1]

        return {
            "type": "image",
            "file_id": photo["file_id"],
            "file_name": f"telegram_photo_{photo['file_unique_id']}.jpg",
            "mime_type": "image/jpeg",
            "file_size": photo.get("file_size"),
        }

    if msg.get("video"):
        video = msg["video"]

        return {
            "type": "video",
            "file_id": video["file_id"],
            "file_name": video.get("file_name") or f"telegram_video_{video['file_unique_id']}.mp4",
            "mime_type": video.get("mime_type") or "video/mp4",
            "file_size": video.get("file_size"),
        }

    if msg.get("animation"):
        animation = msg["animation"]

        return {
            "type": "video",
            "file_id": animation["file_id"],
            "file_name": animation.get("file_name") or f"telegram_animation_{animation['file_unique_id']}.mp4",
            "mime_type": animation.get("mime_type") or "video/mp4",
            "file_size": animation.get("file_size"),
            "duration": animation.get("duration"),
        }

    if msg.get("voice"):
        voice = msg["voice"]

        return {
            "type": "voice",
            "file_id": voice["file_id"],
            "file_name": f"telegram_voice_{voice['file_unique_id']}.ogg",
            "mime_type": voice.get("mime_type") or "audio/ogg",
            "file_size": voice.get("file_size"),
            "duration": voice.get("duration"),
        }

    if msg.get("audio"):
        audio = msg["audio"]

        return {
            "type": "audio",
            "file_id": audio["file_id"],
            "file_name": audio.get("file_name") or f"telegram_audio_{audio['file_unique_id']}.mp3",
            "mime_type": audio.get("mime_type") or "audio/mpeg",
            "file_size": audio.get("file_size"),
            "duration": audio.get("duration"),
        }

    if msg.get("document"):
        document = msg["document"]
        document_name = document.get("file_name") or f"telegram_file_{document['file_unique_id']}"
        document_mime_type = (
            document.get("mime_type")
            or mimetypes.guess_type(document_name)[0]
            or "application/octet-stream"
        )
        document_extension = get_extension_from_name(document_name)
        attachment_type = "file"

        if (
            document_mime_type.startswith("video/")
            or document_extension in TELEGRAM_VIDEO_DOCUMENT_EXTENSIONS
        ):
            attachment_type = "video"

        return {
            "type": attachment_type,
            "file_id": document["file_id"],
            "file_name": document_name,
            "mime_type": document_mime_type,
            "file_size": document.get("file_size"),
        }

    return None




from django.http import FileResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from io import BytesIO

from .models import ChatMessage, ChatMessageAttachment
from .services.attachment_tokens import (
    build_support_chat_attachment_url,
    validate_support_chat_attachment_token,
)
from .models import ChatLargeVideoUploadToken
from .services.large_video_upload_tokens import (
    build_large_video_upload_portal_url,
    create_large_video_upload_token,
    mark_large_video_upload_token_used,
    validate_large_video_upload_signed_token,
)
from django.utils import timezone
from datetime import timedelta


SUPPORT_TRANSACTION_TYPE_ID = 4
SUPPORT_VIDEO_RETENTION_HOURS = 24
SUPPORT_LARGE_VIDEO_UPLOAD_NOTE = (
    "Відео завелике для автоматичного імпорту в портал. "
    "Менеджер має завантажити його через портал."
)


def is_support_video_attachment_available(attachment):
    if attachment.AttachmentType != "video":
        return True

    token_record = (
        ChatLargeVideoUploadToken.objects
        .filter(uploaded_attachment_id=attachment.Id, is_used=True)
        .only("id")
        .first()
    )
    if not token_record:
        return True

    created_at = getattr(attachment, "CreatedAt", None)
    if not created_at:
        return True

    return created_at >= timezone.now() - timedelta(hours=SUPPORT_VIDEO_RETENTION_HOURS)


def get_support_video_attachment_expiry(attachment):
    created_at = getattr(attachment, "CreatedAt", None)
    if attachment.AttachmentType != "video" or not created_at:
        return None

    token_record = (
        ChatLargeVideoUploadToken.objects
        .filter(uploaded_attachment_id=attachment.Id, is_used=True)
        .only("id")
        .first()
    )
    if not token_record:
        return None

    return created_at + timedelta(hours=SUPPORT_VIDEO_RETENTION_HOURS)


def serialize_chat_message(message, target_language="uk", translated_cache=None, request=None):
    attachments = []

    for a in message.attachments.all():
        is_available = is_support_video_attachment_available(a)
        expires_at = get_support_video_attachment_expiry(a)

        attachments.append({
            "id": a.Id,
            "type": a.AttachmentType,  # image/video/voice/audio/file
            "fileName": a.FileName,
            "originalFileName": a.OriginalFileName,
            "mimeType": a.MimeType,
            "fileExtension": a.FileExtension,
            "fileSize": a.FileSize,
            "durationSeconds": a.DurationSeconds,
            "url": build_support_chat_attachment_url(
                a.Id,
                "get_support_chat_attachment",
                request=request,
            ) if is_available else None,
            "downloadUrl": build_support_chat_attachment_url(
                a.Id,
                "download_support_chat_attachment",
                request=request,
            ) if is_available else None,
            "isAvailable": is_available,
            "availableUntil": expires_at.isoformat() if expires_at else None,
        })

    original_text = message.text or ""

    return {
        "id": message.id,
        "chatId": message.chat_id,
        "timestamp": message.timestamp,
        "text": original_text,
        "original_text": original_text,
        "message_language": "uk",
        "display_language": normalize_portal_language(target_language, fallback="uk"),
        "is_auto_translated": False,
        "isRead": message.is_read,
        "eventType": message.event_type,
        "direction": "outgoing" if message.event_type == "support" else "incoming",
        "attachments": attachments,
    }


@api_view(["GET"])
def get_support_chat_history(request):
    contractor_id = request.GET.get("contractorId")
    requested_language = get_requested_portal_language(request, fallback="uk")

    if not contractor_id:
        return Response({
            "success": False,
            "error": "contractorId is required"
        }, status=400)

    chat_id = f"support_{contractor_id}"

    messages = (
        ChatMessage.objects
        .filter(
            chat_id=chat_id,
            transaction_type_id=SUPPORT_TRANSACTION_TYPE_ID
        )
        .prefetch_related("attachments")
        .order_by("timestamp")
    )

    return Response({
        "success": True,
        "chatId": chat_id,
        "messages": [serialize_chat_message(m, requested_language, request=request) for m in messages],
    })


def build_large_video_upload_error_payload(status_code):
    if status_code == "used":
        return {"success": False, "error": "Посилання вже використано.", "code": "used"}
    if status_code == "expired":
        return {"success": False, "error": "Термін дії посилання закінчився.", "code": "expired"}
    if status_code == "mismatch":
        return {"success": False, "error": "Недійсне посилання.", "code": "invalid"}
    if status_code == "missing":
        return {"success": False, "error": "Недійсне посилання.", "code": "invalid"}

    return {"success": False, "error": "Недійсне посилання.", "code": "invalid"}


def _can_access_support_chat_attachment(request, attachment_id):
    if bool(getattr(getattr(request, "user", None), "is_authenticated", False)):
        return True, None, None

    token = request.GET.get("token")
    if not token:
        return False, "missing", "Attachment token is required"

    is_valid, reason = validate_support_chat_attachment_token(attachment_id, token)
    if is_valid:
        return True, None, None

    if reason == "expired":
        return False, "expired", "Attachment token has expired"

    return False, "invalid", "Attachment token is invalid"


@api_view(["GET"])
def get_support_chat_attachment(request, attachment_id):
    has_access, error_code, error_message = _can_access_support_chat_attachment(
        request,
        attachment_id,
    )
    if not has_access:
        return Response(
            {"success": False, "error": error_message},
            status=410 if error_code == "expired" else 403,
        )

    try:
        attachment = ChatMessageAttachment.objects.get(Id=attachment_id)
    except ChatMessageAttachment.DoesNotExist:
        raise Http404("Attachment not found")

    if not is_support_video_attachment_available(attachment):
        return Response(
            {"success": False, "error": "Відео більше недоступне у чаті."},
            status=410,
        )

    file_bytes = attachment.FileData

    response = FileResponse(
        BytesIO(file_bytes),
        content_type=attachment.MimeType or "application/octet-stream"
    )

    response["Content-Disposition"] = (
        f'inline; filename="{attachment.OriginalFileName or attachment.FileName or "file"}"'
    )

    return response


@api_view(["GET"])
def download_support_chat_attachment(request, attachment_id):
    has_access, error_code, error_message = _can_access_support_chat_attachment(
        request,
        attachment_id,
    )
    if not has_access:
        return Response(
            {"success": False, "error": error_message},
            status=410 if error_code == "expired" else 403,
        )

    try:
        attachment = ChatMessageAttachment.objects.get(Id=attachment_id)
    except ChatMessageAttachment.DoesNotExist:
        raise Http404("Attachment not found")

    if not is_support_video_attachment_available(attachment):
        return Response(
            {"success": False, "error": "Відео більше недоступне у чаті."},
            status=410,
        )

    download_name = attachment.OriginalFileName or attachment.FileName or "file"
    response = FileResponse(
        BytesIO(attachment.FileData),
        as_attachment=True,
        filename=download_name,
        content_type=attachment.MimeType or "application/octet-stream",
    )

    if attachment.FileSize:
        response["Content-Length"] = str(attachment.FileSize)

    response["X-Content-Type-Options"] = "nosniff"
    return response


@api_view(["GET", "POST"])
def support_large_video_upload(request):
    signed_token = request.GET.get("token") or request.data.get("token")
    token_record, status_code = validate_large_video_upload_signed_token(signed_token)

    if status_code != "ok":
        payload = build_large_video_upload_error_payload(status_code)
        http_status = 410 if status_code in {"used", "expired"} else 403
        return Response(payload, status=http_status)

    if request.method == "GET":
        return Response({
            "success": True,
            "chatId": token_record.chat_id,
            "messageId": token_record.message_id,
            "originalFileName": token_record.original_file_name,
            "expiresAt": token_record.expires_at,
            "used": token_record.is_used,
        })

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response(
            {"success": False, "error": "Потрібно вибрати відеофайл.", "code": "missing_file"},
            status=400,
        )

    upload_message = token_record.message
    content_type = file_obj.content_type or ""
    file_extension = get_file_extension(file_obj.name) or ""
    is_video = content_type.startswith("video/") or file_extension in TELEGRAM_VIDEO_DOCUMENT_EXTENSIONS

    if not is_video:
        return Response(
            {"success": False, "error": "Дозволено завантажувати лише відео.", "code": "invalid_file_type"},
            status=400,
        )

    prepared_upload, _, _ = maybe_prepare_video_upload(file_obj)
    prepared_upload.seek(0)
    file_bytes = prepared_upload.read()
    prepared_upload.seek(0)

    attachment = ChatMessageAttachment.objects.create(
        MessageId=upload_message,
        AttachmentType="video",
        FileName=prepared_upload.name,
        OriginalFileName=prepared_upload.name,
        MimeType=prepared_upload.content_type or content_type or "video/mp4",
        FileExtension=get_file_extension(prepared_upload.name),
        FileSize=getattr(prepared_upload, "size", len(file_bytes)),
        FileData=file_bytes,
    )

    if SUPPORT_LARGE_VIDEO_UPLOAD_NOTE in (upload_message.text or ""):
        upload_message.text = (upload_message.text or "").replace(
            SUPPORT_LARGE_VIDEO_UPLOAD_NOTE,
        ).strip()
        upload_message.save(update_fields=["text"])

    mark_large_video_upload_token_used(token_record, attachment.Id)

    return Response({
        "success": True,
        "message": "Відео успішно завантажено.",
        "attachmentId": attachment.Id,
        "messageId": upload_message.id,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_support_chat_as_read(request):
    contractor_id = request.data.get("contractorId") or request.GET.get("contractorId")

    if not contractor_id:
        return Response({
            "success": False,
            "error": "contractorId is required"
        }, status=400)

    chat_id = f"support_{contractor_id}"

    updated_count = ChatMessage.objects.filter(
        chat_id=chat_id,
        transaction_type_id=SUPPORT_TRANSACTION_TYPE_ID,
        is_read=False
    ).exclude(
        event_type="support"
    ).update(is_read=True)

    return Response({
        "success": True,
        "chatId": chat_id,
        "updatedCount": updated_count,
    })
