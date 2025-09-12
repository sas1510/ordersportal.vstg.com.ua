from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import connection
from django.db.models import Max
from collections import defaultdict

from .models import Order, OrderMessage
from .serializers import OrderCreateSerializer, OrderMessageSerializer


class CustomerOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Повертає замовлення користувача з історією коментарів,
        груповані по CustomerOrderNumber
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

                # Нормалізуємо Order1CNumber в масив
                normalized = {
                    "OrderId": row_dict.get("OrderId"),
                    "CustomerOrderNumber": row_dict.get("CustomerOrderNumber"),
                    "Order1CNumber": [row_dict.get("Order1CNumber")] if row_dict.get("Order1CNumber") else [],
                    "File": row_dict.get("File"),
                    "Date": row_dict.get("Date"),
                    "Status": row_dict.get("Status"),
                    "UserId": row_dict.get("UserId"),
                    "CustomerName": row_dict.get("CustomerName"),
                    "PortalOrderId": row_dict.get("PortalOrderId"),
                    "PortalCreateDate": row_dict.get("PortalCreateDate"),
                    "Comment": row_dict.get("Comment"),
                    "CommentDate": row_dict.get("CommentDate"),
                    "CommentAuthor": row_dict.get("CommentAuthor"),
                    "Constructions": row_dict.get("Constructions"),
                }

                data.append(normalized)

            # 🔹 Групуємо за CustomerOrderNumber
            grouped = defaultdict(list)
            for row in data:
                grouped[row["CustomerOrderNumber"]].append(row)

            result = []
            for customer_order_number, orders in grouped.items():
                # Якщо потрібно, можна об’єднати Order1CNumber з усіх замовлень в масив
                combined_order1c = []
                for o in orders:
                    combined_order1c.extend(o["Order1CNumber"])
                for o in orders:
                    o["Order1CNumber"] = combined_order1c

                result.append({
                    "CustomerOrderNumber": customer_order_number,
                    "orders": orders
                })

            return Response(result, status=200)

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
        customer = request.user
        uploaded_file = request.FILES.get("file")
        now = timezone.now()

        serializer = OrderCreateSerializer(data={
            "order_number": request.data.get("OrderNumber"),
            "customer": customer.id,
            "order_number_constructions": request.data.get("ConstructionsCount", 0),
            "file": uploaded_file,
            "create_date": now,
            "last_message_time": now,
        })

        if serializer.is_valid():
            order = serializer.save()

            comment_text = request.data.get("Comment")
            if comment_text:
                OrderMessage.objects.create(order=order, writer=customer, message=comment_text)

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
