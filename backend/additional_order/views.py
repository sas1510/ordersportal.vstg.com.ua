
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


# logger = logging.getLogger(__name__)
from backend.utils.logging_setup import logger



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

class AdditionalOrderViewSet(viewsets.ViewSet):
    """
    ViewSet для роботи з Дозамовленнями.
    Приймає дані з фронту, збагачує їх GUID-ами та відправляє в 1С.
    """
    permission_classes = [IsAuthenticated] 

    def create(self, request):
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