from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import binascii
import json
from rest_framework import viewsets
from .models import Complaint, ComplaintPhoto
from .serializers import ComplaintSerializer
import base64
from io import BytesIO
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.response import Response
import uuid



@csrf_exempt
def get_issue_complaints(request):
    if request.method == "GET":
        try:
            with connection.cursor() as cursor:
                cursor.execute("EXEC dbo.GetIssueComplaints")
                columns = [col[0] for col in cursor.description]
                results = []
                for row in cursor.fetchall():
                    row_dict = dict(zip(columns, row))
                    # Кодуємо Link у base64 якщо це bytes
                    if isinstance(row_dict.get("Link"), bytes):
                        row_dict["Link"] = base64.b64encode(row_dict["Link"]).decode()
                    results.append(row_dict)

            return JsonResponse({"issues": results}, safe=False)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "GET method required"}, status=405)



@csrf_exempt
def get_gm_solutions(request, reason_id):
    """
    API для отримання рішень рекламації по reason_id (base64-encoded Link/GUID).
    Очікує GET-запит на /api/complaints/solutions/<reason_id>/
    Повертає JSON зі списком рішень.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # Декодуємо base64 в bytes
        owner_bytes = base64.b64decode(reason_id)

        with connection.cursor() as cursor:
            cursor.execute("""
                EXEC dbo.GetComplaintSolutions @Owner=%s
            """, [owner_bytes])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Якщо хочеш, можна знову закодувати Link у base64 перед відправкою фронту
        for r in results:
            if isinstance(r.get("Link"), bytes):
                r["Link"] = base64.b64encode(r["Link"]).decode()

        return JsonResponse({"solutions": results}, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




import base64
from io import BytesIO
from PIL import Image
from django.db import connection
from rest_framework import status, viewsets
from rest_framework.response import Response
from .models import Complaint, ComplaintPhoto, ComplaintOrderSeries
from .serializers import ComplaintSerializer

class ComplaintViewSet(viewsets.ViewSet):
    """
    ViewSet для створення рекламації з фото та серіями замовлення.
    """

    def create(self, request):
        try:
            # Отримуємо base64 рядки для issue та solution
            issue_b64 = request.data.get("issue")
            solution_b64 = request.data.get("solution")

            issue_bytes = base64.b64decode(issue_b64) if issue_b64 else b''
            solution_bytes = base64.b64decode(solution_b64) if solution_b64 else b''

            # Дані рекламації
            complaint_data = {
                "complaint_date": request.data.get("complaint_date"),
                "order_number": request.data.get("order_number"),
                "order_deliver_date": request.data.get("order_deliver_date"),
                "order_define_date": request.data.get("order_define_date"),
                "description": request.data.get("description"),
                "urgent": request.data.get("urgent", False),
                "create_date": request.data.get("create_date"),
                "issue": issue_bytes,
                "solution": solution_bytes,
            }

            # Створюємо рекламацію
            serializer = ComplaintSerializer(data=complaint_data)
            serializer.is_valid(raise_exception=True)
            complaint = serializer.save()

            # --- Виклик процедури для отримання серій ---
            order_number = complaint.order_number
            with connection.cursor() as cursor:
                cursor.execute("EXEC dbo.GetComplaintSeriesByOrder @OrderNumber=%s", [order_number])
                columns = [col[0] for col in cursor.description]
                series_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

            # Додаємо серії у таблицю ComplaintOrderSeries
            series_list = request.data.get("series", [])
            if isinstance(series_list, str):
                # якщо прийшло як JSON рядок
                import json
                series_list = json.loads(series_list)

            for serie_base64 in series_list:
                serie_bytes = base64.b64decode(serie_base64)  # декодуємо у bytes
                ComplaintOrderSeries.objects.create(
                    complaint=complaint,
                    serie_link=serie_bytes,
                    serie_name=None  # або можна передавати назву, якщо є
                )


            # --- Обробка фото ---
            photos = request.FILES.getlist("photos")
            for photo_file in photos:
                photo_bytes = photo_file.read()
                image = Image.open(BytesIO(photo_bytes))
                image.thumbnail((128, 128))
                thumb_io = BytesIO()
                image.save(thumb_io, format='PNG')
                photo_ico_bytes = thumb_io.getvalue()

                ComplaintPhoto.objects.create(
                    complaint=complaint,
                    photo=photo_bytes,
                    photo_name=photo_file.name,
                    upload_complete=True,
                    photo_ico=photo_ico_bytes,
                    photo_size=len(photo_bytes)
                )

            return Response({"success": True, "complaint_id": complaint.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)




from rest_framework.decorators import api_view


@api_view(['GET'])
def get_complaint_series_by_order(request, order_number):
    """
    Викликає процедуру GetComplaintSeriesByOrder по номеру замовлення і повертає серії номенклатури.
    Серії повертаються у base64-форматі, щоб фронт міг безпечно їх обробляти.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("EXEC dbo.GetComplaintSeriesByOrder @OrderNumber=%s", [order_number])

            columns = [col[0] for col in cursor.description]
            results = []

            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                
                # Перетворюємо VARBINARY(16) у base64 рядок
                series_link = row_dict.get("SeriesLink")
                if series_link:
                    row_dict["SeriesLink"] = base64.b64encode(series_link).decode('ascii')
                
                results.append(row_dict)

        return Response({"series": results})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
