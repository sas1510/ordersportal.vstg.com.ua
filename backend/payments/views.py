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

from datetime import date
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.db import connection
from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_payment_status_view(request):

    # 🔹 визначаємо тип доступу
    is_1c = request.auth == "1C_API_KEY"
    user = request.user

    # 🔹 contractor з query
    contractor_guid = request.GET.get("contractor")
    if not contractor_guid:
        return JsonResponse(
            {"error": "Parameter 'contractor' (GUID) is required"},
            status=400
        )

    try:
        contractor_binary = guid_to_1c_bin(contractor_guid)
    except Exception as e:
        return JsonResponse(
            {"error": f"Invalid GUID format: {e}"},
            status=400
        )

    # 🔐 JWT логіка
    if not is_1c:
        role = (getattr(user, "role", "") or "").lower()

        if role != "admin":
            # дилер → тільки свій контрагент
            user_contractor = getattr(user, "user_id_1C", None)

            if not user_contractor:
                return JsonResponse(
                    {"error": "User has no contractor assigned"},
                    status=403
                )

            if contractor_binary != user_contractor:
                return JsonResponse(
                    {"error": "Access denied for this contractor"},
                    status=403
                )

    # 🔑 API key (1C) → без обмежень

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

        # 🔧 JSON safe
        def convert_bytes(value):
            if isinstance(value, (bytes, bytearray)):
                return value.hex().upper()
            return value

        results = [
            {k: convert_bytes(v) for k, v in row.items()}
            for row in results
        ]

        return JsonResponse(
            results,
            safe=False,
            json_dumps_params={"ensure_ascii": False}
        )


    except Exception as e:
        return JsonResponse(
            {"error": f"SQL execution error: {e}"},
            status=500
        )


from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import date


from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.db import connection
from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def get_dealer_payment_page_data_view(request):

    # 🔹 визначаємо тип доступу
    is_1c = request.auth == "1C_API_KEY"
    user = request.user

    # 🔹 contractor з query
    guid_str = request.GET.get("contractor")
    if not guid_str:
        return JsonResponse(
            {"error": "Parameter 'contractor' (GUID) is required"},
            status=400
        )

    try:
        contractor_binary = guid_to_1c_bin(guid_str)
    except Exception as e:
        return JsonResponse(
            {"error": f"Invalid GUID format: {e}"},
            status=400
        )

    # 🔐 JWT логіка
    if not is_1c:
        role = (getattr(user, "role", "") or "").lower()

        if role != "admin":
            user_contractor = getattr(user, "user_id_1C", None)

            if not user_contractor:
                return JsonResponse(
                    {"error": "User has no contractor assigned"},
                    status=403
                )

            if contractor_binary != user_contractor:
                return JsonResponse(
                    {"error": "Access denied for this contractor"},
                    status=403
                )

    # 🔑 API key (1C) → без обмежень
    # 👑 Admin → без обмежень

    sql = """
        EXEC dbo.GetDealerPaymentPageData
            @Contractor = %s
    """

    try:
        with connection.cursor() as cursor:

            # -------- FIRST RESULTSET (orders)
            cursor.execute(sql, [contractor_binary])
            columns1 = [col[0] for col in cursor.description]
            orders = [
                dict(zip(columns1, row))
                for row in cursor.fetchall()
            ]

            # -------- SECOND RESULTSET (contracts)
            contracts = []
            if cursor.nextset():
                columns2 = [col[0] for col in cursor.description]
                contracts = [
                    dict(zip(columns2, row))
                    for row in cursor.fetchall()
                ]

        # 🔧 bytes → hex
        def fix(v):
            return v.hex().upper() if isinstance(v, (bytes, bytearray)) else v

        orders = [{k: fix(v) for k, v in r.items()} for r in orders]
        contracts = [{k: fix(v) for k, v in r.items()} for r in contracts]

        return JsonResponse({
            "orders": orders,
            "contracts": contracts
        },
        json_dumps_params={"ensure_ascii": False  },
        safe=False)

    except Exception as e:
        return JsonResponse(
            {"error": f"SQL execution error: {e}"},
            status=500
        )




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



from openpyxl import Workbook
from openpyxl.styles import Font
from django.http import HttpResponse
from datetime import date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import connection

from backend.utils.GuidToBin1C import guid_to_1c_bin


# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_payment_status_excel(request):

#     guid_str = request.GET.get("contractor")
#     if not guid_str:
#         return HttpResponse("contractor is required", status=400)

#     try:
#         contractor_binary = guid_to_1c_bin(guid_str)
#     except Exception as e:
#         return HttpResponse(f"Invalid GUID: {e}", status=400)

#     date_from = request.GET.get("date_from", "1900-01-01")
#     date_to = request.GET.get("date_to", str(date.today()))

#     sql = """
#         EXEC dbo.GetDealerFullLedger
#             @Контрагент = %s,
#             @ДатаЗ = %s,
#             @ДатаПо = %s
#     """

#     with connection.cursor() as cursor:
#         cursor.execute(sql, [contractor_binary, date_from, date_to])
#         columns = [col[0] for col in cursor.description]
#         rows = cursor.fetchall()

#     # ================== CREATE EXCEL ==================

#     wb = Workbook()
#     ws = wb.active
#     ws.title = "Payment Status"

#     headers = [
#         "Дата",
#         "Час",
#         "Договір",
#         "Канал",
#         "Залишок на початок",
#         "Прихід",
#         "Розхід",
#         "Залишок на кінець",
#         "№ замовлення",
#         "Сума замовлення",
#         "Оплата",
#         "Залишок по замовленню",
#         "Статус оплати"
#     ]

#     ws.append(headers)
#     for cell in ws[1]:
#         cell.font = Font(bold=True)

#     for row in rows:
#         r = dict(zip(columns, row))

#         period = r.get("Период")

#         date_part = period.date().isoformat() if period else ""
#         time_part = period.time().strftime("%H:%M") if period else ""

#         ws.append([
#             date_part,
#             time_part,

#             r.get("FinalDogovorName"),
#             r.get("DealType"),
#             r.get("CumSaldoStart"),

#             # Прихід / Розхід
#             abs(r.get("DeltaRow", 0)) if r.get("InOut") == "Прихід" else "",
#             abs(r.get("DeltaRow", 0)) if r.get("InOut") == "Витрата" else "",

#             r.get("CumSaldo"),

#             # Замовлення
#             r.get("НомерЗаказа"),
#             r.get("СуммаЗаказа"),
#             abs(r.get("DeltaRow", 0)),
#             r.get("ЗалишокПоЗаказу"),
#             r.get("СтатусОплатиПоЗаказу"),
#         ])


#     # ================== RESPONSE ==================

#     response = HttpResponse(
#         content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
#     )
#     response["Content-Disposition"] = (
#         f'attachment; filename="payment_status_{date_from}_{date_to}.xlsx"'
#     )

#     wb.save(response)
#     return response

from rest_framework.decorators import api_view, permission_classes
from django.http import HttpResponse
from django.db import connection
from openpyxl import Workbook

from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def export_payment_status_excel(request):

    # 🔹 визначаємо тип доступу
    is_1c = request.auth == "1C_API_KEY"
    user = request.user

    # ---------- PARAMS ----------
    guid_str = request.GET.get("contractor")
    if not guid_str:
        return HttpResponse("contractor is required", status=400)

    try:
        contractor_binary = guid_to_1c_bin(guid_str)
    except Exception:
        return HttpResponse("Invalid contractor GUID", status=400)

    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")

    # ---------- 🔐 ACCESS CONTROL ----------
    if not is_1c:
        role = (getattr(user, "role", "") or "").lower()

        if role != "admin":
            user_contractor = getattr(user, "user_id_1C", None)

            if not user_contractor:
                return HttpResponse(
                    "User has no contractor assigned",
                    status=403
                )

            if contractor_binary != user_contractor:
                return HttpResponse(
                    "Access denied for this contractor",
                    status=403
                )

    # ---------- 📊 EXCEL ----------
    wb = Workbook(write_only=True)
    ws = wb.create_sheet("Payment Status")

    ws.append([
        "Дата", "Час", "Договір", "Канал",
        "Зал. поч.", "Прихід", "Розхід",
        "Зал. кін.", "№ зам.", "Сума зам.",
        "Оплата", "Зал. зам.", "Статус"
    ])

    with connection.cursor() as cursor:
        cursor.execute("""
            EXEC dbo.GetDealerFullLedger
              @Контрагент = %s,
              @ДатаЗ = %s,
              @ДатаПо = %s
        """, [contractor_binary, date_from, date_to])

        cols = [c[0] for c in cursor.description]
        idx = {c: i for i, c in enumerate(cols)}

        while True:
            rows = cursor.fetchmany(2000)
            if not rows:
                break

            for r in rows:
                period = r[idx["Период"]]
                delta = r[idx["DeltaRow"]] or 0
                inout = r[idx["InOut"]]

                ws.append([
                    period.date().isoformat() if period else "",
                    period.time().strftime("%H:%M") if period else "",
                    r[idx["FinalDogovorName"]],
                    r[idx["DealType"]],
                    r[idx["CumSaldoStart"]],
                    abs(delta) if inout == "Прихід" else "",
                    abs(delta) if inout == "Витрата" else "",
                    r[idx["CumSaldo"]],
                    r[idx["НомерЗаказа"]],
                    r[idx["СуммаЗаказа"]],
                    abs(delta),
                    r[idx["ЗалишокПоЗаказу"]],
                    r[idx["СтатусОплатиПоЗаказу"]],
                ])

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = (
        f'attachment; filename="payment_status_{date_from}_{date_to}.xlsx"'
    )

    wb.save(response)
    return response



from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row
from backend.utils.GuidToBin1C import guid_to_1c_bin_2
from django.db import connection





def dealer_bills_add_info(contractor_guid: str):
    contractor_bin = guid_to_1c_bin_2(contractor_guid)

    with connection.cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetDealerBillsAdd %s",
            [contractor_bin]
        )

        # ---------- 1️⃣ Contractor ----------
        row = cursor.fetchone()
        contractor = (
            convert_row(
                dict(zip([c[0] for c in cursor.description], row))
            )
            if row else None
        )

        # ---------- 2️⃣ Addresses ----------
        cursor.nextset()
        addresses = [
            convert_row(dict(zip([c[0] for c in cursor.description], r)))
            for r in cursor.fetchall()
        ]

        # ---------- 3️⃣ Accounts ----------
        cursor.nextset()
        accounts = [
            convert_row(dict(zip([c[0] for c in cursor.description], r)))
            for r in cursor.fetchall()
        ]

        # ---------- 4️⃣ Nomenclature ----------
        cursor.nextset()
        nomenclature = [
            dict(zip([c[0] for c in cursor.description], r))
            for r in cursor.fetchall()
        ]

    return {
        "contractor": contractor,
        "addresses": addresses,
        "accounts": accounts,
        "nomenclature": nomenclature,
    }


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin_2


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def dealer_bills_add_info_view(request, contractor_guid):
    # 🔹 хто звертається
    is_1c = request.auth == "1C_API_KEY"
    user = request.user

    try:
        contractor_bin = guid_to_1c_bin_2(contractor_guid)
    except Exception:
        raise ValidationError("Invalid contractor GUID")

    # ---------- 🔐 ACCESS CONTROL ----------
    if not is_1c:
        role = (getattr(user, "role", "") or "").lower()

        if role != "admin":
            user_contractor = getattr(user, "user_id_1C", None)

            if not user_contractor:
                return Response(
                    {"detail": "User has no contractor assigned"},
                    status=403
                )

            if contractor_bin != user_contractor:
                return Response(
                    {"detail": "Access denied for this contractor"},
                    status=403
                )

    # ---------- 🧾 DATA ----------
    try:
        data = dealer_bills_add_info(contractor_guid)
    except ValueError:
        raise ValidationError("Invalid GUID format")

    return Response(data)





from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from backend.utils.GuidToBin1C import guid_to_1c_bin_2
from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import connection

from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.GuidToBin1C import guid_to_1c_bin_2


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def customer_bills_view(request, contractor_guid):
    """
    GET /api/dealers/<uuid:contractor_guid>/bills/
    ?date_from=2024-01-01
    &date_to=2024-12-31
    """

    # 🔹 хто звертається
    is_1c = request.auth == "1C_API_KEY"
    user = request.user

    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    try:
        contractor_bin = guid_to_1c_bin_2(contractor_guid)
    except Exception:
        raise ValidationError("Invalid contractor GUID")

    # ---------- 🔐 ACCESS CONTROL ----------
    if not is_1c:
        role = (getattr(user, "role", "") or "").lower()

        if role != "admin":
            user_contractor = getattr(user, "user_id_1C", None)

            if not user_contractor:
                return Response(
                    {"detail": "User has no contractor assigned"},
                    status=403
                )

            if contractor_bin != user_contractor:
                return Response(
                    {"detail": "Access denied for this contractor"},
                    status=403
                )

    # ---------- 🧾 DATA ----------
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                EXEC dbo.GetCustomerBillsByContractorAndDates
                    @ContractorBin = %s,
                    @DateFrom = %s,
                    @DateTo = %s
                """,
                [contractor_bin, date_from, date_to],
            )

            columns = [c[0] for c in cursor.description]
            rows = cursor.fetchall()

        data = [
            convert_row(dict(zip(columns, row)))
            for row in rows
        ]

    except Exception as e:
        raise ValidationError(str(e))

    return Response(data)
