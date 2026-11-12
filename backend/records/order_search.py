"""Locate exact document numbers across dates, within the caller's contractor scope."""
import re
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils.contractor import get_accessible_dealer_binaries
from utils.BinToGuid1C import bin_to_guid_1c


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_search_targets(request):
    role = str(getattr(request.user, "role", "")).strip().lower()
    staff = {"admin", "director", "manager", "region_manager", "branch_manager", "branches_director"}
    if role not in staff | {"customer", "dealer", "internal_dealer"}:
        return Response({"error": "Немає доступу до замовлень."}, status=403)
    number = str(request.GET.get("number", "")).strip().removeprefix("№").strip()
    if not re.fullmatch(r"[\wА-Яа-яІіЇїЄєҐґ-]{3,40}", number):
        return Response({"error": "Введіть повний номер замовлення або прорахунку."}, status=400)
    allowed = None
    if role in {"manager", "region_manager", "branch_manager", "branches_director"}:
        allowed = get_accessible_dealer_binaries(request.user)
    elif role not in {"admin", "director"}:
        guid = getattr(request.user, "user_id_1C", None)
        allowed = {bytes(guid)} if guid else set()
    if allowed == set():
        return Response({"targets": []})
    variants = list(dict.fromkeys([number, number.zfill(9) if number.isdigit() else number]))
    if re.fullmatch(r"\d{7,10}", number):
        variants.append(number[:2] + "-" + number[2:])
    placeholders = ",".join(["%s"] * len(variants))
    query = f"""
      WITH Targets AS (
        SELECT A._Fld44859RRef AS Dealer, A._Date_Time AS DocumentDate
        FROM [oknastyle].[dbo].[_Document44856] A
        WHERE A._Marked=0x00 AND A._Number IN ({placeholders})
        UNION
        SELECT COALESCE(A._Fld44859RRef,B.Контрагент), Z._Date_Time
        FROM [oknastyle].[dbo].[_Document381] Z
        JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] B ON B.Ссылка=Z._IDRRef
        LEFT JOIN [oknastyle].[dbo].[_Document44856_VT44863] L ON L._Fld44865RRef=Z._IDRRef
        LEFT JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=L._Document44856_IDRRef AND A._Marked=0x00
        WHERE Z._Marked=0x00 AND Z._Posted=0x01 AND Z._Number IN ({placeholders})
        UNION
        SELECT A._Fld44859RRef, A._Date_Time
        FROM [oknastyle].[dbo].[_Document381] Z
        JOIN [oknastyle].[dbo].[_Document44856_VT44863] L ON L._Fld44865RRef=Z._IDRRef
        JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=L._Document44856_IDRRef
        WHERE Z._Marked=0x00 AND Z._Posted=0x01 AND A._Marked=0x00 AND Z._Number IN ({placeholders})
        UNION
        SELECT A._Fld44859RRef, A._Date_Time
        FROM [oknastyle].[dbo].[_Document381] Z
        JOIN [oknastyle].[dbo].[_Document44856] A ON A._IDRRef=Z._Fld6205_RRRef
          AND Z._Fld6205_TYPE=0x08 AND Z._Fld6205_RTRef=0x0000AF38
        WHERE Z._Marked=0x00 AND Z._Posted=0x01 AND A._Marked=0x00 AND Z._Number IN ({placeholders})
      )
      SELECT DISTINCT TOP (101) Dealer,
        CAST(CASE WHEN YEAR(DocumentDate)>=3753 THEN DATEADD(year,-2000,DocumentDate) ELSE DocumentDate END AS date)
      FROM Targets
    """
    # Restrict in SQL so inaccessible matches cannot crowd out accessible documents.
    params = variants * 4
    if allowed is not None:
        query += " WHERE Dealer IN (" + ",".join(["%s"] * len(allowed)) + ")"
        params += sorted(allowed)
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        targets = cursor.fetchall()
    if len(targets) > 100:
        return Response({"error": "Забагато збігів. Введіть точніший номер."}, status=400)
    return Response({"targets": [
        {"contractor_guid": str(bin_to_guid_1c(bytes(dealer))), "date": day.isoformat()}
        for dealer, day in targets if dealer and day
    ]})

