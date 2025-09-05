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
# ----------------------
# Логін
# ----------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Отримуємо refresh токен
            refresh = response.data.get("refresh")
            access = response.data.get("access")
            user = CustomUser.objects.get(username=request.data["username"])
            role = user.role

            update_last_login(None, user)


            # Встановлюємо refresh токен в HttpOnly cookie
            resp = Response(
                {
                    "access": access,
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
                secure=False,  # True у production з HTTPS
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
        # Беремо refresh токен з cookie
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        
        access = serializer.validated_data.get("access")
        return Response({"access": access}, status=status.HTTP_200_OK)

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
class CurrentUserView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
            },
            "role": user.role,
        })



# ----------------------
# Завершення реєстрації через інвайт
# ----------------------
# users/views.py
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'POST'])
def register_with_invite(request, code):
    # code_clean = code.replace('-', '').lower()

    try:
        invite = Invitation.objects.get(code__iexact=code)
    except Invitation.DoesNotExist:
        return Response({"error": "Invalid invite code"}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.now()

    # Перевірка, чи інвайт вже використано або прострочено
    if invite.used:
        return Response({"error": "Це посилання вже використано"}, status=status.HTTP_400_BAD_REQUEST)
    if invite.expire_at and invite.expire_at < now:
        return Response({"error": "Це посилання більше не активне"}, status=status.HTTP_400_BAD_REQUEST)

    # GET: повертаємо дані користувача для форми
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CompleteRegistrationSerializer(user)
        return Response(serializer.data)

    # POST: оновлюємо дані користувача
    if request.method == 'POST':
        try:
            user = CustomUser.objects.get(user_id_1C=invite.user_id_1C)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CompleteRegistrationSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # позначаємо інвайт як використаний
            invite.mark_as_used()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
