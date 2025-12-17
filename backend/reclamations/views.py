from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import binascii
import json
from rest_framework import viewsets
# from .serializers import ComplaintSerializer
# from .serializers import ComplaintPhotoSerializer
import base64
from io import BytesIO
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.response import Response
import uuid
from django.db.models import Max
import os
import uuid
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from rest_framework.decorators import api_view
from backend.utils.BinToGuid1C import bin_to_guid_1c


@csrf_exempt
def get_issue_complaints(request):
    if request.method == "GET":
        try:
            with connection.cursor() as cursor:
                cursor.execute("EXEC dbo.GetComplaintsIssue")
                columns = [col[0] for col in cursor.description]
                results = []
                for row in cursor.fetchall():
                    row_dict = dict(zip(columns, row))
                    # Кодуємо Link у base64 якщо це bytes
                    if isinstance(row_dict.get("Link"), bytes):
                        row_dict["Link"] = base64.b64encode(row_dict["Link"]).decode()
                    results.append(row_dict)

            return JsonResponse({"issues": results}, safe=False)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "GET method required"}, status=405)


@csrf_exempt
def get_gm_solutions(request, reason_id):
    """
    API для отримання рішень рекламації по reason_id (base64-encoded Link/GUID).
    Очікує GET-запит на /api/complaints/solutions/<reason_id>/
    Повертає JSON зі списком рішень.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # Декодуємо base64 в bytes
        owner_bytes = base64.b64decode(reason_id)

        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC dbo.GetComplaintSolutions @Owner=%s
            """, [owner_bytes])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Якщо хочеш, можна знову закодувати Link у base64 перед відправкою фронту
        for r in results:
            if isinstance(r.get("Link"), bytes):
                r["Link"] = base64.b64encode(r["Link"]).decode()

        return JsonResponse({"solutions": results}, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




@api_view(['GET'])
def get_complaint_series_by_order(request, order_number):
    try:
        user = request.user
        role = (getattr(user, "role", "") or "").lower()
        manager_roles = ["manager", "region_manager", "admin"]
        is_manager_or_admin = role in manager_roles

        # Для клієнта беремо його ID
        if not is_manager_or_admin:
            kontragent = getattr(user, "user_id_1C", None)
            if not kontragent:
                return Response({"error": "Контрагент не знайдено для користувача"}, status=400)
        else:
            # Якщо менеджер або адмін, можна брати @order_number без обмежень
            kontragent = None  # або передавати як null у процедуру

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetComplaintSeriesByOrder @OrderNumber=%s, @Контрагент=%s",
                [order_number, kontragent]
            )

            columns = [col[0] for col in cursor.description]
            results = []

            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                series_link = row_dict.get("SeriesLink")
                if series_link:
                    row_dict["SeriesLink"] = bin_to_guid_1c(series_link)
                results.append(row_dict)

        return Response({"series": results if results else None})
    except Exception as e:
        return Response({"error": str(e)}, status=500)



import xml.etree.ElementTree as ET
import base64
import json
from io import BytesIO
from PIL import Image
import requests # Необхідно встановити: pip install requests
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.conf import settings # Для налаштування URL
# ... (Інші необхідні імпорти)

# Припустимо, що у вашому settings.py є наступний рядок:
# SOAP_ENDPOINT_URL = 'http://external-system/soap/reclamations' 

import xml.etree.ElementTree as ET
import base64
import json
from io import BytesIO
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.response import Response
# requests більше не потрібен у режимі імітації

# ... (Інші необхідні імпорти)


class ReclamationViewSet(viewsets.ViewSet):
    
    # --- ПРИВАТНИЙ МЕТОД ГЕНЕРАЦІЇ XML ---
    def _generate_reclamation_xml(self, request, main_data):
        """Формує повний XML-документ для відправки."""
        
        root = ET.Element("ReclamationMessage")
        main_node = ET.SubElement(root, "Reclamation")
        
        # Додаємо основні дані
        for key, value in main_data.items():
            ET.SubElement(main_node, key).text = str(value)
            
        # Додаємо серії
        series_node = ET.SubElement(main_node, "Series")
        series_list = request.data.get("series", "[]")
        if isinstance(series_list, str):
            series_list = json.loads(series_list)
        
        for i, serie in enumerate(series_list):
            serie_node = ET.SubElement(series_node, "Serie", id=str(i + 1))
            ET.SubElement(serie_node, "SerieLinkB64").text = serie.get("serie_link")
            ET.SubElement(serie_node, "SerieName").text = serie.get("serie_name")

        # Додаємо фотографії
        photos_node = ET.SubElement(main_node, "Photos")
        photos = request.FILES.getlist("photos")
        
        for i, photo_file in enumerate(photos):
            photo_bytes = photo_file.read()
            
            # Генерація мініатюри
            image = Image.open(BytesIO(photo_bytes))
            image.thumbnail((128, 128))
            thumb_io = BytesIO()
            # Зберігаємо у PNG (або JPEG, якщо вам потрібен менший розмір)
            image.save(thumb_io, format='PNG') 
            photo_ico_bytes = thumb_io.getvalue()
            
            # Кодування Base64 для XML
            photo_b64 = base64.b64encode(photo_bytes).decode('utf-8')
            thumb_b64 = base64.b64encode(photo_ico_bytes).decode('utf-8')
            
            photo_node = ET.SubElement(photos_node, "Photo", id=str(i + 1))
            ET.SubElement(photo_node, "FileName").text = photo_file.name
            ET.SubElement(photo_node, "FileSize").text = str(len(photo_bytes))
            ET.SubElement(photo_node, "PhotoDataB64").text = photo_b64
            ET.SubElement(photo_node, "ThumbnailDataB64").text = thumb_b64
            
        return ET.tostring(root, encoding='utf8', method='xml').decode()

    # --- МЕТОД CREATE: СТВОРЕННЯ ТА ІМІТАЦІЯ ---
    def create(self, request):
        try:
            user = request.user
            kontragent = getattr(user, "user_id_1C", None)

            # 1. ПАРСИНГ ДАНИХ
            issue_b64 = request.data.get("issue")
            solution_b64 = request.data.get("solution")
            
            main_data = {
                "KontragentID": str(kontragent) if kontragent else 'UNKNOWN',
                "ComplaintDate": request.data.get("complaint_date"),
                "OrderNumber": request.data.get("order_number"),
                "Description": request.data.get("description"),
                "Urgent": request.data.get("urgent", False),
                "IssueB64": issue_b64,
                "SolutionB64": solution_b64,
            }

            # 2. ГЕНЕРАЦІЯ XML
            soap_payload = self._generate_reclamation_xml(request, main_data)
            
            # --- 3. ПОВЕРНЕННЯ ВІДПОВІДІ ПРО ПРИЙНЯТТЯ ---
            
            # Якщо код дійшов сюди, це означає, що всі вхідні дані були успішно
            # спарсені, декодовані та перетворені на коректний XML.
            # Повідомляємо фронтенду про УСПІШНЕ ПРИЙНЯТТЯ.
            
            return Response({
                "success": True,
                "message": "Дані рекламації успішно прийняті для подальшої асинхронної обробки.",
                "status_code": status.HTTP_202_ACCEPTED,
                "mock_xml_length": len(soap_payload) # Додаємо довжину XML для перевірки
            }, status=status.HTTP_202_ACCEPTED) 
            
        except Exception as e:
            # Обробляємо помилки, пов'язані з невірним форматом даних
            return Response({
                "error": f"Помилка вхідних даних або обробки: {str(e)}",
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)