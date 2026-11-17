"""Read-only duplicate check against non-deleted calculation applications in the last 168 hours."""
import base64
import ntpath
from datetime import timedelta
from zoneinfo import ZoneInfo
import smbclient
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from backend.utils.contractor import resolve_contractor
from utils.BinToGuid1C import bin_to_guid_1c
from .utils import extract_1c_download_binary


def file_identity(name, size):
    name = str(name or "").strip()
    if ntpath.basename(name) != name or not name.lower().endswith(".zkz"):
        raise ValueError("Потрібен файл .zkz без шляху до папки.")
    if type(size) is not int or size < 0:
        raise ValueError("Некоректний розмір файлу.")
    return name, size


def uploaded_zkz_identity(file):
    name = str(file.get("fileName") or "")
    if not name.lower().endswith(".zkz"):
        return None
    raw = str(file.get("fileDataB64") or "").split(",", 1)[-1]
    try:
        size = len(base64.b64decode(raw, validate=True))
    except (ValueError, base64.binascii.Error) as exc:
        raise ValueError("Некоректний вміст файлу .zkz.") from exc
    return file_identity(name, size)


def stored_file_size(order_guid, file_guid, name):
    try:
        smbclient.register_session(settings.SMB_SERVER, username=settings.SMB_USERNAME, password=settings.SMB_PASSWORD)
        path = f"/{settings.SMB_SERVER}/{settings.SMB_SHARE}/Заявка на просчет (ВМ)/{order_guid}/{file_guid}/{name}"
        return smbclient.stat(path).st_size
    except Exception:
        # SQL may store a compressed 1C value: compare the decoded file size,
        # never the database BLOB length.
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetBinaryFile @FileLink=%s", [file_guid_to_binary(file_guid)])
            row = cursor.fetchone()
        if not row or not row[0]:
            raise ValueError("Розмір попереднього файлу недоступний.")
        return len(extract_1c_download_binary(row[0], filename=name))


def file_guid_to_binary(value):
    from utils.GuidToBin1C import guid_to_1c_bin
    return guid_to_1c_bin(value)


def find_zkz_duplicates(contractor, name, size, now=None):
    name, size = file_identity(name, size)
    now = (now or timezone.now()).astimezone(ZoneInfo("Europe/Kyiv")).replace(tzinfo=None)
    start = now - timedelta(days=7)
    with connection.cursor() as cursor:
        cursor.execute(r"""
          SELECT TOP (201) D._IDRRef, D._Number, D._Date_Time,
                 F._IDRRef, CAST(F._Fld3499 AS NVARCHAR(255))
          FROM [WST\WST].[oknastyle].[dbo].[_Document44856] D
          JOIN [WST\WST].[oknastyle].[dbo].[_Reference252] F
            ON F._Fld3500_TYPE=0x08 AND F._Fld3500_RTRef=0x0000AF38
           AND F._Fld3500_RRRef=D._IDRRef AND F._Marked=0x00
          WHERE D._Fld44859RRef=%s AND D._Marked=0x00
            AND ((D._Date_Time >= %s AND D._Date_Time <= %s)
              OR (D._Date_Time >= %s AND D._Date_Time <= %s))
            AND LOWER(LTRIM(RTRIM(CAST(F._Fld3499 AS NVARCHAR(255)))))=LOWER(%s)
          ORDER BY D._Date_Time DESC
        """, [bytes(contractor), start, now, start.replace(year=start.year+2000), now.replace(year=now.year+2000), name])
        rows = cursor.fetchall()
    if len(rows) > 200:
        raise ValueError("Забагато файлів з однаковою назвою для перевірки.")
    matches, unchecked, seen = [], [], set()
    for order_id, number, order_date, file_id, stored_name in rows:
        order_guid, file_guid = bin_to_guid_1c(bytes(order_id)), bin_to_guid_1c(bytes(file_id))
        if order_date.year >= 4000:
            order_date = order_date.replace(year=order_date.year-2000)
        item = {"number": str(number).strip(), "date": order_date.isoformat(), "idGuid": order_guid}
        try:
            previous_size = stored_file_size(order_guid, file_guid, str(stored_name).strip())
        except Exception:
            unchecked.append(item)
            continue
        if previous_size == size and order_guid not in seen:
            seen.add(order_guid)
            matches.append(item)
    return {"matches": matches, "unchecked": unchecked}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_zkz_duplicates(request):
    try:
        contractor, _ = resolve_contractor(request, admin_param="contractor_guid", elevated_roles=("admin", "manager", "region_manager", "branch_manager", "branches_director"))
        name, size = file_identity(request.data.get("file_name"), request.data.get("file_size"))
    except PermissionError as exc:
        return Response({"error": str(exc)}, status=403)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=400)
    try:
        return Response(find_zkz_duplicates(contractor, name, size))
    except Exception:
        return Response({"error": "Не вдалося перевірити файл серед заявок за 7 днів. Спробуйте ще раз."}, status=503)
