
import json
# import logging
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

from django.shortcuts import render


from django.http import JsonResponse
from backend.maintenance_mode import build_maintenance_payload, get_maintenance_state


# logger = logging.getLogger(__name__)
from backend.utils.logging_setup import logger


def get_maintenance_json_response():
    if not get_maintenance_state()["enabled"]:
        return None
    return JsonResponse(build_maintenance_payload(), status=503)



@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_additional_order_nomenclature(request):
    maintenance_response = get_maintenance_json_response()
    if maintenance_response is not None:
        return maintenance_response
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

        # logger.info(f"Successfully fetched {len(results)} nomenclature items")

        return Response({"nomenclature": results})

    except Exception as e:
        logger.error("Error in get_additional_order_nomenclature", exc_info=True, extra={
                    'tags': {
                        'action': 'get_additional_order_nomenclature'
                    
                    }
                })
        # Важливо: тут не має бути ніяких "from .views import..."
        return Response({"error": str(e)}, status=500)
    





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

    maintenance_response = get_maintenance_json_response()
    if maintenance_response is not None:
        return maintenance_response

    try:
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

    except Exception as e:
        logger.error(f"Error checking order exists for {order_number}", exc_info=True, extra={
                    'tags': {
                        'action': 'check_order_exists'
                    
                    }
                })
        return JsonResponse({"error": "Database query failed"}, status=500)




@extend_schema(
    summary="Отримати довідник причин дозамовлення",
    description=(
       
    ),

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_issue_add_order(request):
    maintenance_response = get_maintenance_json_response()
    if maintenance_response is not None:
        return maintenance_response
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
        logger.error("Error in get_issue_add_order", exc_info=True, extra={
                    'tags': {
                        'action': 'check_order_exists'
                    
                    }
                })
        return Response({"error": "Failed to fetch issues"}, status=500)


import json
import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.onec_api import send_to_1c

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_default_delivery_address(request):
    """Resolve the default delivery address for an additional order."""
    user = request.user
    role = (getattr(user, "role", "") or "").lower()
    requested_contractor = str(request.query_params.get("contractor_guid") or "").strip()
    is_backoffice = role in ("admin", "manager", "region_manager")

    try:
        contractor_guid = requested_contractor if is_backoffice and requested_contractor else bin_to_guid_1c(getattr(user, "user_id_1C", None))
        if not contractor_guid:
            return Response({"error": "Contractor is required"}, status=400)

        order_number = str(request.query_params.get("order_number") or "").strip()
        with connection.cursor() as cursor:
            if order_number:
                cursor.execute("EXEC dbo.GetOrderDeliveryAddress2 @OrderNumber = %s", [order_number])
            else:
                cursor.execute("EXEC dbo.GetDealerAddresses @ContractorLink = %s", [guid_to_1c_bin(contractor_guid)])
            columns = [column[0] for column in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        if not rows:
            return Response({"address": "", "source": "order" if order_number else "dealer"})

        def get_address(row):
            for key in ("AddressValue", "Address", "DeliveryAddress", "Name", "Description"):
                value = row.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
            return ""

        if order_number:
            row = rows[0]
            address = next(
                (value for key, value in row.items() if value and key.lower() in {"address", "addressvalue", "deliveryaddress", "orderaddress", "orderdeliveryaddress"}),
                get_address(row),
            )
            return Response({"address": str(address or ""), "source": "order"})

        def is_main_warehouse(row):
            details = " ".join(str(value or "") for value in row.values()).lower()
            return any(marker in details for marker in ("\u043e\u0441\u043d\u043e\u0432", "\u0433\u043e\u043b\u043e\u0432\u043d", "\u0441\u043a\u043b\u0430\u0434", "main", "warehouse"))

        selected = next((row for row in rows if is_main_warehouse(row) and get_address(row)), None)
        selected = selected or next((row for row in rows if get_address(row)), {})
        return Response({"address": get_address(selected), "source": "dealer"})
    except Exception:
        logger.exception("Unable to resolve additional order delivery address")
        return Response({"error": "Unable to get delivery address"}, status=500)


class AdditionalOrderViewSet(viewsets.ViewSet):
    """
    ViewSet для роботи з Дозамовленнями.
    Приймає дані з фронту, збагачує їх GUID-ами та відправляє в 1С.
    """
    permission_classes = [IsAuthenticated] 

    def create(self, request):
        maintenance_response = get_maintenance_json_response()
        if maintenance_response is not None:
            return maintenance_response
        user = request.user
        payload = {}
        try:
            user = request.user
            

            role = getattr(user, "role", "").lower()
            is_admin = role in ("admin", "manager", "region_manager")

   
            if is_admin:
    
                contractor_guid = request.data.get("contractor_guid")
                if not contractor_guid:
                    logger.warning(f"Admin {user.id} attempted create without contractor_guid", extra={
                    'tags': {
                        'action': 'AdditionalOrderViewSet (create)'
                    
                    }
                })
                    raise ValueError("contractor_guid is required for admin role")
            else:

                contractor_guid = bin_to_guid_1c(getattr(user, "user_id_1C", None))
                if not contractor_guid:
                    logger.error(f"User {user.id} has no user_id_1C in profile", extra={
                        'tags': {
                            'action': 'AdditionalOrderViewSet (create)'
                        
                        }
                    })
                    raise ValueError("contractor_guid not found for this user")


            author_guid = bin_to_guid_1c(getattr(user, "user_id_1C", None))
            if not author_guid:

                logger.warning(f"author_guid not found for this user {user.id}", extra={
                    'tags': {
                        'action': 'AdditionalOrderViewSet (create)'
                    
                    }
                })
                raise ValueError("author_guid not found for this user")

            payload = {
                "kontragentGUID": contractor_guid,
                # "authorGUID": author_guid,
                "orderNumber": request.data.get("orderNumber"),     
                "orderDeliveryAddress": request.data.get("order_delivery_address") or "",
                # "noOrder": bool(request.data.get("noOrder", False)), 
                "nomenclatureLink": request.data.get("nomenclatureLink"), 
                "nomenclatureQuantity": request.data.get("quantity") ,
                "comment": request.data.get("comment", ""),               
            }

            
            result = send_to_1c("CreateAdditionalOrder", payload)

            reclamation_guid = None
            if isinstance(result.get("results"), list) and len(result["results"]) > 0:
           
                reclamation_guid = result["results"][0].get("ReclamationGUID")

            contractor_bin = guid_to_1c_bin(contractor_guid)
  
            if reclamation_guid:
                try:
                    reclamation_bin = guid_to_1c_bin(str(reclamation_guid))
                    
         
                    main_manager_bin = get_contractor_main_manager_bin(contractor_bin)
                    
      
                    final_recipient = main_manager_bin if main_manager_bin else contractor_bin

                    comment_text = request.data.get("comment")
                    comment_text = comment_text.strip() if comment_text else None

                    if comment_text:

                        ChatMessage.objects.create(
                            chat_id=f"3_{reclamation_guid}", 
                            related_object_id=reclamation_bin,
                            author=contractor_bin,                      
                            recipient=final_recipient,               
                            text=request.data.get("comment"), 
                            is_read=False,
                            is_sent_vtg=False,
                            is_notification=False,
                            transaction_type_id=3  
                        )
                except Exception as chat_err:
                    logger.error(f"Error creating ChatMessage for reclamation {reclamation_guid}: {str(chat_err)}", extra={
                    'tags': {
                        'action': 'AdditionalOrderViewSet (create)'
                    
                    }
                })

            

            return Response(
                {
                    "success": True,
                    "message": "Дозамовлення успішно створено",
                    "data": result, 
                    # "payload_sent": payload 
                },
                status=status.HTTP_201_CREATED,
            )

        except requests.RequestException as e:
            logger.error(f"1C Connection error during additional order: {str(e)}", exc_info=True, extra={
                    'tags': {
                        'action': 'AdditionalOrderViewSet (create)'
                    
                    }
                })
            return Response(
                {"success": False, "error": f"Помилка зв'язку з 1С: {str(e)}", "payload_sent": payload},
                status=status.HTTP_502_BAD_GATEWAY,
                
            )
        except Exception as e:
            logger.error(f"Unexpected error in AdditionalOrder create: {str(e)}", exc_info=True, extra={
                    'tags': {
                        'action': 'AdditionalOrderViewSet (create)'
                    
                    }
                })
            return Response(
                {"success": False, "error": str(e), "payload_sent": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
