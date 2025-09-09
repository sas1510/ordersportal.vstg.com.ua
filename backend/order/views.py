# backend/orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import OrdersUnified
from .serializers import OrdersUnifiedCreateSerializer
from users.models import CustomUser
from django.utils import timezone
from django.utils.text import slugify
import os
from django.conf import settings
from django.utils.text import slugify


class CreateOrderView(APIView):
    def post(self, request):
        user_id = request.data.get("UserId")
        try:
            customer = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Користувач не знайдений"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get("file")
        now = timezone.now()

        serializer = OrdersUnifiedCreateSerializer(data={
            "order_number": request.data.get("OrderNumber"),
            "customer_id": customer.id,
            "order_number_contructions": request.data.get("ConstructionsCount", 0),
            "file": uploaded_file,
            "description": request.data.get("Comment"),
            "create_date": now,
            "last_message_time": now,
            "record_type": "Order"
        })

        if serializer.is_valid():
            serializer.save()
            return Response({"success": "Замовлення створено"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# backend/orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import OrdersUnified
from django.db.models import Max
from rest_framework import status

class LastOrderNumberView(APIView):
    def get(self, request):
        last_order = OrdersUnified.objects.filter(record_type='Order').aggregate(
            LastOrderNumber=Max('order_number')
        )
        # Перетворюємо None у 0
        last_number = int(last_order['LastOrderNumber'] or 0)
        return Response({"LastOrderNumber": last_number}, status=status.HTTP_200_OK)
