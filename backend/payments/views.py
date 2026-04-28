# from django.shortcuts import render

# # Create your views here.
# # payments/views.py
# from django.db import connection
# from django.http import JsonResponse
# from datetime import date
# from binascii import unhexlify

# from django.shortcuts import render
# from backend.utils.send_to_1c import send_to_1c
# from django.http import JsonResponse
# from django.db import connection
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter, OpenApiRequest, OpenApiResponse, OpenApiTypes

# from rest_framework import serializers

# from backend.utils.contractor import resolve_contractor

# from backend.utils.api_helpers import safe_view
# from backend.utils.dates import parse_date, clean_date
# from backend.utils.send_to_1c import send_to_1c, fetch_file_from_1c

# from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row
# from backend.utils.GuidToBin1C import guid_to_1c_bin_2
# from django.db import connection
# import requests
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status


# from django.db import connection
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework.exceptions import ValidationError

# from backend.utils.GuidToBin1C import guid_to_1c_bin_2
# from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row


# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.response import Response
# from rest_framework.exceptions import ValidationError
# from django.db import connection

# from backend.permissions import IsAuthenticatedOr1CApiKey
# from backend.utils.GuidToBin1C import guid_to_1c_bin_2


# from openpyxl import Workbook
# from openpyxl.styles import Font
# from django.http import HttpResponse
# from datetime import date

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from django.db import connection

# from backend.utils.GuidToBin1C import guid_to_1c_bin

# from rest_framework.decorators import api_view, permission_classes
# from django.http import HttpResponse
# from django.db import connection
# from openpyxl import Workbook

# from backend.permissions import IsAuthenticatedOr1CApiKey
# from backend.utils.GuidToBin1C import guid_to_1c_bin




# # /var/www/html/ordersportal.vstg.com.ua/backend/payments/views.py

# from datetime import date
# from django.http import JsonResponse
# from django.db import connection

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated

# # коректний імпорт
# from backend.utils.GuidToBin1C import guid_to_1c_bin
# from backend.utils.BinToGuid1C import bin_to_guid_1c

# from datetime import date
# from rest_framework.decorators import api_view, permission_classes
# from django.http import JsonResponse
# from django.db import connection
# from backend.permissions import IsAuthenticatedOr1CApiKey
# from backend.utils.GuidToBin1C import guid_to_1c_bin




# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework.exceptions import ValidationError


# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.response import Response
# from rest_framework.exceptions import ValidationError
# from backend.permissions import IsAuthenticatedOr1CApiKey
# from backend.utils.GuidToBin1C import guid_to_1c_bin_2

# from django.http import JsonResponse
# from django.db import connection
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from datetime import date


# from rest_framework.decorators import api_view, permission_classes
# from django.http import JsonResponse
# from django.db import connection
# from backend.permissions import IsAuthenticatedOr1CApiKey
# from backend.utils.GuidToBin1C import guid_to_1c_bin

# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from django.db import connection
# import uuid

# import base64
# from django.http import HttpResponse
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import IsAuthenticated
import uuid
import base64
import requests
from datetime import date
from binascii import unhexlify

from django.db import connection
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from drf_spectacular.utils import (
    extend_schema, inline_serializer, OpenApiParameter, 
    OpenApiRequest, OpenApiResponse, OpenApiTypes
)

from openpyxl import Workbook
from openpyxl.styles import Font

# Внутрішні утиліти проекту
from backend.permissions import IsAuthenticatedOr1CApiKey
from backend.utils.contractor import resolve_contractor
from backend.utils.api_helpers import safe_view
from backend.utils.dates import parse_date, clean_date
from backend.utils.send_to_1c import send_to_1c, fetch_file_from_1c
from backend.utils.BinToGuid1C import bin_to_guid_1c, convert_row
from backend.utils.GuidToBin1C import guid_to_1c_bin, guid_to_1c_bin_2


@extend_schema(
    summary="Отримати фінансовий леджер дилера",
    description=(
        "Повертає повний фінансовий леджер дилера за період.\n\n"
        "🔐 Доступ:\n"
        "- JWT (admin → будь-який дилер, dealer → тільки свій)\n"
        "- 1C API Key → без обмежень\n\n"
        "📌 SQL: dbo.GetDealerFullLedger"
    ),
    tags=["payments"],
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Дата початку періоду (YYYY-MM-DD)",
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Дата кінця періоду (YYYY-MM-DD)",
        ),
    ]
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_payment_status_view(request):
    # -------------------------------------------------
    # 📅 DATES (ОБОВʼЯЗКОВІ)
    # -------------------------------------------------
    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")

    

    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_binary, _ = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    sql = """
        EXEC dbo.GetDealerFullLedger_3
            @Контрагент = %s,
            @ДатаЗ = %s,
            @ДатаПо = %s
    """

    results = []
    with connection.cursor() as cursor:
        cursor.execute(sql, [contractor_binary, date_from, date_to])
        columns = [col[0] for col in cursor.description]

        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))

    # -------------------------------------------------
    # 🔧 bytes → HEX (НЕ міняємо структуру)
    # -------------------------------------------------
    def convert_bytes(value):
        if isinstance(value, (bytes, bytearray, memoryview)):
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



@extend_schema(
    summary="Дані сторінки «Оплата» дилера",
    description="Повертає замовлення та договори дилера для сторінки Оплата.",
    tags=["payments"],
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
    ],
    responses={
        200: inline_serializer(
            name="DealerPaymentPageData",
            fields={
                "orders": serializers.ListField(child=serializers.DictField()),
                "contracts": serializers.ListField(child=serializers.DictField()),
            }
        )
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_dealer_payment_page_data_view(request):
    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_binary, _ = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    sql = """
        EXEC dbo.GetDealerPaymentPageData
            @Contractor = %s
    """

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

    # -------------------------------------------------
    # 🔧 bytes → HEX (НЕ міняємо структуру)
    # -------------------------------------------------
    def fix(v):
        if isinstance(v, (bytes, bytearray, memoryview)):
            return bin_to_guid_1c(v)
        return v

    orders = [{k: fix(v) for k, v in r.items()} for r in orders]
    contracts = [{k: fix(v) for k, v in r.items()} for r in contracts]

    return JsonResponse(
        {
            "orders": orders,
            "contracts": contracts
        },
        json_dumps_params={"ensure_ascii": False},
        safe=False
    )





@extend_schema(
    summary="Авансові залишки дилера",
    description=(
        "Повертає всі авансові баланси дилера.\n\n"
        "Доступ:\n"
        "- admin → може передати contractor_guid\n"
        "- dealer / customer → тільки свій contractor\n"
        "- 1C API KEY → автоматично по UserId1C"
    ),
    tags=["payments"],
    parameters=[
        OpenApiParameter(
            name="contractor_guid",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
    ],
    responses={
        200: serializers.ListSerializer(child=serializers.DictField()),
        400: OpenApiTypes.OBJECT,
        403: OpenApiTypes.OBJECT,
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_dealer_advance_balance(request):
    # -------------------------------------------------
    # 🔐 CONTRACTOR (DRY, ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, _ = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor_guid",
    )

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetDealerAllAdvancedBalance
                @Контрагент = %s
            """,
            [contractor_bin]
        )

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]

    # -------------------------------------------------
    # 🔄 FORMAT (НЕ МІНЯЄМО СТРУКТУРУ)
    # -------------------------------------------------
    result = []

    for row in rows:
        row_dict = {}

        for col, val in zip(columns, row):
            # 🔥 binary(16) → GUID
            if isinstance(val, (bytes, bytearray, memoryview)):
                row_dict[col] = bin_to_guid_1c(bytes(val))
            else:
                row_dict[col] = val

        result.append(row_dict)

    return Response(result, status=200)


@extend_schema(
    summary="Експорт статусу оплат в Excel",
    description=(
        "Генерує XLSX-файл з фінансовим леджером дилера.\n\n"
        "### Доступ:\n"
        "- **Admin** — може передати `contractor`\n"
        "- **Dealer / Customer** — тільки власний contractor\n"
        "- **1C API KEY** — автоматично по UserId1C\n\n"
        "### Обовʼязкові параметри:\n"
        "- date_from, date_to"
    ),
    tags=["payments"],
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Початкова дата (YYYY-MM-DD)",
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Кінцева дата (YYYY-MM-DD)",
        ),
    ],
    responses={
        200: OpenApiTypes.BINARY,
        400: OpenApiTypes.OBJECT,
        403: OpenApiTypes.OBJECT,
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def export_payment_status_excel(request):
    # -------------------------------------------------
    # 📅 DATES (ОБОВʼЯЗКОВІ)
    # -------------------------------------------------
    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")

    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, contractor_guid = resolve_contractor(request)

    # -------------------------------------------------
    # 📊 EXCEL
    # -------------------------------------------------
    wb = Workbook(write_only=True)
    ws = wb.create_sheet("Payment Status")

    ws.append([
        "Дата", "Час", "Договір", "Канал",
        "Зал. поч.", "Прихід", "Розхід",
        "Зал. кін.", "№ зам.", "Сума зам.",
        "Оплата", "Зал. зам.", "Статус"
    ])

    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetDealerFullLedger_3
              @Контрагент = %s,
              @ДатаЗ = %s,
              @ДатаПо = %s
            """,
            [contractor_bin, date_from, date_to]
        )

        cols = [c[0] for c in cursor.description]
        idx = {c: i for i, c in enumerate(cols)}

        while True:
            rows = cursor.fetchmany(2000)
            if not rows:
                break

            for r in rows:
                period = r[idx["Date"]]
                delta = r[idx["DeltaRow"]] or 0
                inout = r[idx["FlowDirection"]]

                ws.append([
                    period.date().isoformat() if period else "",
                    period.time().strftime("%H:%M") if period else "",
                    r[idx["FinalDogovorName"]],
                    r[idx["DealType"]],
                    r[idx["CumSaldoStart"]],
                    abs(delta) if inout == "Прихід" else "",
                    abs(delta) if inout == "Витрата" else "",
                    r[idx["CumSaldo"]],
                    r[idx["OrderNumber"]],
                    r[idx["OrderAmount"]],
                    abs(delta),
                    r[idx["OrderBalance"]],
                    r[idx["PaymentStatus"]],
                ])

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = (
        f'attachment; filename="payment_status_{date_from}_{date_to}.xlsx"'
    )

    wb.save(response)
    return response




@extend_schema(
    summary="Додаткова інформація для рахунків дилера",
    description="Контрагент, адреси, рахунки, номенклатура.",
    tags=["payments"],
    parameters=[
        OpenApiParameter("contractor_guid", OpenApiTypes.UUID, OpenApiParameter.PATH),
    ],
    responses={
        200: inline_serializer(
            name="DealerBillsAddInfo",
            fields={
                "contractor": serializers.DictField(),
                "addresses": serializers.ListField(child=serializers.DictField()),
                "accounts": serializers.ListField(child=serializers.DictField()),
                "nomenclature": serializers.ListField(child=serializers.DictField()),
            }
        )
    }
)
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




@extend_schema(
    summary="Додаткова інформація для рахунків дилера",
    description=(
        "Повертає додаткову інформацію, необхідну для створення або "
        "відображення рахунків дилера.\n\n"

        "### Доступ:\n"
        "- **Admin** — може передати `contractor`\n"
        "- **Dealer / Customer** — тільки власний contractor\n"
        "- **1C API KEY** — автоматично по UserId1C\n\n"

        "### Авторизація:\n"
        "- JWT або 1C API KEY"
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
    ],
    tags=["payments"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def dealer_bills_add_info_view(request):
    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, contractor_guid = resolve_contractor(request)

    # -------------------------------------------------
    # 📦 DATA
    # -------------------------------------------------
    data = dealer_bills_add_info(contractor_guid)

    return Response({
        # "contractor": contractor_guid,
        "data": data
    })




@extend_schema(
    summary="Рахунки клієнта (дилера) за період",
    description="""
Універсальний endpoint для отримання рахунків.

### Логіка доступу:
- **Admin (JWT)** — ОБОВʼЯЗКОВО передає `contractor` у query
- **Dealer / Customer (JWT)** — `contractor` ІГНОРУЄТЬСЯ, береться з токена
- **1C API Key** — автоматично по `UserId1C`

### Параметри:
- `contractor` — GUID контрагента (**тільки для admin**)
- `date_from` — YYYY-MM-DD
- `date_to` — YYYY-MM-DD
""",
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (обовʼязковий ТІЛЬКИ для admin)",
        ),
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def customer_bills_view(request):
    # -------------------------------------------------
    # 📅 DATES
    # -------------------------------------------------
    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")

    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, contractor_guid = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetCustomerBillsByContractorAndDates
                @ContractorBin = %s,
                @DateFrom = %s,
                @DateTo = %s
            """,
            [contractor_bin, date_from, date_to]
        )

        columns = [c[0] for c in cursor.description]
        rows = cursor.fetchall()

    data = [
        convert_row(dict(zip(columns, row)))
        for row in rows
    ]

    return Response({
        "contractor": contractor_guid,
        "count": len(data),
        "items": data
    })



import binascii

def get_contractor_guid_from_db(user):
    if not user.user_id_1C:
        return None

    # binary → hex string
    return bin_to_guid_1c(user.user_id_1C)



@api_view(["POST"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def create_invoice(request):
    user = request.user
    data = request.data

    contractor_guid = get_contractor_guid_from_db(user)

    if not contractor_guid:
        return Response(
            {"error": "User has no 1C contractor GUID"},
            status=400
        )

    payload_1c = {
        "contragentGUID": contractor_guid,
        "addressGUID": data.get("AddressGUID"),
        "ibanGUID": data.get("IbanGUID"),
        "createDate": data.get("OrderCreateDate"),
        "deliveryDate": data.get("OrderDeliveryDate"),
        "paymentDate": data.get("OrderPaymentDate"),
        "comment": data.get("InternalComment", ""),
        "totalSum": data.get("OrderSuma"),
        "items": [
            {
                "itemID": i.get("ItemGUID"),
                "count": i.get("Count"),
                "price": i.get("Price"),
                "width": i.get("Width"),
                "height": i.get("Height"),
            }
            for i in data.get("OrderItemsLIST", [])
        ],
    }

    result = send_to_1c(
        payload=payload_1c,
        query="CreateBill",
    )

    return Response({"status": "ok", "data": result}, status=201)






@api_view(["POST"])
@permission_classes([IsAuthenticated])
def make_payment_from_advance(request):
    data = request.data

    amount = data.get("amount")
    contract = data.get("contract")
    order_id = data.get("order_id")

    if not amount or not contract or not order_id:
        return Response(
            {
                "error": "Поля amount, contract, order_id є обовʼязковими"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload_1c = {
        "amount": amount,
        "contract": contract,
        "order_id": order_id,
    }


    response_1c = send_to_1c(
        payload=payload_1c,
        query="PaymentForOrders",
        # url НЕ передаємо — візьметься settings.ONE_C_URL
        # method="POST" — за замовчуванням
    )

    results = response_1c.get("results", []) if isinstance(response_1c, dict) else []
    
    # 2. Шукаємо хоча б один неуспішний результат
    # Якщо список порожній або хоча б один елемент має success: false
    if not results or any(not item.get("success", False) for item in results):
        return Response(
            {
                "success": False,
                "error": "1С відхилила запит або повернула помилку",
                "details_from_1c": response_1c
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # 3. Якщо все добре
    return Response(
        {
            "success": True,
            "sent_to_1c": payload_1c,
            "response_1c": response_1c,
        },
        status=status.HTTP_200_OK,
    )





class GetBillPDF(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, bill_guid):
        # 1. Перевірка доступу (resolve_contractor)
        try:
            _, _ = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            return Response({"detail": str(e)}, status=400)

        if not bill_guid or bill_guid == "undefined":
            return Response({"detail": "BillGuid не передано"}, status=400)

        # 2. Отримання сирого b64 через нову функцію
        try:
            pdf_b64 = fetch_file_from_1c(
                payload={"BillGuid": str(bill_guid)},
                query="CustomerBillPdf"
            )
        except ValidationError as e:
            return Response(e.detail, status=400)

        if not pdf_b64:
            return Response({"detail": "1С повернула порожній файл"}, status=404)

        # 3. Формування PDF відповіді
        try:
            pdf_binary = base64.b64decode(pdf_b64)
            
            response = HttpResponse(pdf_binary, content_type='application/pdf')
            # Використовуємо BillGuid для назви файлу
            filename = f"Bill_{bill_guid[:8]}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response

        except Exception as e:
            return Response(
                {"detail": f"Помилка обробки файлу: {str(e)}"},
                status=500
            )



from django.db import connection, DatabaseError
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers

@extend_schema(
    summary="Повні дані взаєморозрахунків партнера",
    description="Повертає замовлення, авансові договори та детальну таблицю дебіторської заборгованості.",
    tags=["payments"],
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=serializers.UUIDField,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin)",
        ),
    ],
    responses={
        200: inline_serializer(
            name="PartnerFullDataResponse",
            fields={
                "orders": serializers.ListField(child=serializers.DictField()),
                "contracts": serializers.ListField(child=serializers.DictField()),
                "debts": serializers.DictField(),
            }
        )
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated]) # Або IsAuthenticatedOr1CApiKey
@safe_view # Ваш кастомний декоратор для логування помилок
def get_partner_full_data_view(request):
    # 1. Отримуємо бінарний ID контрагента
    try:
        contractor_binary, contractor_guid = resolve_contractor(
            request,
            allow_admin=True,
            admin_param="contractor",
        )
    except (ValueError, PermissionError) as e:
        return JsonResponse({"detail": str(e)}, status=400)

    # Функція для конвертації бінарних даних 1С (UUID) у HEX-рядок
    def fix_value(v):
        if isinstance(v, (bytes, bytearray, memoryview)):
            return v.hex().upper()
        return v

    def get_dict_list(cursor):
        if cursor.description:
            columns = [col[0] for col in cursor.description]
            return [{k: fix_value(v) for k, v in dict(zip(columns, row)).items()} 
                    for row in cursor.fetchall()]
        return []

    try:
        with connection.cursor() as cursor:
            # Викликаємо процедуру
            cursor.execute("EXEC dbo.GetPartnerFullData @Contractor = %s", [contractor_binary])

            # --- RESULT 1: Orders (Актуальні замовлення)
            orders = get_dict_list(cursor)

            # --- RESULT 2: Contracts (Авансові договори)
            contracts = []
            if cursor.nextset():
                contracts = get_dict_list(cursor)

            # --- RESULT 3: Debts (Деталізація боргу)
            debt_items = []
            debt_summary = []
            if cursor.nextset():
                raw_debts = get_dict_list(cursor)
                # Розділяємо звичайні рядки та рядки підсумків (SortOrder)
                debt_items = [d for d in raw_debts if d.get('SortOrder') == 0]
                debt_summary = [d for d in raw_debts if d.get('SortOrder') == 1]

    except DatabaseError as e:
        error_msg = str(e)
        if "927" in error_msg or "recovery" in error_msg.lower():
            return JsonResponse({"error": "database_recovery", "detail": "База оновлюється..."}, status=503)
        return JsonResponse({"detail": f"SQL Error: {error_msg}"}, status=500)

    # Формуємо єдину відповідь
    return JsonResponse(
        {
            "contractor_guid": contractor_guid,
            "orders": orders,
            "contracts": contracts,
            "debts": {
                "items": debt_items,
                "summaries": debt_summary # Список підсумків за валютами
            }
        },
        json_dumps_params={"ensure_ascii": False}
    )