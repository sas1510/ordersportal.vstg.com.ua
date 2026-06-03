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

# import logging
import time

# logger = logging.getLogger(__name__)

from backend.utils.logging_setup import logger


@extend_schema(
    summary="Отримати фінансовий леджер дилера",
    description=(
        "Повертає повний фінансовий леджер дилера за період.\n\n"
        " Доступ:\n"
        "- JWT (admin → будь-який дилер, dealer → тільки свій)\n"
        "- 1C API Key → без обмежень\n\n"
        " SQL: dbo.GetDealerFullLedger"
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

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")



    


    contractor_binary, contractor_guid = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # logger.info(
    #     f"Fetching payment status: Contractor={contractor_binary.hex().upper() if contractor_binary else 'None'}, "
    #     f"From={date_from}, To={date_to}"
    # )

    try:
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


        def convert_bytes(value):
            if isinstance(value, (bytes, bytearray, memoryview)):
                return value.hex().upper()
            return value

        results = [
            {k: convert_bytes(v) for k, v in row.items()}
            for row in results
        ]

        duration = time.time() - start_time
        # logger.info(f"Payment status request completed in {duration:.3f}s. Rows returned: {len(results)}")


        return JsonResponse(
            results,
            safe=False,
            json_dumps_params={"ensure_ascii": False}
        )
    except Exception as e:
        # Розраховуємо тривалість навіть при помилці
        duration = time.time() - start_time
        
        # 4. Лог помилки
        logger.error(f"Payment ledger error for {user_name}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_payment_ledger',
                'status': 'error',
                'contractor': contractor_guid,
                'duration_sec': round(duration, 4)
            }
        })
        
        return JsonResponse(
            {"error": "Internal server error", "detail": str(e)}, 
            status=500
        )



import time
import logging
from django.db import connection
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from asgiref.sync import async_to_sync, sync_to_async

logger = logging.getLogger(__name__)

# 1. Асинхронна обгортка для читання кількох наборів даних (Multiple Result Sets) з MS SQL
@sync_to_async
def execute_payment_page_procedure(contractor_binary):
    sql = """
        EXEC dbo.GetDealerPaymentPageData
            @Contractor = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [contractor_binary])
        
        # Читаємо перший набір даних (orders)
        columns1 = [col[0] for col in cursor.description] if cursor.description else []
        orders = [dict(zip(columns1, row)) for row in cursor.fetchall()]

        # Читаємо другий набір даних (contracts), якщо він є
        contracts = []
        if cursor.nextset() and cursor.description:
            columns2 = [col[0] for col in cursor.description]
            contracts = [dict(zip(columns2, row)) for row in cursor.fetchall()]
            
        return orders, contracts


@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_dealer_payment_page_data_view(request):  # Синхронна для сумісності з DRF
    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    # Внутрішня асинхронна функція для обробки I/O
    async def _async_logic():
        try:
            # Загортаємо resolve_contractor, якщо вона робить синхронні запити в БД
            contractor_binary, contractor_guid = await sync_to_async(resolve_contractor)(
                request,
                allow_admin=True,
                admin_param="contractor",
            )
        except Exception as e:
            logger.error(f"Contractor resolution failed in payment page: {str(e)}", extra={
                'tags': {'action': 'get_dealer_payment_page_data_view'}
            })
            return {"error": "Unauthorized or missing contractor", "status_code": 400}

        try:
            # Викликаємо збережену процедуру асинхронно
            orders, contracts = await execute_payment_page_procedure(contractor_binary)
            
            # Допоміжна функція для очищення бінарних даних 1С (CPU-bound логіка)
            def fix(v):
                if isinstance(v, (bytes, bytearray, memoryview)):
                    return bin_to_guid_1c(v)
                return v

            orders = [{k: fix(v) for k, v in r.items()} for r in orders]
            contracts = [{k: fix(v) for k, v in r.items()} for r in contracts]

            return {
                "orders": orders,
                "contracts": contracts,
                "contractor_guid": contractor_guid,
                "status": "success"
            }

        except Exception as e:
            return {
                "error": "Internal server error",
                "detail": str(e),
                "status_code": 500,
                "contractor_guid": contractor_guid if 'contractor_guid' in locals() else "unknown"
            }

    # Запуск асинхронного таска у синхронному DRF
    result = async_to_sync(_async_logic)()

    # Якщо сталася помилка під час виконання логіки
    if "error" in result:
        duration = time.time() - start_time
        logger.error(
            f"Error loading payment page data: {result.get('detail')}", 
            exc_info=True, 
            extra={
                'tags': {
                    'action': 'get_payment_page_data',
                    'status': 'error',
                    'contractor': result.get("contractor_guid"),
                    'duration_sec': round(duration, 4)
                }
            }
        )
        return JsonResponse({"error": result["error"], "detail": result.get("detail", "")}, status=result["status_code"])

    # Успішний результат
    duration = time.time() - start_time
    
    # Роскомментуйте, якщо логгер потрібен на продакшені:
    # logger.info(f"Payment page data loaded for {result['contractor_guid']}", extra={
    #     'tags': {
    #         'action': 'get_payment_page_data',
    #         'status': 'success',
    #         'orders_count': len(result["orders"]),
    #         'contracts_count': len(result["contracts"]),
    #         'duration_sec': round(duration, 4)
    #     }
    # })

    return JsonResponse(
        {
            "orders": result["orders"],
            "contracts": result["contracts"]
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

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    try:
        contractor_bin, contractor_guid = resolve_contractor(
            request,
            allow_admin=True,
            admin_param="contractor_guid",
        )
    except Exception as e:
        logger.error(f"Contractor resolution failed in payment page: {str(e)}")
        return JsonResponse({"error": "Unauthorized or missing contractor"}, status=400)
    

    # logger.info(f"Fetching advance balance for {contractor_guid}", extra={
    #     'tags': {
    #         'action': 'get_advance_balance',
    #         'user': user_name,
    #         'contractor': contractor_guid
    #     }
    # })

    try:
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


        result = []

        for row in rows:
            row_dict = {}

            for col, val in zip(columns, row):

                if isinstance(val, (bytes, bytearray, memoryview)):
                    row_dict[col] = bin_to_guid_1c(bytes(val))
                else:
                    row_dict[col] = val

            result.append(row_dict)

        duration = time.time() - start_time

        # 4. Лог успіху
        logger.info(f"Successfully retrieved advance balance for {contractor_guid}", extra={
            'tags': {
                'action': 'get_advance_balance',
                'status': 'success',
                'count': len(result),
                'duration_sec': round(duration, 4)
            }
        })


        return Response(result, status=200)
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Error fetching advance balance for {contractor_guid}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_advance_balance',
                'status': 'error',
                'duration_sec': round(duration, 4)
            }
        })

        raise e

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

    start_time = time.time()

    date_from = parse_date(request.GET.get("date_from"), "date_from")
    date_to = parse_date(request.GET.get("date_to"), "date_to")


    contractor_bin, contractor_guid = resolve_contractor(request)


    wb = Workbook(write_only=True)
    ws = wb.create_sheet("Payment Status")

    ws.append([
        "Дата", "Час", "Договір", "Канал",
        "Зал. поч.", "Прихід", "Розхід",
        "Зал. кін.", "№ зам.", "Сума зам.",
        "Оплата", "Зал. зам.", "Статус"
    ])

    try:

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
    except Exception as e:

    
        duration = time.time() - start_time
        logger.error(f"Error fetching excel for {contractor_guid}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'export_payment_status_excel',
                'status': 'error',
                'duration_sec': round(duration, 4)
            }
        })

        raise e




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
def dealer_bills_add_info(contractor_guid: str, is_branch: bool = False):
    start_time = time.time()
    
    try:
      
        contractor_bin = guid_to_1c_bin_2(contractor_guid)

        with connection.cursor() as cursor:
         
            cursor.execute(
                "EXEC dbo.GetDealerBillsAdd_2 %s",
                [contractor_bin]
            )

          
            row = cursor.fetchone()
            contractor = (
                convert_row(dict(zip([c[0] for c in cursor.description], row)))
                if row else None
            )

           
            cursor.nextset()
            addresses = [
                convert_row(dict(zip([c[0] for c in cursor.description], r)))
                for r in cursor.fetchall()
            ]

          
            cursor.nextset()
            accounts = [
                convert_row(dict(zip([c[0] for c in cursor.description], r)))
                for r in cursor.fetchall()
            ]

            # Набір 4: Дозволена номенклатура
            cursor.nextset()
            nomenclature = [
                dict(zip([c[0] for c in cursor.description], r))
                for r in cursor.fetchall()
            ]

           
            cursor.nextset()

            # 1. Збираємо всі записи з бази
            all_organizations = [
                dict(zip([c[0] for c in cursor.description], r))
                for r in cursor.fetchall()
            ]

            
            bank_key = 'AccountNameInRegBase'   

            
            if is_branch:
           
                organizations = all_organizations
            else:
                
                target_banks = {
                    'Акцiонерний банк"Пiвденний" (Расчетный)',
                    'ПРИВАТБАНК Євро Віндоус UA783052990000026005041804757'
                }
                
                
                organizations = [
                    org for org in all_organizations
                    if org[bank_key].strip() in target_banks
                ]

                
        duration = time.time() - start_time

        logger.info(f"Successfully retrieved billing info for {contractor_guid}", extra={
            'tags': {
                'action': 'get_bills_add_info',
                'status': 'success',
                'contractor': contractor_guid,
                'addr_count': len(addresses),
                'acc_count': len(accounts),
                'nom_count': len(nomenclature),
                'org_count': len(organizations),
                'duration_sec': round(duration, 4)
            }
        })

        
        return {
            "contractor": contractor,
            "addresses": addresses,
            "accounts": accounts,
            "nomenclature": nomenclature,
            "organizations": organizations,  # Нове поле з даними 5-го селекту
        }

    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Error fetching billing info for {contractor_guid}: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_bills_add_info',
                'status': 'error',
                'contractor': contractor_guid,
                'duration_sec': round(duration, 4)
            }
        })
        raise e

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

    start_time = time.time()

    user_name = request.user.username if request.user.is_authenticated else "api_key_user"

    is_branch = request.user.is_branch if request.user.is_authenticated else "api_key_user"

    contractor_bin, contractor_guid = resolve_contractor(request)

    try:


        data = dealer_bills_add_info(contractor_guid, is_branch)

        return Response({
            # "contractor": contractor_guid,
            "data": data
        })

    except Exception as e:
        duration = time.time() - start_time
       
        logger.error(f"API Error in billing add-info view: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'view_bills_add_info',
                'status': 'error',
                'user': user_name,
                'duration_sec': round(duration, 4)
            }
        })
  
        raise e




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

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "api_key_user"
    

    raw_from = request.GET.get("date_from")
    raw_to = request.GET.get("date_to")
    date_from = parse_date(raw_from, "date_from")
    date_to = parse_date(raw_to, "date_to")

    contractor_bin, contractor_guid = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # logger.info(f"Fetching customer bills for {contractor_guid}", extra={
    #     'tags': {
    #         'action': 'get_customer_bills',
    #         'user': user_name,
    #         'contractor': contractor_guid,
    #         'period_start': raw_from,
    #         'period_end': raw_to
    #     }
    # })
    try:

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

            # 1. ОБРОБКА ПЕРШОГО SELECT (Рахунки)
            columns_bills = [c[0] for c in cursor.description]
            rows_bills = cursor.fetchall()
     
            VAT_RATE = 0.20  # Ставка ПДВ (20%)
            bills_data = []

            for row in rows_bills:
                # Отримуємо початковий словник рядка
                bill = convert_row(dict(zip(columns_bills, row)))
                
                # Приводимо значення до потрібних типів даних
                total = float(bill.get("TotalAmount") or 0)
                is_vat = bool(bill.get("IsVAT"))
                include_vat = bool(bill.get("SumIncludeVAT"))
                
                
                if is_vat:
                    if include_vat:
                        vat_amount = total * 20 / 120  
                        total_with_vat = total
                    else:
                        vat_amount = total * VAT_RATE  
                        total_with_vat = total + vat_amount
                else:
                    vat_amount = 0.0
                    total_with_vat = total

               
                processed_bill = {
                    **bill, 
                    "InvoiceNumber": bill["InvoiceNumber"].replace(" ", "") if bill.get("InvoiceNumber") else "",
                    "BillNumber": bill.get("BillNumber"),
                    "BillNumber_2": str(bill["BillNumber"])[1:].lstrip('0') if bill.get("BillNumber") else "",
                    "VAT_Amount": round(vat_amount, 2),
                    "TotalWithVAT": round(total_with_vat, 2)
                }
                bills_data.append(processed_bill)
            # Перемикаємо курсор на наступний SELECT
            cursor.nextset()

            # 2. ОБРОБКА ДРУГОГО SELECT (Організація)
            columns_org = [c[0] for c in cursor.description]
            rows_org = cursor.fetchall()
            org_data = [
                dict(zip(columns_org, row)) # тут convert_row зазвичай не потрібен, але можна додати за потреби
                for row in rows_org
            ]

# Тепер у вас є два окремих списки:
# bills_data -> список рахунків
# org_data   -> дані організації (зазвичай 1 рядок)

        duration = time.time() - start_time


        logger.info(f"Successfully retrieved {len(bills_data)} customer bills", extra={
            'tags': {
                'action': 'get_customer_bills',
                'status': 'success',
                'contractor': contractor_guid,
                'count': len(bills_data),
                'duration_sec': round(duration, 4)
            }
        })



        return Response({
            "contractor": contractor_guid,
            "count": len(bills_data),
            "edrpou": org_data,
            "items": bills_data
        })
    
    except Exception as e:
        duration = time.time() - start_time

        logger.error(f"Error fetching customer bills: {str(e)}", exc_info=True, extra={
            'tags': {
                'action': 'get_customer_bills',
                'status': 'error',
                'contractor': contractor_guid,
                'duration_sec': round(duration, 4)
            }
        })
        raise e





import binascii

def get_contractor_guid_from_db(user):
    if not user.user_id_1C:
        return None

    # binary → hex string
    return bin_to_guid_1c(user.user_id_1C)



@api_view(["POST"])
@permission_classes([IsAuthenticatedOr1CApiKey])
def create_invoice(request):
    start_time = time.time()

    user = request.user
    data = request.data

    contractor_guid = get_contractor_guid_from_db(user)
    user_name = user.username if user.is_authenticated else "api_key_user"

    if not contractor_guid:
        logger.warning(f"Invoice creation failed: No 1C GUID for user {user_name}")
        return Response({"error": "User has no 1C contractor GUID"}, status=400)

    items_count = len(data.get("OrderItemsLIST", []))
    

    # logger.info(f"User {user_name} is creating invoice", extra={
    #     'tags': {
    #         'action': 'create_invoice',
    #         'contractor': contractor_guid,
    #         'items_count': items_count
    #     }
    # })

    payload_1c = {
        "contragentGUID": contractor_guid,
        "addressGUID": data.get("AddressGUID"),
        "ibanGUID": data.get("IbanGUID"),
        "createDate": data.get("OrderCreateDate"),
        "deliveryDate": data.get("OrderDeliveryDate"),
        "paymentDate": data.get("OrderPaymentDate"),
        "comment": data.get("InternalComment", ""),
        "totalSum": data.get("OrderSuma"),
        "organizationCode": data.get("OrganizationCode"),
        "linkReg": data.get("LinkReg"),
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
    try:
        result = send_to_1c(
            payload=payload_1c,
            query="CreateBill",
        )

        duration = time.time() - start_time

        logger.info(f"Invoice created successfully for {contractor_guid}", extra={
            'tags': {
                'action': 'create_invoice',
                'status': 'success',
                'duration_sec': round(duration, 4)
            },
            'response_1c': result
        })
        return Response({"status": "ok", "data": result, "payload": payload_1c}, status=201)

    
    except Exception as e:
        logger.error(f"Invoice creation error: {str(e)}", exc_info=True, extra={
            'tags': {'action': 'create_invoice', 'status': 'error'}
        })
        return Response({"error": "1C Connection Error"}, status=502)





@api_view(["POST"])
@permission_classes([IsAuthenticated])
def make_payment_from_advance(request):
    start_time = time.time()
    data = request.data
    user_name = request.user.username

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

    try:
        response_1c = send_to_1c(
            payload=payload_1c,
            query="PaymentForOrders",

        )

        results = response_1c.get("results", []) if isinstance(response_1c, dict) else []

        duration = time.time() - start_time

        if not results or any(not item.get("success", False) for item in results):

            logger.warning(f"1C rejected advance payment for order {order_id}", extra={
                'tags': {'action': 'advance_payment', 'status': 'rejected'},
                'response': response_1c
            })
            return Response(
                {
                    "success": False,
                    "error": "1С відхилила запит або повернула помилку",
                    "details_from_1c": response_1c
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Advance payment successful", extra={
            'tags': {'action': 'advance_payment', 'status': 'success', 'duration_sec': round(duration, 4)}
        })

    
        return Response(
            {
                "success": True,
                "sent_to_1c": payload_1c,
                "response_1c": response_1c,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Advance payment critical error: {str(e)}", exc_info=True)
        return Response({"success": False, "error": "Internal error"}, status=500)





class GetBillPDF(APIView):
    permission_classes = [IsAuthenticated]




    def post(self, request, bill_guid):
        start_time = time.time()
        user_name = request.user.username
        
     
        # logger.info(f"User {user_name} requested PDF for bill {bill_guid}", extra={
        #     'tags': {
        #         'action': 'download_bill_pdf',
        #         'bill_id': bill_guid,
        #         'user': user_name
        #     }
        # })
        # 1. Перевірка доступу (resolve_contractor)
        try:
            _, contractor_guid = resolve_contractor(
                request,
                allow_admin=True,
                admin_param="contractor_guid",
            )
        except (ValueError, PermissionError) as e:
            logger.warning(f"Unauthorized PDF access by {user_name}: {str(e)}")
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
            logger.error(f"1C Validation error for bill {bill_guid}: {str(e)}")
            return Response(e.detail, status=400)

        if not pdf_b64:
            logger.error(f"1C returned empty file for bill {bill_guid}")
            return Response({"detail": "1С повернула порожній файл"}, status=404)

        # 3. Формування PDF відповіді
        try:
            pdf_binary = base64.b64decode(pdf_b64)
            duration = time.time() - start_time
            
            logger.info(f"PDF bill {bill_guid} sent successfully", extra={
                'tags': {
                    'action': 'download_bill_pdf',
                    'status': 'success',
                    'size_kb': round(len(pdf_binary) / 1024, 2),
                    'duration_sec': round(duration, 4)
                }
            })

            response = HttpResponse(pdf_binary, content_type='application/pdf')
          
            filename = f"Bill_{bill_guid[:8]}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response

        except Exception as e:
            logger.error(f"Error processing PDF for bill {bill_guid}: {str(e)}", exc_info=True)
            return Response({"detail": f"Помилка обробки файлу: {str(e)}"}, status=500) 
        


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
@permission_classes([IsAuthenticated]) 
@safe_view 
def get_partner_full_data_view(request):

    start_time = time.time()
    user_name = request.user.username if request.user.is_authenticated else "unknown"

    
    try:
        contractor_binary, contractor_guid = resolve_contractor(
            request,
            allow_admin=True,
            admin_param="contractor",
        )
    except (ValueError, PermissionError) as e:
        return JsonResponse({"detail": str(e)}, status=400)

  
    # logger.info(f"Fetching full partner data for {contractor_guid}", extra={
    #     'tags': {
    #         'action': 'get_partner_full_data',
    #         'user': user_name,
    #         'contractor': contractor_guid
    #     }
    # })

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
        
            cursor.execute("EXEC dbo.GetPartnerFullData @Contractor = %s", [contractor_binary])

   
            orders = get_dict_list(cursor)

          
            contracts = []
            if cursor.nextset():
                contracts = get_dict_list(cursor)

      
            debt_items = []
            debt_summary = []
            if cursor.nextset():
                raw_debts = get_dict_list(cursor)
               
                debt_items = [d for d in raw_debts if d.get('SortOrder') == 0]
                debt_summary = [d for d in raw_debts if d.get('SortOrder') == 1]

        duration = time.time() - start_time


        logger.info(f"Partner full data loaded for {contractor_guid}", extra={
            'tags': {
                'action': 'get_partner_full_data',
                'status': 'success',
                'orders_count': len(orders),
                'contracts_count': len(contracts),
                'debt_rows': len(debt_items),
                'duration_sec': round(duration, 4)
            }
        })

        return JsonResponse(
            {
                "contractor_guid": contractor_guid,
                "orders": orders,
                "contracts": contracts,
                "debts": {
                    "items": debt_items,
                    "summaries": debt_summary 
                }
            },
            json_dumps_params={"ensure_ascii": False}
        )



    except DatabaseError as e:

        duration = time.time() - start_time
        error_msg = str(e)


        status_tag = 'db_recovery' if ("927" in error_msg or "recovery" in error_msg.lower()) else 'db_error'
        
        logger.error(f"Database error in PartnerFullData: {error_msg}", extra={
            'tags': {
                'action': 'get_partner_full_data',
                'status': status_tag,
                'contractor': contractor_guid,
                'duration_sec': round(duration, 4)
            }
        })

        if status_tag == 'db_recovery':
            return JsonResponse({"error": "database_recovery", "detail": "База оновлюється..."}, status=503)
        return JsonResponse({"detail": f"SQL Error: {error_msg}"}, status=500)
    

    
    # Формуємо єдину відповідь
