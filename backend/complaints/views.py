from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import binascii
import json
from rest_framework import viewsets
from .models import Complaint, ComplaintPhoto2
from .serializers import ComplaintSerializer
import base64
from io import BytesIO
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.response import Response
import uuid
from django.db.models import Max
import os
import uuid
from django.conf import settings
from django.core.files.storage import FileSystemStorage



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




from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import connection
from .models import Complaint, ComplaintOrderSeries
from .serializers import ComplaintSerializer
from PIL import Image
from io import BytesIO
import base64
import json

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Complaint, ComplaintOrderSeries
from PIL import Image
from io import BytesIO
import base64
import json


# class ComplaintViewSet(viewsets.ViewSet):
#     def create(self, request):
#         try:

#             user = request.user
#             kontragent = getattr(user, "user_id_1C", None)


#             # --- Генеруємо web_number ---
#             start_number = 25000  # з якого хочеш почати
#             last_web_number = Complaint.objects.aggregate(Max("web_number"))["web_number__max"]

#             if last_web_number is None:
#                 new_web_number = start_number
#             else:
#                 new_web_number = max(start_number, last_web_number) + 1

#             # --- Issue & Solution ---
#             issue_b64 = request.data.get("issue")
#             solution_b64 = request.data.get("solution")
#             issue_bytes = base64.b64decode(issue_b64) if issue_b64 else None
#             solution_bytes = base64.b64decode(solution_b64) if solution_b64 else None

#             # --- Створюємо рекламацію ---
#             complaint = Complaint.objects.create(
#                 web_number=new_web_number, 
#                 complaint_date=request.data.get("complaint_date"),
#                 order_number=request.data.get("order_number"),
#                 order_deliver_date=request.data.get("order_deliver_date"),
#                 order_define_date=request.data.get("order_define_date"),
#                 description=request.data.get("description"),
#                 urgent=request.data.get("urgent", False),
#                 # create_date=request.data.get("create_date"),
#                 issue=issue_bytes,
#                 solution=solution_bytes,
#                 user_id_1C=kontragent
#             )

#             # --- Серії ---
#             series_list = request.data.get("series", "[]")
#             if isinstance(series_list, str):
#                 series_list = json.loads(series_list)

#             for serie in series_list:
#                 try:
#                     serie_bytes = base64.b64decode(serie["serie_link"])
#                     serie_name = serie.get("serie_name")
#                     ComplaintOrderSeries.objects.create(
#                         complaint=complaint,
#                         serie_link=serie_bytes,
#                         serie_name=serie_name
#                     )
#                 except Exception:
#                     continue


#             # --- Фото ---
#             photos = request.FILES.getlist("photos")
#             for photo_file in photos:
#                 photo_bytes = photo_file.read()
#                 image = Image.open(BytesIO(photo_bytes))
#                 image.thumbnail((128,128))
#                 thumb_io = BytesIO()
#                 image.save(thumb_io, format='PNG')
#                 photo_ico_bytes = thumb_io.getvalue()

#                 ComplaintPhoto.objects.create(
#                     complaint=complaint,
#                     photo=photo_bytes,
#                     photo_name=photo_file.name,
#                     upload_complete=True,
#                     photo_ico=photo_ico_bytes,
#                     photo_size=len(photo_bytes)
#                 )

#             return Response({"success": True, "complaint_id": complaint.id},
#                             status=status.HTTP_201_CREATED)

#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ComplaintViewSet(viewsets.ViewSet):
    def create(self, request):
        try:
            user = request.user
            kontragent = getattr(user, "user_id_1C", None)

            # --- Генеруємо web_number ---
            start_number = 25000
            last_web_number = Complaint.objects.aggregate(Max("web_number"))["web_number__max"]
            new_web_number = start_number if last_web_number is None else max(start_number, last_web_number) + 1

            # --- Issue & Solution ---
            issue_b64 = request.data.get("issue")
            solution_b64 = request.data.get("solution")
            issue_bytes = base64.b64decode(issue_b64) if issue_b64 else None
            solution_bytes = base64.b64decode(solution_b64) if solution_b64 else None

            # --- Створюємо рекламацію ---
            complaint = Complaint.objects.create(
                web_number=new_web_number,
                complaint_date=request.data.get("complaint_date"),
                order_number=request.data.get("order_number"),
                order_deliver_date=request.data.get("order_deliver_date"),
                order_define_date=request.data.get("order_define_date"),
                description=request.data.get("description"),
                urgent=request.data.get("urgent", False),
                issue=issue_bytes,
                solution=solution_bytes,
                user_id_1C=kontragent
            )

            # --- Серії ---
            series_list = request.data.get("series", "[]")
            if isinstance(series_list, str):
                series_list = json.loads(series_list)

            for serie in series_list:
                try:
                    serie_bytes = base64.b64decode(serie["serie_link"])
                    serie_name = serie.get("serie_name")
                    ComplaintOrderSeries.objects.create(
                        complaint=complaint,
                        serie_link=serie_bytes,
                        serie_name=serie_name
                    )
                except Exception:
                    continue

            # --- Фото (новий варіант: зберігаємо на сервері) ---
            photos = request.FILES.getlist("photos")
            for photo_file in photos:
                # Кастимо user_id_1C у GUID для назви папки
                user_guid = str(uuid.UUID(bytes=kontragent)) if kontragent else "unknown_user"
                order_number = str(complaint.order_number)
                
                # Формуємо шлях: MEDIA_ROOT/complaint/<user_guid>/<order_number>/
                upload_path = os.path.join("complaint", user_guid, order_number)
                fs = FileSystemStorage(
                    location=os.path.join(settings.MEDIA_ROOT, upload_path),
                    base_url=os.path.join(settings.MEDIA_URL, upload_path)
                )
                
                # Отримуємо унікальне ім'я файлу, щоб не перезаписати існуючий
                filename = fs.get_available_name(photo_file.name)
                
                # Зберігаємо файл
                fs.save(filename, photo_file)
                
                # Отримуємо URL файлу
                file_url = fs.url(filename)

                # Зберігаємо в базу посилання на файл
                ComplaintPhoto2.objects.create(
                    complaint=complaint,
                    photo=os.path.join(upload_path, filename),
                    name=photo_file.name
                )


            return Response(
                {"success": True, "complaint_id": complaint.id},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
import base64

@api_view(['GET'])
def get_complaint_series_by_order(request, order_number):
    """
    Викликає процедуру GetComplaintSeriesByOrder по номеру замовлення і контрагенту
    і повертає серії номенклатури.
    Серії повертаються у base64-форматі.
    """
    try:
        user = request.user
        kontragent = getattr(user, "user_id_1C", None)
        if not kontragent:
            return Response({"error": "Контрагент не знайдено для користувача"}, status=400)

        with connection.cursor() as cursor:
            cursor.execute(
                "EXEC dbo.GetComplaintSeriesByOrder @OrderNumber=%s, @Контрагент=%s",
                [order_number, kontragent]
            )

            columns = [col[0] for col in cursor.description]
            results = []

            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                
                # Перетворюємо VARBINARY(16) у base64 рядок
                series_link = row_dict.get("SeriesLink")
                if series_link:
                    row_dict["SeriesLink"] = base64.b64encode(series_link).decode('ascii')
                
                results.append(row_dict)

        # Якщо масив порожній, повертаємо null
        return Response({"series": results if results else None})

    except Exception as e:
        return Response({"error": str(e)}, status=500)



from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class GetComplaintsFullView(APIView):
    """
    Виклик процедури GetComplaintsFull
    """

    def get(self, request):
        # Отримуємо прапорець
        with_dealer = request.query_params.get("with_dealer", "false").lower() == "true"

        if with_dealer:
            user = request.user
            dealer = getattr(user, "user_id_1C", None)
        else:
            dealer = None

        with connection.cursor() as cursor:
            cursor.execute("EXEC [dbo].[GetComplaintsFull] @Dealer = %s", [dealer])

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = [dict(zip(columns, row)) for row in rows]

        return Response(data, status=status.HTTP_200_OK)


# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from .models import ComplaintPhoto2
# from .serializers import ComplaintPhotoSerializer

# @api_view(["GET"])
# def get_complaint_photos(request, complaint_id):
#     photos = ComplaintPhoto.objects.filter(complaint_id=complaint_id)
#     serializer = ComplaintPhotoSerializer(photos, many=True)
#     return Response(serializer.data)
@api_view(['GET'])
def get_complaint_photos2(request, complaint_id):
    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=404)

    photos = [
        {"id": p.id, "url": request.build_absolute_uri(p.photo.url)}
        for p in complaint.complaint_photos2.all()  # related_name для ComplaintPhoto2
    ]

    return Response({"photos": photos})