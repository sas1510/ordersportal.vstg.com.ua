
import json
import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from backend.permissions import  IsAdminJWTOr1CApiKey, IsAuthenticatedOr1CApiKey
from drf_spectacular.utils import extend_schema

from backend.utils.BinToGuid1C import bin_to_guid_1c
from django.db import connection
from backend.utils.get_main_manager import get_contractor_main_manager_bin
from backend.utils.GuidToBin1C import guid_to_1c_bin, guid_to_1c_bin_2
from records.models import ChatMessage

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_additional_order_nomenclature(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetAdditionalOrderNomenclature")
            columns = [col[0] for col in cursor.description]
            results = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                for key in row_dict:
                    if isinstance(row_dict[key], (bytes, bytearray)):
                        row_dict[key] = bin_to_guid_1c(row_dict[key])
                results.append(row_dict)

        return Response({"nomenclature": results})

    except Exception as e:
        # Важливо: тут не має бути ніяких "from .views import..."
        return Response({"error": str(e)}, status=500)
    


from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse





def check_order_exists(request):
    """
    Перевірка існування замовлення по номеру та необов'язково по контрагенту.
    Параметри GET:
        order_number: str
        contragent: hex string (необов'язково)
    """
    order_number = request.GET.get('order_number')
    contragent_hex = request.GET.get('contragent')  # наприклад: 9CDA4CD98F08E56D11F0C92655C4EC04

    if not order_number:
        return JsonResponse({"error": "order_number is required"}, status=400)

    contragent_bin = None
    if contragent_hex:
        try:
            # конвертуємо hex string у bytes
            contragent_bin = bytes.fromhex(contragent_hex)
        except ValueError:
            return JsonResponse({"error": "Invalid contragent hex format"}, status=400)

    with connection.cursor() as cursor:
        if contragent_bin:
            cursor.execute(
                "EXEC [dbo].[CheckOrderExists] @OrderNumber=%s, @Контрагент=%s",
                [order_number, contragent_bin]
            )
        else:
            cursor.execute(
                "EXEC [dbo].[CheckOrderExists] @OrderNumber=%s",
                [order_number]
            )

        row = cursor.fetchone()
        exists = row[0] if row else 0

    return JsonResponse({"order_exists": bool(exists)})





@extend_schema(
    summary="Отримати довідник причин дозамовлення",
    description=(
       
    ),

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_issue_add_order(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.[GetAdditionalIssue]")
            columns = [col[0] for col in cursor.description]

            results = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))

                # BINARY(16) → GUID
                if isinstance(row_dict.get("Link"), (bytes, bytearray)):
                    row_dict["Link"] = bin_to_guid_1c(row_dict["Link"])

                results.append(row_dict)

        return Response({"issues": results})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

import json
import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.onec_api import send_to_1c

class AdditionalOrderViewSet(viewsets.ViewSet):
    """
    ViewSet для роботи з Дозамовленнями.
    Приймає дані з фронту, збагачує їх GUID-ами та відправляє в 1С.
    """
    permission_classes = [IsAuthenticated] 

    def create(self, request):
        try:
            user = request.user
            

            role = getattr(user, "role", "").lower()
            is_admin = role in ("admin", "manager", "region_manager")

   
            if is_admin:
    
                contractor_guid = request.data.get("contractor_guid")
                if not contractor_guid:
                    raise ValueError("contractor_guid is required for admin role")
            else:

                contractor_guid = bin_to_guid_1c(getattr(user, "user_id_1C", None))
                if not contractor_guid:
                    raise ValueError("contractor_guid not found for this user")


            author_guid = bin_to_guid_1c(getattr(user, "user_id_1C", None))
            if not author_guid:
                raise ValueError("author_guid not found for this user")

            payload = {
                "kontragentGUID": contractor_guid,
                # "authorGUID": author_guid,
                "orderNumber": request.data.get("orderNumber"),      # Номер замовлення
                # "noOrder": bool(request.data.get("noOrder", False)), # Чекбокс "Без замовлення"
                "nomenclatureLink": request.data.get("nomenclatureLink"), # Посилання на елемент
                "nomenclatureQuantity": request.data.get("quantity") ,
                "comment": request.data.get("comment", ""),               # Коментар
            }

            # 5. Відправляємо в 1С через існуючу утиліту send_to_1c
            # Query "CreateAdditionalOrder" має бути підтриманий на стороні 1С
            result = send_to_1c("CreateAdditionalOrder", payload)

            reclamation_guid = None
            if isinstance(result.get("results"), list) and len(result["results"]) > 0:
                # Беремо перший елемент масиву та ключ 'ReclamationGUID'
                reclamation_guid = result["results"][0].get("ReclamationGUID")

            contractor_bin = guid_to_1c_bin(contractor_guid)
            # ---------- СТВОРЕННЯ ПОВІДОМЛЕННЯ В ЧАТ ----------
            if reclamation_guid:
                try:
                    reclamation_bin = guid_to_1c_bin(str(reclamation_guid))
                    
                    # Шукаємо основного менеджера контрагента
                    main_manager_bin = get_contractor_main_manager_bin(contractor_bin)
                    
                    # Якщо менеджера немає, отримувач — сам контрагент (або за замовчуванням)
                    final_recipient = main_manager_bin if main_manager_bin else contractor_bin

                    ChatMessage.objects.create(
                        chat_id=f"3_{reclamation_guid}",  # Формат 2_Guid для рекламацій
                        related_object_id=reclamation_bin,
                        author=contractor_bin,                      
                        recipient=final_recipient,               
                        text=request.data.get("comment"), #or "Створено нову рекламацію",
                        is_read=False,
                        is_sent_vtg=False,
                        is_notification=False,
                        transaction_type_id=3  
                    )
                except Exception as chat_err:
                    logger.error(f"Помилка створення ChatMessage для рекламації {reclamation_guid}: {str(chat_err)}")
            # --------------------------------------------------
            

            return Response(
                {
                    "success": True,
                    "message": "Дозамовлення успішно створено",
                    "data": result, # Відповідь від 1С (наприклад, номер створеного дозамовлення)
                    "payload_sent": payload # Корисно для дебагу
                },
                status=status.HTTP_201_CREATED,
            )

        except requests.RequestException as e:
            return Response(
                {"success": False, "error": f"Помилка зв'язку з 1С: {str(e)}", "payload_sent": payload},
                status=status.HTTP_502_BAD_GATEWAY,
                
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e), "payload_sent": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )