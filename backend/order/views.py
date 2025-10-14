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
from .models import Order, Message
from .serializers import OrderCreateSerializer, OrderMessageSerializer
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order, Message
import base64

from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from .models import Order, Message
from .serializers import OrderCreateSerializer
 


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



from django.contrib.contenttypes.models import ContentType
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, Message

class AddOrderMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        user = request.user
        text = request.data.get("message")
        if not text:
            return Response({"error": "Message text required"}, status=400)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        # Беремо ContentType для Order
        content_type = ContentType.objects.get_for_model(Order)

        # Створюємо повідомлення
        message = Message.objects.create(
            content_type=content_type,
            object_id=order.id,
            writer=user,
            message=text
        )

        serializer = {
            "id": message.id,
            "message": message.message,
            "author": message.writer.full_name if message.writer else None,
            "created_at": message.created_at.isoformat(),
            "updated_at": message.updated_at.isoformat(),
            "order_id": order.id
        }

        return Response(serializer, status=201)


from django.contrib.contenttypes.models import ContentType

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        uploaded_file = request.FILES.get("file")
        now = timezone.now()

        if not uploaded_file:
            return Response({"error": "Файл обов'язковий"}, status=400)

        # Кодуємо файл у Base64
        file_bytes = uploaded_file.read()
        file_base64 = base64.b64encode(file_bytes).decode('utf-8')

        role = user.role
        manager_roles = ["manager", "region_manager"]

        if role in manager_roles:
            customer_id = request.data.get("CustomerId")
            if not customer_id:
                return Response({"error": "CustomerId is required for managers"}, status=400)
            author_id = user.id
        else:
            customer_id = user.id
            author_id = user.id

        serializer = OrderCreateSerializer(data={
            "order_number": request.data.get("OrderNumber"),
            "customer": customer_id,
            "author": author_id,
            "order_number_constructions": request.data.get("ConstructionsCount", 0),
            "file": file_base64,
            "create_date": now,
        })

        if serializer.is_valid():
            order = serializer.save()

            comment_text = request.data.get("Comment")
            if comment_text:
                content_type = ContentType.objects.get_for_model(Order)
                Message.objects.create(
                    content_type=content_type,
                    object_id=order.id,
                    writer=user,
                    message=comment_text
                )

            return Response({
                "id": order.id,
                "name": order.order_number,
                "dateRaw": order.create_date,
                "ConstructionsCount": order.order_number_constructions,
                "Comment": comment_text,
                "file": uploaded_file.name  # залишаємо оригінальне ім'я
            }, status=201)

        return Response(serializer.errors, status=400)



class DeleteOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, order_id):
        """
        Видалення замовлення за order_id
        Перевіряє роль користувача: автор замовлення або менеджер може видаляти.
        """
        order = get_object_or_404(Order, id=order_id)
        user = request.user
        manager_roles = ["manager", "region_manager"]

        # Перевірка прав


        try:
            # Видаляємо всі повідомлення, пов’язані з цим замовленням
            Message.objects.filter(order=order).delete()
            order.delete()
            return Response({"success": f"Замовлення {order_id} видалено"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class LastOrderNumberView(APIView):
    def get(self, request):
        last_order = Order.objects.aggregate(LastOrderNumber=Max("order_number"))
        last_number = int(last_order["LastOrderNumber"] or 0)
        return Response({"LastOrderNumber": last_number}, status=status.HTTP_200_OK)


from django.contrib.contenttypes.models import ContentType
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order, Message

class OrderMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        # Отримуємо ContentType для Order
        content_type = ContentType.objects.get_for_model(Order)

        # Витягуємо всі повідомлення, пов'язані з цим замовленням
        messages = Message.objects.filter(content_type=content_type, object_id=order.id).select_related("writer")

        # Серіалізація
        serialized = [
            {
                "id": m.id,
                "message": m.message,
                "author": m.writer.full_name if m.writer else None,
                "created_at": m.created_at.isoformat(),
                "updated_at": m.updated_at.isoformat(),
                "order_id": order.id,
                "writer_id": m.writer.id if m.writer else None
            }
            for m in messages
        ]

        return Response(serialized, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
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



# views.py
from django.http import JsonResponse
from django.utils import timezone
from django.db import connection


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def portal_view(request):
    user = request.user
    customer_id = getattr(user, 'id', None)

    if not customer_id:
        return JsonResponse({"error": "User ID is missing"}, status=400)


    # Беремо рік із GET-параметра, якщо не передано — поточний
    reporting_year = request.GET.get("year")
    try:
        reporting_year = int(reporting_year)
    except (TypeError, ValueError):
        reporting_year = timezone.now().year

    payload = {
        "name": "RootController",
        "class": "RootController",
        "CustomerID": customer_id,
        "reportingPeriod": reporting_year,
        "uuid": f"RootController-{timezone.now().timestamp()}",
        "calculation": []
    }

    # Викликаємо процедуру
    with connection.cursor() as cursor:
        cursor.execute("""
            EXEC [dbo].[GetOrdersByDealerAndYear1] @ОтчетныйГод=%s, @ПользовательПортал_ID=%s
        """, [reporting_year, customer_id])

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Групуємо дані по Calculation_ID
    calc_map = {}
    for row in rows:
        calc_id = row["Просчет_ID"]
        if calc_id not in calc_map:
            calc_map[calc_id] = {
                "uuid": str(calc_id),
                "class": "Calculation",
                # "File": row["File"],
                "name": row["НомерПросчета"],
                "ДатаПросчета": row["ДатаПросчета"].isoformat() if row["ДатаПросчета"] else None,
                "КоличествоКонструкцийВПросчете": row["КоличествоКонструкцийВПросчете"],
                "ПросчетСообщения": row["ПросчетСообщения"],
                "order": []
            }

        order_dict = {
            "uuid": str(row["Заказ_ID"]),
            "class": "Order",
            "name": row["НомерЗаказа"],
            "ДатаЗаказа": row["ДатаЗаказа"].isoformat() if row["ДатаЗаказа"] else None,
            "СостояниеЗаказа": row["СостояниеЗаказа"],
            "СуммаЗаказа": row["СуммаЗаказа"],
            "КоличествоКонструкцийВЗаказе": row["КоличествоКонструкцийВЗаказе"],
            "ПлановаяДатаПроизводстваМакс": row["ПлановаяДатаПроизводстваМакс"].isoformat() if row["ПлановаяДатаПроизводстваМакс"] else None,
            "ПлановаяДатаПроизводстваМин": row["ПлановаяДатаПроизводстваМин"].isoformat() if row["ПлановаяДатаПроизводстваМин"] else None,
            "ОплаченоПоЗаказу": row["ОплаченоПоЗаказу"],
            "ФактическаяДатаПроизводстваМин": row["ФактическаяДатаПроизводстваМин"].isoformat() if row["ФактическаяДатаПроизводстваМин"] else None,
            "ФактическаяДатаПроизводстваМакс": row["ФактическаяДатаПроизводстваМакс"].isoformat() if row["ФактическаяДатаПроизводстваМакс"] else None,
            "ПроизведеноВсего": row["ПроизведеноВсего"],
            "ФактическаяДатаГотовностиМин": row["ФактическаяДатаГотовностиМин"].isoformat() if row["ФактическаяДатаГотовностиМин"] else None,
            "ФактическаяДатаГотовностиМакс": row["ФактическаяДатаГотовностиМакс"].isoformat() if row["ФактическаяДатаГотовностиМакс"] else None,
            "ДатаРеализации": row["ДатаРеализации"].isoformat() if row["ДатаРеализации"] else None,
            "КоличествоРеализовано": row["КоличествоРеализовано"],
            "АдресДоставки": row["АдресДоставки"],
            "ПлановаяДатаВыезда": row["ПлановаяДатаВыезда"].isoformat() if row["ПлановаяДатаВыезда"] else None,
            "КоличествоТоваровВДоставке": row["КоличествоТоваровВДоставке"],
            "ВремяПрибытия": row["ВремяПрибытия"].isoformat() if row["ВремяПрибытия"] else None,
            "СостояниеМаршрута": row["СостояниеМаршрута"],
            "ЭтапВыполненияЗаказа": row["ЭтапВыполненияЗаказа"]
        }

        calc_map[calc_id]["order"].append(order_dict)

    payload["calculation"] = list(calc_map.values())

    return JsonResponse({
        "status": "success",
        "message": "ok",
        "data": payload
    })





from django.contrib.contenttypes.models import ContentType

class EditOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, order_id):
        user = request.user
        order = get_object_or_404(Order, id=order_id)

        if not (user.role in ["manager", "region_manager"] or 
                order.author_id == user.id or 
                order.customer_id == user.id):
            return Response({"error": "Немає доступу до редагування"}, status=403)

        uploaded_file = request.FILES.get("file")
        constructions_count = request.data.get("ConstructionsCount")
        comment_text = request.data.get("Comment")

        if constructions_count is not None:
            order.order_number_constructions = constructions_count
        if uploaded_file:
            file_bytes = uploaded_file.read()
            order.file = base64.b64encode(file_bytes).decode('utf-8')
        order.save()

        if comment_text:
            content_type = ContentType.objects.get_for_model(Order)
            last_message = Message.objects.filter(
                content_type=content_type,
                object_id=order.id,
                writer=user
            ).order_by("-created_at").first()

            if last_message:
                last_message.message = comment_text
                last_message.save()
            else:
                Message.objects.create(
                    content_type=content_type,
                    object_id=order.id,
                    writer=user,
                    message=comment_text
                )

        return Response({
            "id": order.id,
            "name": order.order_number,
            "dateRaw": order.create_date,
            "ConstructionsCount": order.order_number_constructions,
            "Comment": comment_text,
            "file": uploaded_file.name if uploaded_file else None
        }, status=200)


import base64
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from .models import Order

from django.http import HttpResponse
import base64

from django.shortcuts import get_object_or_404
from django.http import HttpResponse, FileResponse, Http404
import base64

def download_order_file(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    
    if not order.file:
        raise Http404("Файл не знайдено")

    # Якщо файл у тебе в Base64
    file_data = base64.b64decode(order.file)
    response = HttpResponse(file_data, content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{order.order_number}.zkz"'
    return response
