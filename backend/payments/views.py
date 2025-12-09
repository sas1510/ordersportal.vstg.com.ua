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
from backend.utils.GuidToBin1C import guid_to_1c_bin

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_payment_status_view(request):
    """
    Отримує статус оплати для контрагента, використовуючи збережену процедуру MSSQL.
    Приклад виклику: /api/payments/status/?contractor=811D74867AD9D52511ECE7C2E5415765&date_from=2025-11-06&date_to=2025-12-31
    """
    try:
        contractor_binary = request.user.user_id_1C 
    except AttributeError:
        return Response({"error": "Invalid user object"}, status=400)
    # 1. Отримання та валідація параметрів


    # Форматуємо дати: якщо не вказано, беремо великий діапазон
    date_from_str = request.GET.get('date_from', '1900-01-01')
    date_to_str = request.GET.get('date_to', str(date.today()))



    # 2. Виклик збереженої процедури
    sql_query = """
    EXEC dbo.GetContractorPaymentStatus @Контрагент = %s, @ДатаЗ = %s, @ДатаПо = %s
    """
    
    results = []
    
    try:
        with connection.cursor() as cursor:
            # Передаємо BINARY(16) як байтовий об'єкт.
            cursor.execute(sql_query, [contractor_binary, date_from_str, date_to_str])
            
            columns = [col[0] for col in cursor.description]
            
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))

    except Exception as e:
        # Обробка помилок бази даних (наприклад, помилки підключення або SQL)
        return JsonResponse({'error': f'Помилка виконання SQL процедури: {e}'}, status=500)


    # 3. Повернення результату
    return JsonResponse(results, safe=False)



# /var/www/html/ordersportal.vstg.com.ua/backend/payments/views.py

from datetime import date
from django.http import JsonResponse
from django.db import connection

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# коректний імпорт
from backend.utils.GuidToBin1C import guid_to_1c_bin


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
