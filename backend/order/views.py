from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import connection
from django.db.models import Max
from collections import defaultdict
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from .models import Order, OrderMessage
from .serializers import OrderCreateSerializer, OrderMessageSerializer
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

class CustomerOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Повертає всі замовлення користувача, вже згруповані по CustomerOrderNumber
        """
        customer_id_bytes = request.user.user_id_1C
        if not customer_id_bytes:
            return Response({"error": "User has no user_id_1C"}, status=400)

        try:
            with connection.cursor() as cursor:
                cursor.execute("EXEC dbo.GetCustomerOrders @customer_id=%s", [customer_id_bytes])
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()

            data = []
            for row in rows:
                row_dict = {}
                for col, value in zip(columns, row):
                    if isinstance(value, bytes):
                        try:
                            row_dict[col] = value.decode("utf-8")
                        except Exception:
                            row_dict[col] = value.hex()
                    else:
                        row_dict[col] = value

                # Order1CNumber завжди масив
                row_dict["Order1CNumber"] = [row_dict["Order1CNumber"]] if row_dict.get("Order1CNumber") else []

                data.append(row_dict)

            # Групування по CustomerOrderNumber
            grouped = {}
            for order in data:
                key = order["CustomerOrderNumber"]
                if key not in grouped:
                    grouped[key] = order
                else:
                    # Додаємо всі Order1CNumber в один масив
                    grouped[key]["Order1CNumber"].extend(order["Order1CNumber"])

            grouped_data = list(grouped.values())

            return Response(grouped_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


            
class AddOrderMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        user = request.user
        text = request.data.get("message")
        if not text:
            return Response({"error": "Message text required"}, status=400)

        try:
            order = Order.objects.get(id=order_id)
            message = OrderMessage.objects.create(order=order, writer=user, message=text)
            serializer = {
                "message": message.message,
                "author": message.writer.full_name if message.writer else None,
                "created_at": message.created_at,
                "updated_at": message.updated_at,
                "order_id": message.order_id,
            }
            return Response(serializer, status=201)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        uploaded_file = request.FILES.get("file")
        now = timezone.now()

        # Визначаємо роль користувача
        role = user.role
        manager_roles = ["manager", "region_manager"]

        if role in manager_roles:
            # Клієнт ID передається з фронтенду
            customer_id = request.data.get("CustomerId")
            if not customer_id:
                return Response({"error": "CustomerId is required for managers"}, status=400)
        else:
            # Дилер або клієнт – customer = сам користувач
            customer_id = user.id

        serializer = OrderCreateSerializer(data={
            "order_number": request.data.get("OrderNumber"),
            "customer": customer_id,
            "author": user.id,
            "order_number_constructions": request.data.get("ConstructionsCount", 0),
            "file": uploaded_file,
            "create_date": now,
        })

        if serializer.is_valid():
            order = serializer.save()

            comment_text = request.data.get("Comment")
            if comment_text:
                OrderMessage.objects.create(order=order, writer=user, message=comment_text)

            return Response({"success": "Замовлення створено"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LastOrderNumberView(APIView):
    def get(self, request):
        last_order = Order.objects.aggregate(LastOrderNumber=Max("order_number"))
        last_number = int(last_order["LastOrderNumber"] or 0)
        return Response({"LastOrderNumber": last_number}, status=status.HTTP_200_OK)


class OrderMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        messages = OrderMessage.objects.filter(order_id=order_id).select_related("writer")
        serialized = [
            {
                "id": m.id,
                "message": m.message,
                "author": m.writer.full_name if m.writer else None,
                "created_at": m.created_at,
                "updated_at": m.updated_at,
                "order_id": m.order_id,
                "writer_id": m.writer.id if m.writer else None,
            }
            for m in messages
        ]
        return Response(serialized, status=200)



@csrf_exempt
def get_order_payment_status(request):
    """
    Викликає збережену процедуру GetOrderPaymentStatusWithOrderStatus
    та повертає JSON з результатами.
    Очікує GET-параметр 'numbers' (рядок з номерами замовлень через кому).
    """
    numbers = request.GET.get("numbers", "")
    if not numbers:
        return JsonResponse({"error": "Missing 'numbers' parameter"}, status=400)

    try:
        with connection.cursor() as cursor:
            # Викликаємо процедуру
            cursor.execute("""
                EXEC [dbo].[GetOrderPaymentStatusWithOrderStatus] @Numbers = %s
            """, [numbers])
            
            # Отримуємо назви колонок
            columns = [col[0] for col in cursor.description]
            
            # Перетворюємо результати в список словників
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

        return JsonResponse({"data": results}, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)





from django.http import JsonResponse
from django.db import connection
import binascii  # для перетворення bytes у hex


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_filtered_orders(request):
    user = request.user
    kontragent = getattr(user, "user_id_1C", None)

    if not kontragent:
        return Response({"error": "User has no user_id_1C"}, status=400)

    date_start = request.GET.get("date_start")
    date_end = request.GET.get("date_end")

    with connection.cursor() as cursor:
        cursor.execute("""
            EXEC dbo.GetFilteredOrders2 @Контрагент=%s, @ДатаНачала=%s, @ДатаКонец=%s
        """, [kontragent, date_start, date_end])
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

    result = []
    for row in rows:
        item = {}
        for col, val in zip(columns, row):
            if isinstance(val, bytes):
                item[col] = binascii.hexlify(val).decode()
            else:
                item[col] = val
        result.append(item)

    return JsonResponse(result, safe=False)



# views.py
from django.db import connection, ProgrammingError
from django.http import JsonResponse
from collections import defaultdict, Counter

def get_orders_by_dealer_and_year(request):
    report_year = request.GET.get('report_year', 2025)
    user_portal_id = request.GET.get('user_portal_id', 5)

    try:
        report_year = int(report_year)
        user_portal_id = int(user_portal_id)
    except ValueError:
        return JsonResponse({'error': 'Invalid parameters'}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC [dbo].[GetOrdersByDealerAndYear] 
                    @CurrentYear = %s, 
                    @User_ID = %s
            """, [report_year, user_portal_id])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            results = [dict(zip(columns, row)) for row in rows]

    except ProgrammingError as e:
        return JsonResponse({'error': 'Database error', 'details': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': 'Unexpected error', 'details': str(e)}, status=500)

    # Групуємо за QuoteNumber
    grouped = defaultdict(list)
    for o in results:
        grouped[o["QuoteNumber"]].append(o)

    final_orders = []

    for quote_number, suborders in grouped.items():
        first = suborders[0]
        main_order = {
            "id": str(quote_number),
            "date": first["QuoteDate"].strftime("%d-%m-%Y %H:%M:%S") if first["QuoteDate"] else None,
            "amount": 0,
            "status": "",
            "suborders_count": len(suborders),
            "total_items_count": 0,
            "suborders": [],
            "file": None
        }

        for o in suborders:
            order_amount = float(o["OrderAmount"] or 0)
            quote_items = float(o["QuoteItemsCount"] or 0)
            order_items = float(o["OrderItemsCount"] or 0)
            payments_made = float(o["PaymentsMade"] or 0)
            quantity_realized = float(o["QuantityRealized"] or 0)

            order_status = (o.get("OrderStatus") or "").strip()

            # Кроки
            steps = [
                {
                    "name": "Замовлення",
                    "date": o["OrderDate"].strftime("%d-%m-%Y %H:%M:%S") if o["OrderDate"] else None,
                    "done": bool(o["OrderDate"]),
                    "details": "Замовлення отримано"
                },
                {
                    "name": "Оплата",
                    "date": o["LastPaymentDate"].strftime("%d-%m-%Y %H:%M:%S") if o["LastPaymentDate"] else None,
                    "done": payments_made >= order_amount and order_amount > 0,
                    "details": (
                        "Оплачено" if payments_made >= order_amount else
                        "Частково оплачено" if payments_made > 0 else
                        "Очікують оплату"
                    )
                },
                {
                    "name": "Підтвердження",
                    "date": None,
                    "done": order_status in ["Підтверджено", "Подтверждено"],
                    "details": "Підтверджено" if order_status in ["Підтверджено", "Подтверждено"] else "Очікується підтвердження"
                },
                {
                    "name": "Виробництво",
                    "date": o.get("ActualProductionDateMax"),
                    "done": bool(o["ActualProductionDateMax"]),
                    "details": "Виробництво заплановано"
                },
                {
                    "name": "Готовність",
                    "date": o.get("ActualReadyDateMax"),
                    "done": bool(o["ActualReadyDateMax"]),
                    "details": "Планова готовність"
                },
                {
                    "name": "Доставка",
                    "date": o.get("RealizationDate") if quantity_realized > 0 else None,
                    "done": quantity_realized >= order_items and order_items > 0,
                    "details": "Відправлено" if quantity_realized > 0 else "Логістика розраховується"
                }
            ]

            # статус підзамовлення
            if steps[5]["done"]:
                status = "Відправлено"
            elif steps[1]["done"] and steps[1]["details"] == "Оплачено":
                status = "Оплачено"
            elif steps[2]["done"]:
                status = "Підтверджено"
            elif order_status in ["Ждем оплаты", "Очікують оплату"]:
                status = "Очікують оплату"
            elif order_status in ["Склад", "В работе", "Ждем подтверждения"]:
                status = "В роботі"
            elif order_status in ["Отказ", "Відмова"]:
                status = "Відмова"
            else:
                status = "Завантажено"

            suborder_data = {
                "id": (o["OrderNumber"] or o["Order_ID"]),
                "date": o["OrderDate"].strftime("%d-%m-%Y %H:%M:%S") if o["OrderDate"] else None,
                "items": int(o["OrderItemsCount"] or 0),
                "pdf": o["File"].split("/")[-1] if o["File"] else None,
                "amount": order_amount,
                "status": status,
                "steps": steps
            }

            main_order["suborders"].append(suborder_data)
            main_order["amount"] += order_amount
            main_order["total_items_count"] += quote_items

            if not main_order["file"] and o["File"]:
                main_order["file"] = o["File"].split("/")[-1]

        # Пріоритетний статус головного замовлення
        substatuses = [s["status"] for s in main_order["suborders"]]
        if all(s == "Відправлено" for s in substatuses):
            main_order["status"] = "Відправлено"
        elif any(s == "Очікують оплату" for s in substatuses):
            main_order["status"] = "Очікують оплату"
        elif any(s == "Очікують підтвердження" for s in substatuses):
            main_order["status"] = "Очікують підтвердження"
        elif any(s == "Оплачено" for s in substatuses):
            main_order["status"] = "Оплачено"
        elif any(s == "Підтверджено" for s in substatuses):
            main_order["status"] = "Підтверджено"
        else:
            main_order["status"] = Counter(substatuses).most_common(1)[0][0]

        final_orders.append(main_order)

    return JsonResponse(final_orders, safe=False)
