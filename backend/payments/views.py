from django.shortcuts import render

# Create your views here.
# payments/views.py
from django.db import connection
from django.http import JsonResponse
from datetime import date
from binascii import unhexlify

from django.shortcuts import render

from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated





# /var/www/html/ordersportal.vstg.com.ua/backend/payments/views.py

from datetime import date
from django.http import JsonResponse
from django.db import connection

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# коректний імпорт
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_payment_status_view(request):

    guid_str = request.GET.get("contractor")
    if not guid_str:
        return JsonResponse({"error": "Parameter 'contractor' (GUID) is required"}, status=400)

    try:
        contractor_binary = guid_to_1c_bin(guid_str)
    except Exception as e:
        return JsonResponse({"error": f"Invalid GUID format: {e}"}, status=400)

    date_from = request.GET.get("date_from", "1900-01-01")
    date_to = request.GET.get("date_to", str(date.today()))

    sql = """
        EXEC dbo.GetDealerFullLedger
            @Контрагент = %s,
            @ДатаЗ = %s,
            @ДатаПо = %s
    """

    try:
        results = []
        with connection.cursor() as cursor:
            cursor.execute(sql, [contractor_binary, date_from, date_to])
            columns = [col[0] for col in cursor.description]

            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))

        # ===== FIX JSON serialization =====
        def convert_bytes(obj):
            if isinstance(obj, (bytes, bytearray)):
                return obj.hex().upper()
            return obj

        results = [
            {k: convert_bytes(v) for k, v in row.items()}
            for row in results
        ]

        return JsonResponse(results, safe=False)

    except Exception as e:
        return JsonResponse({"error": f"SQL execution error: {e}"}, status=500)


from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import date


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dealer_payment_page_data_view(request):
    guid_str = request.GET.get("contractor")
    if not guid_str:
        return JsonResponse({"error": "Parameter 'contractor' (GUID) is required"}, status=400)

    try:
        contractor_binary = guid_to_1c_bin(guid_str)
    except Exception as e:
        return JsonResponse({"error": f"Invalid GUID format: {e}"}, status=400)

    # YEAR
    year_str = request.GET.get("year")
    try:
        year = int(year_str) if year_str else None
    except:
        return JsonResponse({"error": "Invalid 'year' parameter"}, status=400)

    sql = """
        EXEC dbo.GetDealerPaymentPageData
            @Contractor = %s
    """

    try:
        with connection.cursor() as cursor:

            # ------------------------
            # FIRST RESULTSET (orders)
            # ------------------------
            cursor.execute(sql, [contractor_binary])
            columns1 = [col[0] for col in cursor.description]
            orders = [
                dict(zip(columns1, row))
                for row in cursor.fetchall()
            ]

            # ------------------------
            # MOVE TO NEXT RESULTSET
            # ------------------------
            contracts = []
            if cursor.nextset():  # <--- ПЕРЕХІД ДО ДРУГОГО SELECT
                columns2 = [col[0] for col in cursor.description]
                contracts = [
                    dict(zip(columns2, row))
                    for row in cursor.fetchall()
                ]

        # convert bytes → hex
        def fix(v):
            return v.hex().upper() if isinstance(v, (bytes, bytearray)) else v

        orders = [{k: fix(v) for k, v in r.items()} for r in orders]
        contracts = [{k: fix(v) for k, v in r.items()} for r in contracts]

        # RETURN BOTH ARRAYS TOGETHER
        return JsonResponse({
            "orders": orders,
            "contracts": contracts
        }, safe=False)

    except Exception as e:
        return JsonResponse({"error": f"SQL execution error: {e}"}, status=500)




from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import uuid



@api_view(["GET"])
def get_dealer_advance_balance(request):
    contractor_guid = request.query_params.get("contractor_guid")

    if not contractor_guid:
        return Response({"error": "contractor_guid is required"}, status=400)

    contractor_bin = guid_to_1c_bin(contractor_guid)
    if contractor_bin is None:
        return Response({"error": "Invalid contractor GUID"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC [dbo].[GetDealerAllAdvancedBalance] @Контрагент = %s
            """, [contractor_bin])

            rows = cursor.fetchall()
            columns = [col[0] for col in cursor.description]

        result = []

        for row in rows:
            row_dict = {}

            for col, val in zip(columns, row):

                # ------------------------------
                # 🔥 Перетворення binary -> GUID
                # ------------------------------
                if isinstance(val, (bytes, bytearray)):
                    row_dict[col] = bin_to_guid_1c(val)
                else:
                    row_dict[col] = val

            result.append(row_dict)

        return Response(result, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
