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
from backend.utils.contractor import resolve_contractor
from backend.utils.api_helpers import safe_view
from backend.utils.dates import parse_date, clean_date
from rest_framework.exceptions import ValidationError



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
            description="GUID контрагента (admin)",
            required=False,
        ),
    ],

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_complaint_series_by_order(request, order_number):
    """
    Повертає серії рекламації по замовленню.
    Безпека:
    - dealer / customer → тільки своє замовлення
    - admin / manager → будь-яке
    - 1C API key → без обмежень (або по contractor)
    """

    user = request.user
    role = (getattr(user, "role", "") or "").lower()
    is_1c = request.auth == "1C_API_KEY"

    contractor_bin = None  # дефолт

    if is_1c:
        contractor_bin = getattr(user, "user_id_1C", None)
        if not contractor_bin:
            raise PermissionError("API key user has no UserId1C")
    elif role in ("dealer", "customer"):
        contractor_bin = getattr(user, "user_id_1C", None)
        if not contractor_bin:
            raise PermissionError("User has no contractor assigned")
    elif role == "admin":
        # admin може передати contractor, але необов'язково
        contractor_guid = request.GET.get("contractor")
        if contractor_guid:
            try:
                contractor_bin = guid_to_1c_bin(contractor_guid)
            except Exception:
                raise ValueError("Invalid contractor GUID")
        # якщо не передано – contractor_bin залишається None → SQL не фільтрує

    # 📦 SQL
    with connection.cursor() as cursor:
        if contractor_bin:
            cursor.execute(
                """
                EXEC dbo.GetComplaintSeriesByOrder
                    @OrderNumber = %s,
                    @Контрагент  = %s
                """,
                [order_number, contractor_bin]
            )
        else:
            # contractor_bin = None → повертаємо всі серії
            cursor.execute(
                """
                EXEC dbo.GetComplaintSeriesByOrder
                    @OrderNumber = %s,
                    @Контрагент  = NULL
                """,
                [order_number]
            )

        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

    # 🎛 FORMAT
    results = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        if row_dict.get("SeriesLink"):
            row_dict["SeriesLink"] = bin_to_guid_1c(row_dict["SeriesLink"])
        results.append(row_dict)

    return Response({
        "series": results or None
    })


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
import uuid

MOCK_1C = True


class ReclamationViewSet(viewsets.ViewSet):
    """
    Приймає JSON з фронту
    Відправляє JSON у 1C
    Отримує JSON з 1C
    """

    permission_classes = [IsAuthenticatedOr1CApiKey]

    # --------------------------------------------------
    # 🔒 Формування payload для 1C
    # --------------------------------------------------
    def _generate_reclamation_json(self, request, main_data):
        # ---------- SERIES ----------
        series_list = request.data.get("series", [])
        if isinstance(series_list, str):
            series_list = json.loads(series_list)

        prepared_series = [
            {
                "serieLink": s.get("serie_link"),
                "serieName": s.get("serie_name"),
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
                "photoDataB64": p.get("photo_base64"),
            }
            for p in photos_list
        ]

        return {
            **main_data,
            "series": prepared_series,
            "photos": prepared_photos,
        }

    # --------------------------------------------------
    # 🧾 CREATE
    # --------------------------------------------------
    def create(self, request):
        try:
            user = request.user

            # 🧠 Визначаємо роль
            role = getattr(user, "role", None)
            role = role.lower() if role else ""

            is_admin = role in ("admin", "manager", "region_manager")

            # --------------------------------------------------
            # 🧩 contractor_guid
            # --------------------------------------------------
            if is_admin:
                contractor_guid = request.data.get("contractor_guid")
                if not contractor_guid:
                    raise ValueError("contractor_guid is required for admin")
            else:
                # ❗ дилер / клієнт — беремо з користувача
                contractor_guid = bin_to_guid_1c(getattr(user, "user_id_1C", None))
                if not contractor_guid:
                    raise ValueError("contractor_guid not found for user")


            # --------------------------------------------------
            # 👤 author_guid — ЗАВЖДИ з користувача
            # --------------------------------------------------
            author_guid = bin_to_guid_1c(
                getattr(user, "user_id_1C", None)
            )
            if not author_guid:
                raise ValueError("author_guid not found for user")

            # --------------------------------------------------
            # 🧾 Основні дані
            # --------------------------------------------------
            main_data = {
                "kontragentGUID": contractor_guid,
                "authorGUID": author_guid, 
                "complaintDate": request.data.get("complaint_date"),
                "orderNumber": request.data.get("order_number"),
                "orderDeliverDate": request.data.get("order_deliver_date"),
                "orderDefineDate": request.data.get("order_define_date"),
                "description": request.data.get("description"),
                # "urgent": bool(request.data.get("urgent", False)),
                "issue": request.data.get("issue"),
                "solution": request.data.get("solution"),
            }

            payload = self._generate_reclamation_json(request, main_data)

            # ==================================================
            # 🧪 MOCK MODE
            # ==================================================
            if MOCK_1C:
                return Response(
                    {
                        "success": True,
                        "payload": payload,   # 🔍 ПОВЕРТАЄМО НА ФРОНТ
                        "mock": True,
                    },
                    status=status.HTTP_201_CREATED,
                )

            # ==================================================
            # 🔥 REAL MODE
            # ==================================================
            result = self._send_to_1c(payload)

            reclamation_guid = result.get("reclamationGuid")
            if not reclamation_guid:
                raise ValueError("1C не повернула reclamationGuid")

            return Response(
                {
                    "success": True,
                    "payload": payload,   # 🔍 теж повертаємо
                    # "reclamationGuid": reclamation_guid,
                },
                status=status.HTTP_201_CREATED,
            )

        except requests.RequestException as e:
            return Response(
                {
                    "success": False,
                    "error": f"Помилка звʼязку з 1C: {str(e)}",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # --------------------------------------------------
    # 🔁 Відправка у 1С
    # --------------------------------------------------
    def _send_to_1c(self, payload: dict) -> dict:
        try:
            auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
            auth_b64 = base64.b64encode(
                auth_raw.encode("utf-8")
            ).decode("ascii")

            response = requests.post(
                settings.ONE_C_URL,
                json=payload,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": f"Basic {auth_b64}",
                    "Query": "CreateReclamation",   # ❗ інший Query
                },
                timeout=30,
                verify=settings.ONE_C_VERIFY_SSL,
            )

            response.raise_for_status()

        except requests.exceptions.RequestException as e:
            raise ValidationError({
                "detail": "Помилка зʼєднання з 1С (Reclamation)",
                "error": str(e),
                "payload_sent_to_1c": payload,
            })

        try:
            return response.json()

        except ValueError:
            raise ValidationError({
                "detail": "1С повернула не JSON (Reclamation)",
                "response_text": response.text,
                "payload_sent_to_1c": payload,
            })



from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import connection

from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c

@extend_schema(
    summary="Отримати файли претензії (БВ)",
    description=(
        "Повертає **всі файли претензії** (фото, відео, pdf).\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetClaimFiles_BV**.\n\n"
        "🔐 Доступ:\n"
        "- JWT\n"
        "- або 1C API Key\n\n"
        "📎 File_GUID та Claim_GUID повертаються як GUID string."
    ),
    parameters=[
        OpenApiParameter(
            name="claim_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            required=True,
            description="GUID претензії (БВ)"
        )
    ]
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_claim_files(request, claim_guid):
    try:
        # 🔹 GUID → BINARY(16)
        claim_link_bin = guid_to_1c_bin(claim_guid)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetClaimFiles_BV @ClaimLink=%s",
                [claim_link_bin]
            )

            columns = [col[0] for col in cursor.description]
            files = []

            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))

                # 🔹 GUID конвертації
                if isinstance(row_dict.get("Claim_GUID"), (bytes, bytearray)):
                    row_dict["Claim_GUID"] = bin_to_guid_1c(row_dict["Claim_GUID"])

                if isinstance(row_dict.get("File_GUID"), (bytes, bytearray)):
                    row_dict["File_GUID"] = bin_to_guid_1c(row_dict["File_GUID"])

                files.append(row_dict)

        return Response({"files": files})

    except Exception as e:
        return Response({"error": str(e)}, status=500)


import mimetypes
import subprocess
import logging
from urllib.parse import unquote

from django.conf import settings
from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view, permission_classes

logger = logging.getLogger(__name__)
import tempfile
from django.http import FileResponse
import mimetypes
import subprocess
import tempfile
from urllib.parse import unquote

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes

from backend.permissions import IsAuthenticatedOr1CApiKey
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from django.http import FileResponse, Http404
import subprocess, tempfile, mimetypes
from urllib.parse import unquote


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from backend.permissions import IsAuthenticatedOr1CApiKey
from .utils import generate_media_token, load_file_from_db, extract_1c_binary


@api_view(["POST"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def generate_media_token_view(request):
    file_guid = request.data.get("file_guid")

    if not file_guid:
        return Response({"error": "file_guid required"}, status=400)

    token = generate_media_token(file_guid, ttl_seconds=180) 

    return Response({"token": token})


import subprocess
import tempfile
import mimetypes
from urllib.parse import unquote
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes

from .utils import verify_media_token

from django.http import FileResponse, Http404, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from urllib.parse import unquote
import tempfile
import subprocess
import mimetypes
import os
from django.shortcuts import redirect
from django.conf import settings
from urllib.parse import unquote, quote
from urllib.parse import unquote, quote
import mimetypes
import tempfile
import subprocess
import os

from django.http import Http404
from django.shortcuts import redirect
from django.db import connection
from rest_framework.decorators import api_view, permission_classes

from ranged_fileresponse import RangedFileResponse


@api_view(["GET"])
@permission_classes([])  # доступ через media-token
def preview_complaint_file(request, claim_guid):
    token = request.GET.get("token")
    filename = request.GET.get("filename")

    if not token or not filename:
        return redirect(settings.FRONTEND_URL + "/file-preview/invalid")

    file_guid = verify_media_token(token)
    if not file_guid:
        return redirect(
            f"{settings.FRONTEND_URL}/file-preview/invalid"
            f"?filename={quote(filename)}"
        )

    filename = unquote(filename)
    content_type, _ = mimetypes.guess_type(filename)
    content_type = content_type or "application/octet-stream"

    # ======================================================
    # 1️⃣ SMB
    # ======================================================
    remote_path = f'Претензия (БВ)/{claim_guid}/{file_guid}/{filename}'
    full_username = f"VSTG\\{settings.SMB_USERNAME}"

    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.close()

    try:
        subprocess.run(
            [
                "smbclient",
                f"//{settings.SMB_SERVER}/{settings.SMB_SHARE}",
                "-U", full_username,
                "-c", f'get "{remote_path}" "{tmp.name}"'
            ],
            env={"PASSWD": settings.SMB_PASSWORD},
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        response = RangedFileResponse(
            request,
            open(tmp.name, "rb"),
            content_type=content_type
        )
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response

    except subprocess.CalledProcessError:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)

    # ======================================================
    # 2️⃣ FALLBACK — 1C DB
    # ======================================================
    try:
        binary_guid = guid_to_1c_bin(file_guid)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC [dbo].[GetBinaryFile] @FileLink = %s",
                [binary_guid]
            )
            row = cursor.fetchone()

            if not row or not row[0]:
                raise Http404("File not found in DB")

            raw_db_blob = row[0]
            db_filename = row[1]

        file_bytes = extract_1c_binary(raw_db_blob)
        if not file_bytes:
            raise Http404("Could not decode file from DB")

        tmp = tempfile.NamedTemporaryFile(delete=False)
        tmp.write(file_bytes)
        tmp.close()

        response = RangedFileResponse(
            request,
            open(tmp.name, "rb"),
            content_type=content_type
        )
        response["Content-Disposition"] = (
            f'inline; filename="{filename or db_filename}"'
        )
        return response

    except Exception:
        raise Http404("File not found")
