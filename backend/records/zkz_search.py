import re
from datetime import timedelta
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils.contractor import ensure_order_action_access
from utils.BinToGuid1C import bin_to_guid_1c


def number_variants(value):
    value = str(value or "").strip().removeprefix("№").strip()
    if not re.fullmatch(r"\d{2}-?\d{5,8}", value):
        raise ValueError("Введіть повний номер замовлення, наприклад 01-363339.")
    compact = value.replace("-", "")
    return compact[:2] + "-" + compact[2:], compact


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def find_order_for_zkz(request):
    if getattr(request.user, "role", "") not in {"admin", "director", "manager", "region_manager", "branch_manager", "branches_director", "customer", "dealer"}:
        return Response({"error": "Немає доступу до замовлень."}, status=403)
    try:
        formatted, compact = number_variants(request.GET.get("number"))
    except ValueError as exc:
        return Response({"error": str(exc)}, status=400)
    today = timezone.localdate()
    try:
        start = today.replace(year=today.year - 6)
    except ValueError:
        start = today.replace(year=today.year - 6, day=28)
    end = today + timedelta(days=1)
    with connection.cursor() as cursor:
        cursor.execute(r"""
            SELECT TOP (20) D._IDRRef, D._Number
            FROM [WST\WST].[oknastyle].[dbo].[_Document381] D
            WHERE D._Number IN (%s, %s) AND D._Marked=0x00
              AND ((D._Date_Time >= %s AND D._Date_Time < %s)
                OR (D._Date_Time >= %s AND D._Date_Time < %s))
            ORDER BY D._Date_Time DESC
        """, [formatted, compact, start, end, start.replace(year=start.year + 2000), end.replace(year=end.year + 2000)])
        candidates = cursor.fetchall()
    accessible = []
    for binary, number in candidates:
        guid = bin_to_guid_1c(bytes(binary))
        try:
            ensure_order_action_access(request, guid)
        except PermissionError:
            continue
        accessible.append({"idGuid": str(guid), "number": str(number).strip()})
    if not accessible:
        return Response({"error": "Доступного замовлення з цим номером за останні 6 років не знайдено."}, status=404)
    if len(accessible) != 1:
        return Response({"error": "Є кілька доступних замовлень із цим номером. Уточніть замовлення у списку."}, status=409)
    return Response({"order": accessible[0]})
