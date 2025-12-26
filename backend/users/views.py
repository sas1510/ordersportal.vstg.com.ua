# # users/views.py
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from rest_framework_simplejwt.tokens import RefreshToken, TokenError
# from rest_framework_simplejwt.exceptions import InvalidToken
# from rest_framework_simplejwt.serializers import TokenRefreshSerializer
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.views import APIView
# from django.conf import settings
# from .serializers import CustomTokenObtainPairSerializer, CompleteRegistrationSerializer
# from .models import CustomUser
# from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib import messages
# from .models import Invitation
# from django.contrib.auth.hashers import make_password
# from rest_framework.decorators import api_view
# # ...existing code...
# from django.contrib.auth.models import update_last_login
# # ...existing code...
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from django.contrib.auth import get_user_model
# from django.http import JsonResponse
# from django.db import connection
# User = get_user_model()


# # ----------------------
# # Логін
# # ----------------------
# class CustomTokenObtainPairView(TokenObtainPairView):
#     serializer_class = CustomTokenObtainPairSerializer

#     def post(self, request, *args, **kwargs):
#         response = super().post(request, *args, **kwargs)
#         if response.status_code == 200:
#             # Отримуємо токени
#             refresh = response.data.get("refresh")
#             access = response.data.get("access")
#             user = CustomUser.objects.get(username=request.data["username"])
#             role = user.role

#             update_last_login(None, user)

#             # Відправляємо refresh токен в HttpOnly cookie
#             resp = Response(
#                 {
#                     "access": access,          # <-- access повертаємо в JSON
#                     "user": {
#                         "id": user.id,
#                         "username": user.username,
#                         "full_name": user.full_name,
#                         "role": role,
#                     },
#                     "role": role,
#                 },
#                 status=status.HTTP_200_OK
#             )
#             resp.set_cookie(
#                 key="refresh_token",
#                 value=refresh,
#                 httponly=True,
#                 secure=False,  # True у production
#                 samesite="Lax",
#                 max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
#             )

#             return resp
#         return response

# # ----------------------
# # Рефреш токена
# # ----------------------
# # users/views.py
# class CustomTokenRefreshView(TokenRefreshView):
#     serializer_class = TokenRefreshSerializer

#     def post(self, request, *args, **kwargs):
#         refresh_token = request.COOKIES.get("refresh_token")
#         if not refresh_token:
#             return Response({"detail": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
        
#         serializer = self.get_serializer(data={"refresh": refresh_token})
#         serializer.is_valid(raise_exception=True)
#         access = serializer.validated_data.get("access")
#         user = request.user if request.user.is_authenticated else None
#         role = user.role if user else None
#         return Response({"access": access, "role": role})

# # ----------------------
# # Логаут
# # ----------------------
# class LogoutView(APIView):
#     def post(self, request):
#         refresh_token = request.COOKIES.get("refresh_token")
#         resp = Response(status=status.HTTP_205_RESET_CONTENT)
#         if refresh_token:
#             try:
#                 token = RefreshToken(refresh_token)
#                 token.blacklist()
#             except Exception:
#                 pass
#         # Очищаємо cookie
#         resp.delete_cookie("refresh_token")
#         return resp

# # ----------------------
# # Поточний користувач
# # ----------------------
# # class CurrentUserView(APIView):
# #     def get(self, request):
# #         user = request.user
# #         if not user.is_authenticated:
# #             return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
# #         return Response({
# #             "user": {
# #                 "id": user.id,
# #                 "username": user.username,
# #                 "full_name": user.full_name,
# #                 "role": user.role,
# #             },
# #             "role": user.role,
# #         })
# class CurrentUserView(APIView):
#     # Встановлюємо, що потрібна авторизація
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         user = request.user
#         if not user.is_authenticated:
#             return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

#         # Повертаємо потрібні дані
#         return Response({
#             "user": {
#                 "id": user.id,
#                 "username": user.username,
#                 "full_name": getattr(user, "full_name", ""),
#                 "role": getattr(user, "role", ""),
#             },
#             "role": getattr(user, "role", "")
#         })
# # ----------------------
# # Завершення реєстрації через інвайт
# # ----------------------
# # users/views.py
# from django.utils import timezone
# from rest_framework.response import Response
# from rest_framework import status

# from rest_framework.permissions import AllowAny
# from rest_framework.decorators import api_view, permission_classes

# @api_view(['GET', 'POST'])
# @permission_classes([AllowAny])
# def register_with_invite(request, code):
#     try:
#         invite = Invitation.objects.get(code__iexact=code)
#     except Invitation.DoesNotExist:
#         return Response({"error": "Invalid invite code"}, status=status.HTTP_404_NOT_FOUND)

#     # now = timezone.now()

#     if invite.created_at + timedelta(hours=24) < timezone.now():
#         return Response({"error": "Це посилання більше не активне"}, status=status.HTTP_400_BAD_REQUEST)
#     if invite.used:
#         return Response({"error": "Це посилання вже використано"}, status=status.HTTP_400_BAD_REQUEST)
#     # if invite.expire_at and invite.expire_at < now:
#     #     return Response({"error": "Це посилання більше не активне"}, status=status.HTTP_400_BAD_REQUEST)

#     if request.method == 'GET':
#         try:
#             user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
#         except CustomUser.DoesNotExist:
#             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
#         serializer = CompleteRegistrationSerializer(user)
#         return Response(serializer.data)

#     if request.method == 'POST':
#         try:
#             user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
#         except CustomUser.DoesNotExist:
#             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

#         serializer = CompleteRegistrationSerializer(user, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             invite.mark_as_used()
#             return Response(serializer.data)
        
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_customers(request):
#     """
#     Повертає список клієнтів для менеджера
#     """
#     # Припускаємо, що у User є поле role
#     customers = User.objects.filter(role='customer').values('id', 'full_name')
#     return Response(list(customers))



# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_balance_view(request):
#     """
#     Викликає збережену процедуру GetBalance @User_ID і повертає результат.
#     """
#     user_id = request.user.id

#     if getattr(request.user, 'role', None) not in ['customer']:
#         return JsonResponse({'detail': 'У вас немає прав для перегляду балансу.'}, status=403)

#     with connection.cursor() as cursor:
#         # Виклик збереженої процедури
#         cursor.execute("EXEC dbo.GetBalance @User_ID=%s", [user_id])
#         row = cursor.fetchone()  # очікуємо 1 рядок із сумою


#     if not row:
#         return JsonResponse({"sum": 0, "full_name": ""})

#     return JsonResponse({
#         "sum": row[0],        # Сума
#         "full_name": row[1]   # Ім'я користувача
#     })

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_user_name_view(request):
#     """
#     Повертає ім'я поточного користувача.
#     """
#     full_name = getattr(request.user, 'full_name', '')  # беремо поле full_name з моделі User

#     if not full_name:
#         # якщо full_name відсутнє, можна взяти username
#         full_name = request.user.username

#     return JsonResponse({"full_name": full_name})

# # ----------------------


# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

# from .models import CustomUser, ManagerDealer

# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_dealers(request):
#     """
#     Повертає список дилерів для поточного користувача.
#     - Admin бачить всіх дилерів.
#     - Manager бачить тільки своїх дилерів.
#     """
#     user = request.user
#     role = user.role

#     if role == "admin":
#         # всі дилери
#         dealers = CustomUser.objects.filter(role="customer", enable=True)
#     elif role == "manager":
#         # тільки дилери, які прив'язані до менеджера через ManagerDealer
#         assigned_ids = ManagerDealer.objects.filter(
#             manager_user_id_1C=user.user_id_1C
#         ).values_list("dealer_user_id_1C", flat=True)

#         dealers = CustomUser.objects.filter(
#             user_id_1C__in=assigned_ids, role="customer", enable=True
#         )
#     else:
#         # інші ролі — порожній список
#         dealers = CustomUser.objects.none()

#     dealer_list = [
#         {"id": d.id, "full_name": d.full_name or d.username}
#         for d in dealers
#     ]

#     return Response({"dealers": dealer_list})
 

 # users/views.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.conf import settings
from .serializers import CustomTokenObtainPairSerializer, CompleteRegistrationSerializer
from .models import CustomUser, Invitation # Імпортуємо обидві моделі
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import update_last_login
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from backend.utils.BinToGuid1C import bin_to_guid_1c



User = get_user_model()


# ----------------------
# Логін
# ----------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh = response.data.get("refresh")
            access = response.data.get("access")

            user = CustomUser.objects.get(username=request.data["username"])
            role = user.role

            update_last_login(None, user)


            user_guid_1c = bin_to_guid_1c(user.user_id_1C)

            resp = Response(
                {
                    "access": access,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "full_name": user.full_name,
                        "role": role,
                        "user_id_1c": user_guid_1c,   # ← ДОДАНО
                    },
                    "role": role,
                },
                status=status.HTTP_200_OK
            )

            resp.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=False,
                samesite="Lax",
                max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
            )

            return resp
        
        return response


# ----------------------
# Рефреш токена
# ----------------------
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = self.get_serializer(data={"refresh": refresh_token})
        
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError) as e:
             return Response({"detail": "Token is invalid or expired"}, status=status.HTTP_401_UNAUTHORIZED)

        access = serializer.validated_data.get("access")
        
        # 'request.user' тут буде доступний завдяки refresh токену
        user = request.user if request.user.is_authenticated else None
        role = user.role if user else None
        return Response({"access": access, "role": role})

# ----------------------
# Логаут
# ----------------------
class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        resp = Response(status=status.HTTP_205_RESET_CONTENT)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Токен вже недійсний або в чорному списку
                pass
        # Очищаємо cookie
        resp.delete_cookie("refresh_token")
        return resp

# ----------------------
# Поточний користувач
# ----------------------
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # is_authenticated вже перевірено permission_classes
        
        # Повертаємо потрібні дані
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": getattr(user, "full_name", ""),
                "role": getattr(user, "role", ""),
            },
            "role": getattr(user, "role", "")
        })
# ----------------------
# Завершення реєстрації через інвайт
# ----------------------
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Invitation, CustomUser
from .serializers import CompleteRegistrationSerializer


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def register_with_invite(request, code):
    # ---------- INVITE ----------
    try:
        invite = Invitation.objects.get(code__iexact=code)
    except Invitation.DoesNotExist:
        return Response(
            {"error": "Invalid invite code"},
            status=status.HTTP_404_NOT_FOUND
        )

    # ---------- CHECKS ----------
    if invite.used:
        return Response(
            {"error": "Це посилання вже використано"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if timezone.now() > invite.created_at + timedelta(hours=24):
        return Response(
            {"error": "Це посилання більше не активне"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------- USER ----------
    try:
        user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
    except CustomUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # ---------- GET ----------
    if request.method == "GET":
        serializer = CompleteRegistrationSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------- POST ----------
    serializer = CompleteRegistrationSerializer(
        user,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save()
    invite.markAsUsed()

    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customers(request):
    """
    Повертає список клієнтів для менеджера
    """
    # 'role' є в новій моделі
    customers = User.objects.filter(role='customer').values('id', 'full_name')
    return Response(list(customers))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance_view(request):
    """
    Викликає збережену процедуру GetBalance @User_ID і повертає результат.
    """
    user_id = request.user.user_id_1C

    if getattr(request.user, 'role', None) not in ['customer']:
        return JsonResponse({'detail': 'У вас немає прав для перегляду балансу.'}, status=403)

    with connection.cursor() as cursor:
        cursor.execute("EXEC dbo.GetDealerAdvanceBalance @Контрагент=%s", [user_id])
        row = cursor.fetchone() 

    if not row:
        return JsonResponse({"sum": 0, "full_name": ""})

    return JsonResponse({
        "sum": row[0],
        "full_name": row[1]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_name_view(request):
    """
    Повертає ім'я поточного користувача.
    """
    # 'full_name' є в новій моделі
    full_name = getattr(request.user, 'full_name', '') 
    if not full_name:
        full_name = request.user.username

    return JsonResponse({"full_name": full_name})

# ----------------------
# Логіка Дилерів
# ----------------------
# УВАГА: Модель 'ManagerDealer' не була надана.
# Цей код припускає, що вона існує і має поля 
# 'manager_user_id_1C' та 'dealer_user_id_1C'.

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dealers(request):
    """
    Повертає список дилерів для поточного користувача.
    - Admin бачить всіх дилерів.
    - Manager бачить тільки своїх дилерів.
    """
    user = request.user
    role = user.role

    # !!! ПОПЕРЕДЖЕННЯ: Модель 'ManagerDealer' не визначена.
    # Вам потрібно імпортувати її (напр. 'from .models import ManagerDealer')
    # для того, щоб ця логіка запрацювала.
    try:
        # Припустимо, що ManagerDealer знаходиться в тому ж 'users/models.py'
        from .models import ManagerDealer 
    except ImportError:
        if role == "manager":
             # Якщо модель не знайдена, повертаємо помилку для менеджера
             return Response(
                 {"error": "Модель ManagerDealer не налаштована на сервері."}, 
                 status=status.HTTP_501_NOT_IMPLEMENTED
             )
        # Адмін може працювати і без неї
        ManagerDealer = None 

    if role == "admin":
        # ВИПРАВЛЕНО: 'enable=True' -> 'is_active=True'
        dealers = CustomUser.objects.filter(role="customer", is_active=True)
    
    elif role == "manager" and ManagerDealer:
        # 'user_id_1C' є в новій моделі
        assigned_ids = ManagerDealer.objects.filter(
            manager_user_id_1C=user.user_id_1C
        ).values_list("dealer_user_id_1C", flat=True)

        # ВИПРАВЛЕНО: 'enable=True' -> 'is_active=True'
        dealers = CustomUser.objects.filter(
            user_id_1C__in=assigned_ids, role="customer", is_active=True
        )
    else:
        dealers = CustomUser.objects.none()

    dealer_list = [
        {"id": d.id, "full_name": d.full_name or d.username}
        for d in dealers
    ]

    return Response({"dealers": dealer_list})



from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group


## Функція для Клієнта (потрібен старий пароль)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_client(request):
    """
    Дозволяє авторизованому користувачу змінити свій пароль, 
    вимагаючи введення поточного пароля.
    
    Очікує POST-дані: {'old_password': '...', 'new_password': '...'}
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not all([old_password, new_password]):
        return Response(
            {"error": "Потрібні обидва поля: old_password та new_password."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Перевірка старого пароля
    if not user.check_password(old_password):
        return Response(
            {"error": "Невірний поточний пароль."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Встановлення нового пароля та збереження користувача
    try:
        user.set_password(new_password)
        user.save()
        return Response({"status": "success", "message": "Пароль успішно змінено."}, 
                        status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"Помилка при збереженні нового пароля: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    


    ## Функція для Адміністратора (не потрібен старий пароль)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_change_user_password(request, user_id):
    """
    Адмін змінює пароль іншому користувачу.
    """
    if request.user.role != "admin":
        return Response({"detail": "Доступ заборонено"}, status=403)

    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"detail": "Користувача не знайдено"}, status=404)

    password = request.data.get("password")
    if not password:
        return Response({"detail": "Пароль не передано"}, status=400)

    user.set_password(password)
    user.save()

    return Response({"detail": "Пароль успішно оновлено"})




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_users_view(request):
    """
    Повертає список всіх користувачів з ролями (тільки для ADMIN).
    Якщо менеджер — повертає тільки його дилерів.
    """
    user = request.user

    # --- ADMIN бачить всіх ---
    if user.role == "admin":
        users = CustomUser.objects.all().order_by("role", "full_name")

    # --- MANAGER бачить тільки своїх дилерів ---
    elif user.role == "manager":
        try:
            from .models import ManagerDealer
        except Exception:
            return Response(
                {"error": "Модель ManagerDealer не знайдена"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        assigned_ids = ManagerDealer.objects.filter(
            manager_user_id_1C=user.user_id_1C
        ).values_list("dealer_user_id_1C", flat=True)

        users = CustomUser.objects.filter(user_id_1C__in=assigned_ids)

    else:
        return Response(
            {"detail": "У вас немає прав для перегляду цього списку"},
            status=status.HTTP_403_FORBIDDEN
        )

    data = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "phone_number": u.phone_number,
            "expire_date" : u.expire_date           
        }
        for u in users
    ]

    return Response({"users": data})




from datetime import datetime
from django.utils.timezone import make_aware, get_current_timezone

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def admin_edit_user_view(request, user_id):

    if request.user.role != "admin":
        return Response({"detail": "Доступ заборонено"}, status=403)

    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"detail": "Користувача не знайдено"}, status=404)

    allowed_fields = [
        "username", "full_name", "email", "phone_number", "role",
        "expire_date", "is_active", "permit_finance_info", "old_portal_id"
    ]

    incoming = request.data.copy()

    # Checkboxes → bool
    bool_fields = ["is_active", "permit_finance_info"]
    for field in bool_fields:
        if field in incoming:
            incoming[field] = incoming[field] in ["true", "True", True, "1", 1]

    # 🔥 Робимо expire_date timezone-aware
    if "expire_date" in incoming and incoming["expire_date"]:
        try:
            # перетворюємо YYYY-MM-DD на aware datetime
            dt = datetime.strptime(incoming["expire_date"], "%Y-%m-%d")
            incoming["expire_date"] = make_aware(dt, get_current_timezone())
        except ValueError:
            return Response({"error": "Невірний формат дати"}, status=400)

    # Оновлення полів
    for field in allowed_fields:
        if field in incoming:
            setattr(user, field, incoming[field])

    user.save()

    return Response({
        "detail": "Дані користувача успішно оновлено",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "role": user.role,
            "expire_date": user.expire_date,
            "is_active": user.is_active,
            "permit_finance_info": user.permit_finance_info,
            "old_portal_id": user.old_portal_id,
        }
    })



from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def admin_deactivate_user_view(request, user_id):
    """
    Деактивація користувача (is_active = False).
    Доступ тільки для admin.
    """
    # 🔐 Перевірка прав
    if request.user.role != "admin":
        return Response({"detail": "Доступ заборонено"}, status=403)

    # 🔎 Отримуємо користувача
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"detail": "Користувача не знайдено"}, status=404)

    # 🟥 Деактивуємо
    user.is_active = False

    # Уникаємо помилок із datetime → date
    if user.expire_date and hasattr(user.expire_date, "date"):
        try:
            user.expire_date = user.expire_date.date()
        except Exception:
            pass

    user.save()

    # 📤 Відповідь
    return Response({
        "detail": "Користувача деактивовано",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "expire_date": user.expire_date,
        }
    }, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user


    user_guid_1c = bin_to_guid_1c(user.user_id_1C) if user.user_id_1C else None

    return Response({
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,

        "user_id_1c": user_guid_1c,

    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection

from backend.utils.BinToGuid1C import bin_to_guid_1c
from backend.utils.GuidToBin1C import guid_to_1c_bin

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dealer_portal_users(request):
    """
    Returns contractors who are users of the Web Portal (VS)
    Only for admin users
    """

    # 🔒 Перевірка ролі
    if request.user.role != "admin":
        return Response(
            {"detail": "Access denied. Admin role required."},
            status=status.HTTP_403_FORBIDDEN
        )

    with connection.cursor() as cursor:
        cursor.execute("EXEC dbo.GetDealerPortalUsers")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

    data = []

    for row in rows:
        record = dict(zip(columns, row))

        # ✅ Binary(1C) → GUID
        if record.get("ContractorID"):
            record["ContractorID"] = bin_to_guid_1c(
                record["ContractorID"]
            )

        data.append(record)

    return Response(data)
