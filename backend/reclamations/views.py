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
from rest_framework.decorators import api_view, permission_classes
from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.GuidToBin1C import guid_to_1c_bin



from backend.permissions import  IsAdminJWTOr1CApiKey, IsAuthenticatedOr1CApiKey

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from drf_spectacular.utils import extend_schema, OpenApiTypes, inline_serializer, OpenApiParameter
from backend.utils.BinToGuid1C import bin_to_guid_1c

@extend_schema(
    summary="Отримати довідник причин рекламацій",
    description=(
        "Повертає список **причин рекламацій**.\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetComplaintsIssue**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT (користувач порталу)\n"
        "- або **1C API Key**\n\n"
        "🧾 Поле **Link** повертається як **GUID string** "
        "(конвертація з BINARY(16))."
    ),

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_issue_complaints(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetComplaintsIssue")
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
    


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c

@extend_schema(
    summary="Отримати способів вирішення рекламації",
    description=(
        "Повертає список **вирішень рекламації** для заданої причини.\n\n"
        "📌 **reason_id** — GUID причини рекламації (рядок).\n\n"
        "📦 Дані беруться з SQL-процедури **dbo.GetComplaintSolutions**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT (користувач порталу)\n"
        "- або **1C API Key**\n\n"
        "🧾 Поле **Link** у відповіді повертається як **GUID string** "
        "(конвертація з BINARY(16))."
    ),
    parameters=[
        OpenApiParameter(
            name="reason_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="GUID причини рекламації",
            required=True,
        ),
    ],
    
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
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



@extend_schema(
    summary="Отримати серії рекламації по замовленню",
    description=(
        "Повертає **серії рекламації** для вказаного номера замовлення.\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetComplaintSeriesByOrder**.\n\n"
        "🔐 **Доступ:**\n"
        "- **JWT**:\n"
        "  - *admin * → доступ до будь-якого контрагента\n"
        "  - *customer* → тільки до **свого** контрагента\n"
        "- **1C API Key** → доступ без обмежень\n\n"
        "📎 **contractor (query-параметр)**:\n"
        "- необовʼязковий\n"
        "- GUID контрагента\n"
        "- для JWT customer ігнорується (береться з user.user_id_1C)\n\n"
        "🧾 Поле **SeriesLink** у відповіді повертається як **GUID string** "
        "(конвертація з BINARY(16))."
    ),
    parameters=[
        OpenApiParameter(
            name="order_number",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description="Номер замовлення",
            required=True,
        ),
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            description="GUID контрагента (необовʼязково)",
            required=False,
        ),
    ],

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_complaint_series_by_order(request, order_number):
    try:
        # 🔹 чи це 1C по API key
        is_1c = request.auth == "1C_API_KEY"

        # 🔹 contractor з фронту (GUID)
        contractor_guid = request.GET.get("contractor")
        kontragent = None

        if contractor_guid:
            kontragent = guid_to_1c_bin(contractor_guid)

        if not is_1c:
            # 🔐 JWT користувач
            user = request.user
            role = (getattr(user, "role", "") or "").lower()
            manager_roles = ["manager", "region_manager", "admin"]
            is_manager_or_admin = role in manager_roles

            if not is_manager_or_admin:
                # ❗ клієнт → дозволяємо ТІЛЬКИ свій контрагент
                user_contractor = getattr(user, "user_id_1C", None)

                if not user_contractor:
                    return Response(
                        {"error": "Контрагент не знайдено для користувача"},
                        status=400
                    )

                # якщо фронт передав contractor — перевіряємо
                if kontragent and kontragent != user_contractor:
                    return Response(
                        {"error": "Доступ заборонено до цього контрагента"},
                        status=403
                    )

                kontragent = user_contractor

            # менеджер / адмін → можна будь-якого або None
            # kontragent вже або з query, або None

        # 🔹 1C → kontragent беремо тільки з query (або None)
        # жодних role / user перевірок

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetComplaintSeriesByOrder @OrderNumber=%s, @Контрагент=%s",
                [order_number, kontragent]
            )

            columns = [col[0] for col in cursor.description]
            results = []

            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                if row_dict.get("SeriesLink"):
                    row_dict["SeriesLink"] = bin_to_guid_1c(row_dict["SeriesLink"])
                results.append(row_dict)

        return Response({"series": results or None})

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
