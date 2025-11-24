# Create your views here.
import xml.etree.ElementTree as ET
import base64
import json
from rest_framework import viewsets, status
from rest_framework.response import Response


class AdditionalViewSet(viewsets.ViewSet):
    
    # --- ПРИВАТНИЙ МЕТОД ГЕНЕРАЦІЇ XML ---
    def _generate_reorder_xml(self, request, main_data):
        """Формує XML-документ для дозамовлення."""
        
        root = ET.Element("ReclamationMessage")
        main_node = ET.SubElement(root, "ReorderItem")
        
        # Додаємо основні дані
        for key, value in main_data.items():
            # Запобігаємо додаванню порожніх вузлів, якщо значення None
            if value is not None:
                ET.SubElement(main_node, key).text = str(value)
            
        # Якщо потрібно додати порожні теги для схеми (наприклад, Series/Photos):
        # ET.SubElement(main_node, "Series")
        # ET.SubElement(main_node, "Photos")
            
        return ET.tostring(root, encoding='utf8', method='xml').decode()

    # --- МЕТОД CREATE: СТВОРЕННЯ ТА ІМІТАЦІЯ ПРИЙНЯТТЯ ---
    def create(self, request):
        try:
            user = request.user
            kontragent = getattr(user, "user_id_1C", None)

            # 1. ПАРСИНГ ДАНИХ
            
            main_data = {
                "KontragentID": str(kontragent) if kontragent else 'UNKNOWN',
                "OrderNumber": request.data.get("orderNumber"),
                "IsNoOrder": request.data.get("noOrder", False),
                
                # НОВІ ТЕКСТОВІ ПОЛЯ
                "ItemNameText": request.data.get("itemNameText"),
                "ReasonText": request.data.get("reasonText"),
                
                # ВИДАЛЕНО: "ImpostValue": request.data.get("impost"),
                "ReorderDescription": request.data.get("comment"),
                
                # Поля, які надсилаються порожніми, але можуть бути потрібні у схемі 1С
                "IssueB64": request.data.get("issue", ""),
                "SolutionB64": request.data.get("solution", ""),
            }

            # 2. ГЕНЕРАЦІЯ XML
            soap_payload = self._generate_reorder_xml(request, main_data)
            
            # 3. ПОВЕРНЕННЯ ВІДПОВІДІ ПРО ПРИЙНЯТТЯ
            
            return Response({
                "success": True,
                "message": "Дані дозамовлення успішно прийняті для подальшої асинхронної обробки (XML-імітація).",
                "status_code": status.HTTP_202_ACCEPTED,
                "mock_xml_length": len(soap_payload) 
            }, status=status.HTTP_202_ACCEPTED) 
            
        except Exception as e:
            return Response({
                "error": f"Помилка вхідних даних або обробки: {str(e)}",
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)
        


from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.db import connection

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
