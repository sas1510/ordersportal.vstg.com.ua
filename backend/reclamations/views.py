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
from backend.utils.GuidToBin1C import guid_to_1c_bin


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

from backend.utils.BinToGuid1C import bin_to_guid_1c


@csrf_exempt
def get_issue_complaints(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=405)

    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetComplaintsIssue")
            columns = [col[0] for col in cursor.description]

            results = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))

                # 🔹 Link: BINARY(16) → GUID string
                if isinstance(row_dict.get("Link"), (bytes, bytearray)):
                    row_dict["Link"] = bin_to_guid_1c(row_dict["Link"])

                results.append(row_dict)

        return JsonResponse({"issues": results}, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


@csrf_exempt
def get_gm_solutions(request, reason_id):
    """
    Отримання рішень рекламації по reason_id (GUID).
    GET /api/complaints/solutions/<reason_id>/
    """

    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # 🔹 GUID (string) → BINARY(16)
        owner_bin = guid_to_1c_bin(reason_id)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetComplaintSolutions @Owner=%s",
                [owner_bin]
            )
            columns = [col[0] for col in cursor.description]

            results = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))

                # 🔹 Link: BINARY(16) → GUID
                if isinstance(row_dict.get("Link"), (bytes, bytearray)):
                    row_dict["Link"] = bin_to_guid_1c(row_dict["Link"])

                results.append(row_dict)

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

import json
import base64
import requests

from rest_framework import viewsets, status
from rest_framework.response import Response

from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


class ReclamationViewSet(viewsets.ViewSet):
    """
    Приймає JSON з фронту
    Відправляє JSON у 1C
    Отримує JSON з 1C
    """

    # --------------------------------------------------
    # 🔒 Формування payload для 1C (JSON ONLY)
    # --------------------------------------------------
    def _generate_reclamation_json(self, request, main_data):
        # ---------- SERIES ----------
        series_list = request.data.get("series", [])
        if isinstance(series_list, str):
            series_list = json.loads(series_list)

        prepared_series = [
            {
                "serieLink": s.get("serie_link"),   # GUID string
                "serieName": s.get("serie_name")
            }
            for s in series_list
        ]

        # ---------- PHOTOS ----------
        photos_list = request.data.get("photos", [])
        if isinstance(photos_list, str):
            photos_list = json.loads(photos_list)

        prepared_photos = [
            {
                "fileName": p.get("photo_name"),
                "photoDataB64": p.get("photo_base64")
            }
            for p in photos_list
        ]

        return {
            **main_data,
            "series": prepared_series,
            "photos": prepared_photos
        }

    # --------------------------------------------------
    # 🧾 CREATE: створення рекламації
    # --------------------------------------------------
    def create(self, request):
        try:
            # ---------- MAIN DATA ----------
            contractor_guid = request.data.get("contractor_guid")
            if not contractor_guid:
                raise ValueError("contractor_guid is required")

            main_data = {
                # ❗ ВАЖЛИВО: ВСЕ STRING
                "kontragentGUID": contractor_guid,
                "complaintDate": request.data.get("complaint_date"),
                "orderNumber": request.data.get("order_number"),
                "orderDeliverDate": request.data.get("order_deliver_date"),
                "orderDefineDate": request.data.get("order_define_date"),
                "description": request.data.get("description"),
                "urgent": bool(request.data.get("urgent", False)),

                "issue": request.data.get("issue"),
                "solution": request.data.get("solution"),
            }

            payload = self._generate_reclamation_json(request, main_data)

            # 🔥 ВІДПРАВКА В 1C
            result = self._send_to_1c(payload)

            reclamation_guid = result.get("reclamationGuid")
            if not reclamation_guid:
                raise ValueError("1C не повернула reclamationGuid")

            return Response(
                {
                    "success": True,
                    "reclamationGuid": reclamation_guid  # GUID string
                },
                status=status.HTTP_201_CREATED
            )

        except requests.RequestException as e:
            return Response(
                {
                    "success": False,
                    "error": f"Помилка звʼязку з 1C: {str(e)}"
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    # --------------------------------------------------
    # 🔁 Відправка у 1С (JSON → JSON)
    # --------------------------------------------------
    def _send_to_1c(self, payload):
        """
        ❗ payload МІСТИТЬ ТІЛЬКИ JSON-СУМІСНІ ТИПИ
        """

        response = requests.post(
            "https://1c-endpoint/reclamations",
            json=payload,          # ❗ ТІЛЬКИ JSON
            timeout=20
        )

        response.raise_for_status()
        return response.json()
