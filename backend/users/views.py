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
from .serializers import CustomTokenObtainPairSerializer, CompleteRegistrationSerializer, ChangePasswordSerializer
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
from backend.utils.contractor import resolve_contractor
from backend.utils.dates import clean_date, parse_date
from backend.utils.api_helpers import safe_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from backend.permissions import IsAdminJWT
from backend.users.models import UserApiKey



from drf_spectacular.utils import OpenApiResponse, OpenApiParameter

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes,
    inline_serializer,
)
from rest_framework import serializers
from backend.permissions import  IsAdminJWT, IsAuthenticatedOr1CApiKey

from drf_spectacular.utils import extend_schema, OpenApiTypes, inline_serializer
from rest_framework import serializers

User = get_user_model()

from django.contrib.auth import login
# ----------------------
# Логін
# ----------------------

@extend_schema(
    summary="Авторизація користувача (JWT)",
    description=(
        "Авторизація користувача порталу за **username + password**.\n\n"
        "📌 Повертає **JWT access token** та інформацію про користувача.\n\n"
        "🔐 **Refresh token**:\n"
        "- повертається у **HTTP-only cookie** `refresh_token`\n"
        "- використовується для оновлення access токена\n\n"
        "👤 **Ролі:** admin / manager / customer / інші"
    ),
    auth=[{"jwtAuth": []}],
    tags=["Auth"],
    exclude=True

)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh = response.data.get("refresh")
            access = response.data.get("access")

            user = CustomUser.objects.get(username=request.data["username"])
            role = user.role
            
            # login(request, user)

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

@extend_schema(exclude=True)
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer

    @extend_schema(
        summary="Оновлення access-токена",
        description=(
            "Оновлює **access JWT token** на основі **refresh token**, "
            "який передається **через HTTP-only cookie**.\n\n"
            "📌 **ВАЖЛИВО:**\n"
            "- refresh token **НЕ передається в body**\n"
            "- він має бути присутній у cookie `refresh_token`\n\n"
            "🔐 **Доступ:**\n"
            "- Без Authorization header\n"
            "- refresh token з cookie\n\n"
            "📤 **Повертає:**\n"
            "- новий access token"
        ),
        request=None,
        responses={
            200: inline_serializer(
                name="TokenRefreshResponse",
                fields={
                    "access": serializers.CharField(
                        help_text="Новий JWT access token"
                    )
                },
            ),
            401: inline_serializer(
                name="TokenRefreshUnauthorized",
                fields={
                    "detail": serializers.CharField()
                },
            ),
        },
        tags=["Auth"],
        auth=[],  # ❗ спеціально — без Bearer
    )
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
        return Response({"access": access})

# ----------------------
# Логаут
# ----------------------

@extend_schema(exclude=True)
class LogoutView(APIView):
    @extend_schema(
        summary="Вихід з системи (Logout)",
        description=(
            "Завершує сесію користувача.\n\n"
            "📌 Логіка:\n"
            "- refresh token береться з **HTTP-only cookie** `refresh_token`\n"
            "- refresh token додається у **blacklist** (якщо валідний)\n"
            "- cookie `refresh_token` видаляється\n\n"
            "🔐 **Доступ:**\n"
            "- тільки JWT-авторизований користувач\n\n"
            "⚠️ Access token не передається в body — лише в header `Authorization`."
        ),
        tags=["Auth"],
        auth=[{"jwtAuth": []}],
    )
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Токен вже недійсний або в чорному списку
                pass
        # Очищаємо cookie
        resp = Response(status=status.HTTP_205_RESET_CONTENT)
        resp.delete_cookie("refresh_token")
        # resp.delete_cookie("sessionid")
        # resp.delete_cookie("csrftoken")
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

# @extend_schema_view(
#     get=extend_schema(
#         tags=["Auth"],
#         summary="Отримати дані для завершення реєстрації",
#         description="""
# Повертає дані користувача, повʼязаного з invite-кодом.

# ### Логіка:
# - invite має існувати
# - invite не використаний
# - invite дійсний 24 години
# - користувач уже існує в системі

# Використовується для заповнення форми завершення реєстрації.
# """,
#         parameters=[
#             OpenApiParameter(
#                 name="code",
#                 type=OpenApiTypes.STR,
#                 location=OpenApiParameter.PATH,
#                 description="Invite-код з посилання",
#                 required=True,
#             ),
#         ],
#         responses={
#             200: OpenApiResponse(
#                 response=CompleteRegistrationSerializer,
#                 description="Дані користувача для реєстрації",
#             ),
#             404: OpenApiResponse(description="Invalid invite code або user not found"),
#             400: OpenApiResponse(description="Invite неактивний або вже використаний"),
#         },
#     ),
#     post=extend_schema(
#         tags=["Auth"],
#         summary="Завершити реєстрацію за invite-кодом",
#         description="""
# Завершує реєстрацію користувача за invite-посиланням.

# ### Дії:
# - валідація даних
# - збереження користувача
# - позначення invite як використаного

# Після успішного виконання invite стає недійсним.
# """,
#         parameters=[
#             OpenApiParameter(
#                 name="code",
#                 type=OpenApiTypes.STR,
#                 location=OpenApiParameter.PATH,
#                 description="Invite-код з посилання",
#                 required=True,
#             ),
#         ],
#         request=CompleteRegistrationSerializer,
#         responses={
#             200: OpenApiResponse(
#                 response=CompleteRegistrationSerializer,
#                 description="Реєстрація завершена",
#             ),
#             400: OpenApiResponse(description="Помилка валідації"),
#             404: OpenApiResponse(description="Invalid invite code або user not found"),
#         },
#     ),
#     exclude=True
# )
@extend_schema(exclude=True)
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


@extend_schema(
    summary="Отримати список клієнтів",
    description=(
        "Повертає список **клієнтів порталу**.\n\n"
        "🔐 **Доступ:**\n"
        "- **JWT авторизація обовʼязкова**\n"
        "- Тільки для користувачів з роллю **manager / admin** (логіка контролю доступу)\n\n"
        "📌 Використовується, наприклад, для вибору клієнта менеджером."
    ),
    tags=["Auth"],  # 👈 ТЕГ AUTH
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customers(request):
    """
    Повертає список клієнтів для менеджера
    """
    # 'role' є в новій моделі
    customers = User.objects.filter(role='customer').values('id', 'full_name')
    return Response(list(customers))



@extend_schema(
    summary="Баланс контрагента (Customer)",
    description=(
        "Повертає баланс контрагента для поточного авторизованого користувача.\n\n"
        "🔐 Доступ:\n"
        "- лише JWT авторизований користувач\n"
        "- роль користувача **customer**\n\n"
        "📌 Дані беруться з:\n"
        "- request.user.user_id_1C\n"
        "- збереженої процедури **GetDealerAdvanceBalance**"
    ),
    
    auth=[{"jwtAuth": []}],
    tags=["Auth"],
    exclude=True
)
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


@extend_schema(
    tags=["users"],
    auth=[{"jwtAuth":[]}],
    exclude=True
)
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




from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group


## Функція для Клієнта (потрібен старий пароль)
@extend_schema(
    tags=["Auth"],  # 👈 AUTH TAG
    summary="Change password",
    description=(
        "Дозволяє авторизованому користувачу змінити свій пароль. "
        "Потрібно вказати поточний пароль."
    ),
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(
            description="Пароль успішно змінено",
            response={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "example": "success"
                    },
                    "message": {
                        "type": "string",
                        "example": "Пароль успішно змінено."
                    }
                }
            }
        ),
        400: OpenApiResponse(
            description="Невірний пароль або некоректні дані"
        ),
        401: OpenApiResponse(
            description="Користувач не авторизований"
        ),
        500: OpenApiResponse(
            description="Помилка сервера"
        ),
    },
    auth=[
        {"jwtAuth": []}
    ],
    exclude=True
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_client(request):
    """
    Дозволяє авторизованому користувачу змінити свій пароль,
    вимагаючи введення поточного пароля.
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not all([old_password, new_password]):
        return Response(
            {"error": "Потрібні обидва поля: old_password та new_password."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(old_password):
        return Response(
            {"error": "Невірний поточний пароль."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user.set_password(new_password)
        user.save()
        return Response(
            {"status": "success", "message": "Пароль успішно змінено."},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": f"Помилка при збереженні нового пароля: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



    ## Функція для Адміністратора (не потрібен старий пароль)

@extend_schema(
    summary="Змінити пароль користувачу (ADMIN)",
    description=(
        "Дозволяє **адміністратору** змінити пароль іншому користувачу.\n\n"
        "🔐 **Доступ:**\n"
        "- Тільки **JWT**\n"
        "- Тільки користувач з роллю **admin**\n\n"
        "📌 Пароль передається у тілі запиту.\n"
        "Поточний пароль користувача **не потрібен**."
    ),
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID користувача, якому змінюється пароль",
            required=True,
        ),
    ],
    request=inline_serializer(
        name="AdminChangePasswordRequest",
        fields={
            "password": serializers.CharField(
                min_length=6,
                help_text="Новий пароль користувача"
            )
        },
    ),
    responses={
        200: inline_serializer(
            name="AdminChangePasswordSuccess",
            fields={
                "detail": serializers.CharField(
                    help_text="Результат виконання операції"
                )
            },
        ),
        400: inline_serializer(
            name="AdminChangePasswordBadRequest",
            fields={
                "detail": serializers.CharField()
            },
        ),
        403: inline_serializer(
            name="AdminChangePasswordForbidden",
            fields={
                "detail": serializers.CharField()
            },
        ),
        404: inline_serializer(
            name="AdminChangePasswordNotFound",
            fields={
                "detail": serializers.CharField()
            },
        ),
    },
    tags=["users"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
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



@extend_schema(
    summary="Отримати список користувачів (ADMIN)",
    description=(
        "Повертає список **всіх користувачів порталу** з основними даними.\n\n"
        "🔐 **Доступ:**\n"
        "- Тільки **JWT**\n"
        "- Тільки користувач з роллю **admin**\n\n"
        "📌 Дані включають:\n"
        "- логін\n"
        "- ПІБ\n"
        "- email\n"
        "- роль\n"
        "- статус активності\n"
        "- телефон\n"
        "- дату завершення доступу"
    ),
    responses={
        200: inline_serializer(
            name="GetAllUsersResponse",
            fields={
                "users": serializers.ListField(
                    child=inline_serializer(
                        name="UserListItem",
                        fields={
                            "id": serializers.IntegerField(),
                            "username": serializers.CharField(),
                            "full_name": serializers.CharField(allow_null=True),
                            "email": serializers.EmailField(allow_null=True),
                            "role": serializers.CharField(),
                            "is_active": serializers.BooleanField(),
                            "phone_number": serializers.CharField(allow_null=True),
                            "expire_date": serializers.DateTimeField(allow_null=True),
                        },
                    )
                )
            },
        ),
        403: inline_serializer(
            name="GetAllUsersForbidden",
            fields={
                "detail": serializers.CharField()
            },
        ),
    },
    tags=["users"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
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

@extend_schema(
    summary="Редагувати користувача (ADMIN)",
    description=(
        "Оновлює дані користувача порталу.\n\n"
        "🔐 **Доступ:**\n"
        "- Тільки **JWT**\n"
        "- Тільки користувач з роллю **admin**\n\n"
        "✏️ Можна змінювати:\n"
        "- логін, ПІБ, email, телефон\n"
        "- роль користувача\n"
        "- дату завершення доступу (**expire_date**)\n"
        "- активність (**is_active**)\n"
        "- доступ до фінансової інформації\n"
        "- старий ID порталу\n\n"
        "📌 Формат дати: **YYYY-MM-DD**"
    ),
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID користувача, якого потрібно відредагувати",
            required=True,
        ),
    ],
    request=inline_serializer(
        name="AdminEditUserRequest",
        fields={
            "username": serializers.CharField(required=False),
            "full_name": serializers.CharField(required=False, allow_blank=True),
            "email": serializers.EmailField(required=False, allow_blank=True),
            "phone_number": serializers.CharField(required=False, allow_blank=True),
            "role": serializers.ChoiceField(
                choices=["admin", "manager", "region_manager", "customer"],
                required=False,
            ),
            "expire_date": serializers.DateField(
                required=False,
                help_text="Дата завершення доступу (YYYY-MM-DD)",
            ),
            "is_active": serializers.BooleanField(required=False),
            "permit_finance_info": serializers.BooleanField(required=False),
            "old_portal_id": serializers.CharField(required=False, allow_blank=True),
        },
    ),
    responses={
        200: inline_serializer(
            name="AdminEditUserSuccess",
            fields={
                "detail": serializers.CharField(),
                "user": inline_serializer(
                    name="EditedUser",
                    fields={
                        "id": serializers.IntegerField(),
                        "username": serializers.CharField(),
                        "full_name": serializers.CharField(allow_null=True),
                        "email": serializers.EmailField(allow_null=True),
                        "phone_number": serializers.CharField(allow_null=True),
                        "role": serializers.CharField(),
                        "expire_date": serializers.DateTimeField(allow_null=True),
                        "is_active": serializers.BooleanField(),
                        "permit_finance_info": serializers.BooleanField(),
                        "old_portal_id": serializers.CharField(allow_null=True),
                    },
                ),
            },
        ),
        400: inline_serializer(
            name="AdminEditUserBadRequest",
            fields={
                "error": serializers.CharField()
            },
        ),
        403: inline_serializer(
            name="AdminEditUserForbidden",
            fields={
                "detail": serializers.CharField()
            },
        ),
        404: inline_serializer(
            name="AdminEditUserNotFound",
            fields={
                "detail": serializers.CharField()
            },
        ),
    },
    tags=["users"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
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

@extend_schema(
    summary="Деактивувати користувача (ADMIN)",
    description=(
        "Деактивує користувача порталу шляхом встановлення **is_active = false**.\n\n"
        "🔐 **Доступ:**\n"
        "- Тільки **JWT**\n"
        "- Тільки користувач з роллю **admin**\n\n"
        "📌 Користувач залишається в системі, але не може авторизуватися.\n"
        "📌 Дані користувача повертаються у відповіді."
    ),
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID користувача, якого потрібно деактивувати",
            required=True,
        ),
    ],
    responses={
        200: inline_serializer(
            name="AdminDeactivateUserSuccess",
            fields={
                "detail": serializers.CharField(
                    help_text="Результат виконання операції"
                ),
                "user": inline_serializer(
                    name="DeactivatedUser",
                    fields={
                        "id": serializers.IntegerField(),
                        "username": serializers.CharField(),
                        "full_name": serializers.CharField(allow_null=True),
                        "email": serializers.EmailField(allow_null=True),
                        "role": serializers.CharField(),
                        "is_active": serializers.BooleanField(),
                        "expire_date": serializers.DateField(allow_null=True),
                    },
                ),
            },
        ),
        403: inline_serializer(
            name="AdminDeactivateUserForbidden",
            fields={
                "detail": serializers.CharField()
            },
        ),
        404: inline_serializer(
            name="AdminDeactivateUserNotFound",
            fields={
                "detail": serializers.CharField()
            },
        ),
    },
    tags=["users"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
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


@extend_schema(
    summary="Отримати поточного користувача",
    description=(
        "Повертає інформацію про **поточного авторизованого користувача порталу**.\n\n"
        "🔐 **Доступ:**\n"
        "- тільки **JWT (Bearer token)**\n\n"
        "📌 Використовується фронтендом для:\n"
        "- визначення ролі користувача\n"
        "- отримання GUID контрагента (1C)\n"
        "- ініціалізації сесії\n"
    ),
    responses={
        200: inline_serializer(
            name="CurrentUserResponse",
            fields={
                "id": serializers.IntegerField(help_text="ID користувача в порталі"),
                "username": serializers.CharField(help_text="Логін користувача"),
                "full_name": serializers.CharField(help_text="Повне імʼя користувача"),
                "role": serializers.CharField(help_text="Роль користувача (admin, manager, customer тощо)"),
                "user_id_1c": serializers.UUIDField(
                    allow_null=True,
                    help_text="GUID контрагента в 1C (може бути null)"
                ),
            },
        ),
        401: OpenApiTypes.OBJECT,
    },
    tags=["Auth"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
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


@extend_schema(
    summary="Користувачі порталу дилерів",
    description=(
        "Повертає список **користувачів порталу дилерів**.\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetDealerPortalUsers**.\n\n"
        "🧾 Поле **ContractorID** повертається у форматі **GUID** (string).\n\n"
        "🔐 **Доступ:**\n"
        "- **Admin (JWT)**\n"
        "- **1C API Key**\n\n"
        "❗ Перевірка прав доступу виконується виключно через permission "
        "**IsAdminJWTOr1CApiKey**."
    ),
    tags=["Dealer information"],
    auth=[
        {"jwtAuth": []}
    ],
    exclude=True
)
@api_view(["GET"])
@permission_classes([IsAdminJWT])
def get_dealer_portal_users(request):
    # ❌ НІЯКИХ request.user.role тут

    with connection.cursor() as cursor:
        cursor.execute("EXEC dbo.GetDealerPortalUsers")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

    data = []
    for row in rows:
        record = dict(zip(columns, row))
        if record.get("ContractorID"):
            record["ContractorID"] = bin_to_guid_1c(record["ContractorID"])
        data.append(record)

    return Response(data)




from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

@extend_schema(
    summary="Отримати адреси дилера (розширені)",
    description=(
        "Повертає **адреси дилера** (доставка / юридичні / інші) "
        "у розширеному та **розпарсеному вигляді**.\n\n"
        "📌 Дані беруться з SQL-процедури **dbo.GetDealerAddressesParsed**.\n\n"
        "🔐 **Доступ:**\n"
        "- JWT:\n"
        "  - admin → можуть передати contractor\n"
        "  - dealer → тільки свій контрагент\n"
        "- 1C API Key → автоматично по UserId1C\n\n"
        "📥 **Параметри:**\n"
        "- `contractor` — GUID контрагента "
        "(обовʼязковий ТІЛЬКИ для admin )"
    ),
    parameters=[
        OpenApiParameter(
            name="contractor",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            required=False,
            description="GUID контрагента (тільки для admin )",
        ),
    ],
    tags=["Dealer information"],
    auth=[
        {"jwtAuth": []},
        {"ApiKeyAuth": []},
    ],

)
@api_view(["GET"])
@permission_classes([IsAuthenticatedOr1CApiKey])
@safe_view
def get_dealer_addresses_change(request):
    """
    Повертає адреси дилера (розширені)
    з процедури dbo.GetDealerAddressesParsed
    """

    # -------------------------------------------------
    # 🔐 CONTRACTOR (ЄДИНА ТОЧКА ІСТИНИ)
    # -------------------------------------------------
    contractor_bin, _ = resolve_contractor(
        request,
        allow_admin=True,
        admin_param="contractor",
    )

    # -------------------------------------------------
    # 📦 SQL
    # -------------------------------------------------
    with connection.cursor() as cursor:
        cursor.execute(
            """
            EXEC dbo.GetDealerAddressesParsed
                @ContractorLink = %s
            """,
            [contractor_bin]
        )

        columns = [c[0] for c in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor.fetchall()]

    return Response({
        "success": True,
        "addresses": rows
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime
import secrets

from backend.permissions import IsAdminJWT
from backend.users.models import UserApiKey, CustomUser

@extend_schema(exclude=True)
@api_view(["POST"])
@permission_classes([IsAdminJWT])
def create_api_key(request):
    """
    ADMIN генерує API-key для вибраного дилера
    """
    dealer_id = request.data.get("user_id")
    name = request.data.get("name", "API access")
    expire_date_raw = request.data.get("expire_date")  # 👈 ISO date

    if not dealer_id or not expire_date_raw:
        return Response(
            {"detail": "user_id and expire_date are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        dealer = CustomUser.objects.get(id=dealer_id, role="customer")
    except CustomUser.DoesNotExist:
        return Response(
            {"detail": "Dealer not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        # очікуємо YYYY-MM-DD
        expire_date = datetime.strptime(expire_date_raw, "%Y-%m-%d")
        expire_date = timezone.make_aware(expire_date)
    except ValueError:
        return Response(
            {"detail": "expire_date must be in YYYY-MM-DD format"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if expire_date <= timezone.now():
        return Response(
            {"detail": "expire_date must be in the future"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    api_key_value = secrets.token_urlsafe(32)

    key = UserApiKey.objects.create(
        api_key=api_key_value,
        name=name,
        is_active=True,
        expire_date=expire_date,
        created_by=request.user,  # admin
        user=dealer,              # dealer
    )

    return Response(
        {
            "id": key.id,
            "api_key": api_key_value,   # ⚠️ показати один раз
            "expire_date": key.expire_date.date(),
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(exclude=True)
@api_view(["GET"])
@permission_classes([IsAdminJWT])
def list_user_api_keys(request, user_id):
    keys = UserApiKey.objects.filter(user_id=user_id).order_by("-created_at")

    return Response({
        "keys": [
            {
                "id": k.id,
                "name": k.name,
                "key" : k.api_key,
                "is_active": k.is_active,
                "expire_date": k.expire_date.date().isoformat(),
            }
            for k in keys
        ]
    })




# admin_api_keys/views.py

@extend_schema(exclude=True)
@api_view(["POST"])
@permission_classes([IsAdminJWT])
def deactivate_api_key(request, key_id):
    try:
        key = UserApiKey.objects.get(id=key_id)
    except UserApiKey.DoesNotExist:
        return Response(
            {"detail": "API key not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not key.is_active:
        return Response(
            {"detail": "API key already inactive"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    key.is_active = False
    key.save(update_fields=["is_active"])

    return Response(
        {"detail": "API key deactivated"},
        status=status.HTTP_200_OK,
    )

def get_contractor_guid_from_db(user):
    """
    Повертає GUID контрагента з бази по користувачу.
    """
    if not user.user_id_1C:
        return None

    # Припустимо, у тебе є функція для конвертації binary → GUID 1С
    return bin_to_guid_1c(user.user_id_1C)


# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_dealer_address_coords(request):
    """
    Приймає дані адреси від фронтенду і повертає їх у форматі для 1С.
    """
    user = request.user
    data = request.data

    # Замість data.get("contractorGuid")
    contractor_guid = get_contractor_guid_from_db(user)

    required_fields = ["house", "latitude", "longitude"]
    for f in required_fields:
        if f not in data or data[f] in [None, ""]:
            return Response({"error": f"Поле {f} обов'язкове"}, status=status.HTTP_400_BAD_REQUEST)

    # Переформатуємо координати
    coordinates = {
        "latitude": data["latitude"],
        "longitude": data["longitude"]
    }

    # Формуємо об'єкт для відправки в 1С
    address_for_1c = {
        "contractorGuid": contractor_guid,
        "addressKindGUID": data.get("addressKindGUID")or None,
        "region": data.get("region", ""),
        "district": data.get("district", ""),
        "city": data.get("city", ""),
        "street": data.get("street", ""),
        "house": data.get("house", ""),
        "apartment": data.get("apartment", ""),
        "entrance": data.get("entrance", ""),
        "floor": data.get("floor", ""),
        "note": data.get("note", ""),
        "coordinates": coordinates
    }

    # Тут можна викликати функцію, яка відправляє дані в 1С
    # send_to_1c(address_for_1c)

    return Response({"success": True, "address": address_for_1c})
