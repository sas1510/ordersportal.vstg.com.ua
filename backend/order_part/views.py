from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.db import connection

def check_order_exists(request):
    """
    Перевірка існування замовлення по номеру та необов'язково по контрагенту.
    Параметри GET:
        order_number: str
        contragent: hex string (необов'язково)
    """
    order_number = request.GET.get('order_number')
    contragent_hex = request.GET.get('contragent')  # наприклад: 9CDA4CD98F08E56D11F0C92655C4EC04

    if not order_number:
        return JsonResponse({"error": "order_number is required"}, status=400)

    contragent_bin = None
    if contragent_hex:
        try:
            # конвертуємо hex string у bytes
            contragent_bin = bytes.fromhex(contragent_hex)
        except ValueError:
            return JsonResponse({"error": "Invalid contragent hex format"}, status=400)

    with connection.cursor() as cursor:
        if contragent_bin:
            cursor.execute(
                "EXEC [dbo].[CheckOrderExists] @OrderNumber=%s, @Контрагент=%s",
                [order_number, contragent_bin]
            )
        else:
            cursor.execute(
                "EXEC [dbo].[CheckOrderExists] @OrderNumber=%s",
                [order_number]
            )

        row = cursor.fetchone()
        exists = row[0] if row else 0

    return JsonResponse({"order_exists": bool(exists)})
