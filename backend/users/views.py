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
from .models import CustomUser
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Invitation
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view
# ...existing code...
from django.contrib.auth.models import update_last_login
# ...existing code...
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db import connection
User = get_user_model()


# ----------------------
# Логін
# ----------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Отримуємо токени
            refresh = response.data.get("refresh")
            access = response.data.get("access")
            user = CustomUser.objects.get(username=request.data["username"])
            role = user.role

            update_last_login(None, user)

            # Відправляємо refresh токен в HttpOnly cookie
            resp = Response(
                {
                    "access": access,          # <-- access повертаємо в JSON
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "full_name": user.full_name,
                        "role": role,
                    },
                    "role": role,
                },
                status=status.HTTP_200_OK
            )
            resp.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=False,  # True у production
                samesite="Lax",
                max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
            )

            return resp
        return response

# ----------------------
# Рефреш токена
# ----------------------
# users/views.py
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = self.get_serializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data.get("access")
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
                pass
        # Очищаємо cookie
        resp.delete_cookie("refresh_token")
        return resp

# ----------------------
# Поточний користувач
# ----------------------
# class CurrentUserView(APIView):
#     def get(self, request):
#         user = request.user
#         if not user.is_authenticated:
#             return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
#         return Response({
#             "user": {
#                 "id": user.id,
#                 "username": user.username,
#                 "full_name": user.full_name,
#                 "role": user.role,
#             },
#             "role": user.role,
#         })
class CurrentUserView(APIView):
    # Встановлюємо, що потрібна авторизація
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

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
# users/views.py
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def register_with_invite(request, code):
    try:
        invite = Invitation.objects.get(code__iexact=code)
    except Invitation.DoesNotExist:
        return Response({"error": "Invalid invite code"}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.now()

    if invite.used:
        return Response({"error": "Це посилання вже використано"}, status=status.HTTP_400_BAD_REQUEST)
    if invite.expire_at and invite.expire_at < now:
        return Response({"error": "Це посилання більше не активне"}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CompleteRegistrationSerializer(user)
        return Response(serializer.data)

    if request.method == 'POST':
        try:
            user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CompleteRegistrationSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            invite.mark_as_used()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customers(request):
    """
    Повертає список клієнтів для менеджера
    """
    # Припускаємо, що у User є поле role
    customers = User.objects.filter(role='customer').values('id', 'full_name')
    return Response(list(customers))



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance_view(request):
    """
    Викликає збережену процедуру GetBalance @User_ID і повертає результат.
    """
    user_id = request.user.id

    if getattr(request.user, 'role', None) not in ['customer']:
        return JsonResponse({'detail': 'У вас немає прав для перегляду балансу.'}, status=403)

    with connection.cursor() as cursor:
        # Виклик збереженої процедури
        cursor.execute("EXEC dbo.GetBalance @User_ID=%s", [user_id])
        row = cursor.fetchone()  # очікуємо 1 рядок із сумою


    if not row:
        return JsonResponse({"sum": 0, "full_name": ""})

    return JsonResponse({
        "sum": row[0],        # Сума
        "full_name": row[1]   # Ім'я користувача
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_name_view(request):
    """
    Повертає ім'я поточного користувача.
    """
    full_name = getattr(request.user, 'full_name', '')  # беремо поле full_name з моделі User

    if not full_name:
        # якщо full_name відсутнє, можна взяти username
        full_name = request.user.username

    return JsonResponse({"full_name": full_name})

# ----------------------


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CustomUser, ManagerDealer

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

    if role == "admin":
        # всі дилери
        dealers = CustomUser.objects.filter(role="customer", enable=True)
    elif role == "manager":
        # тільки дилери, які прив'язані до менеджера через ManagerDealer
        assigned_ids = ManagerDealer.objects.filter(
            manager_user_id_1C=user.user_id_1C
        ).values_list("dealer_user_id_1C", flat=True)

        dealers = CustomUser.objects.filter(
            user_id_1C__in=assigned_ids, role="customer", enable=True
        )
    else:
        # інші ролі — порожній список
        dealers = CustomUser.objects.none()

    dealer_list = [
        {"id": d.id, "full_name": d.full_name or d.username}
        for d in dealers
    ]

    return Response({"dealers": dealer_list})
 