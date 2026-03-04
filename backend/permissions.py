from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.conf import settings


class IsAdminManagerOrReadOnly(BasePermission):
    """
    Дозволяє всім перегляд (GET, HEAD, OPTIONS),
    а зміни (POST, PUT, PATCH, DELETE) лише користувачам, 
    які належать до груп 'admin' або 'manager'.
    """
    allowed_groups = {"admin", "manager"}  # Можна додати 'regional_manager' якщо потрібно

    def has_permission(self, request, view):
        # Безпечні методи доступні всім
        if request.method in SAFE_METHODS:
            return True
        
        # Для POST/PUT/PATCH/DELETE перевіряємо групи
        return (
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name__in=self.allowed_groups).exists()
        )

    def has_object_permission(self, request, view, obj):
        # Для окремого об'єкта застосовуємо ту ж логіку
        return self.has_permission(request, view)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Дозволяє читання (GET, HEAD, OPTIONS) усім користувачам.
    Дозволяє запис (POST, PUT, DELETE) лише адміністраторам (role='admin').
    """
    def has_permission(self, request, view):
        # Дозвіл на читання для будь-якого запиту (включно з анонімним)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Дозвіл на запис лише для автентифікованих адміністраторів
        # Перевіряємо, чи користувач автентифікований (request.user.is_authenticated)
        # та чи його роль 'admin'
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')



# permissions.py
from rest_framework.permissions import BasePermission
from django.conf import settings
import secrets


class Is1CApiKey(BasePermission):
    """
    Дозволяє доступ тільки при наявності валідного API key від 1С
    Заголовок:
        X-API-KEY: <uuid>
    """

    def has_permission(self, request, view):
        api_key = request.headers.get("X-API-KEY")

        if not api_key:
            return False

        api_key = api_key.strip().lower()

        allowed_keys = [
            key.strip().lower()
            for key in getattr(settings, "ONE_C_API_KEYS", [])
            if key
        ]

        for valid_key in allowed_keys:
            if secrets.compare_digest(api_key, valid_key):
                return True

        return False


from rest_framework.authentication import BaseAuthentication
from django.conf import settings
import secrets


class OneCApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            return None  # 🔴 ВАЖЛИВО: не raise!

        api_key = api_key.strip().lower()

        allowed_keys = [
            key.strip().lower()
            for key in settings.ONE_C_API_KEYS
        ]

        for valid_key in allowed_keys:
            if secrets.compare_digest(api_key, valid_key):
                return (None, None)  # ← authentication OK

        return None

from rest_framework.permissions import BasePermission


class IsAdminJWTOr1CApiKey(BasePermission):

    def has_permission(self, request, view):

        # 🔑 1C API KEY — дозволено
        if request.auth == "1C_API_KEY":
            return True

        # 🔐 JWT admin
        if request.user and request.user.is_authenticated:
            return request.user.role == "admin"

        return False
    

    


# backend/permissions.py
from rest_framework.permissions import BasePermission


class IsAuthenticatedOr1CApiKey(BasePermission):
    """
    Доступ:
    - будь-який JWT-користувач
    - або API KEY (1C)
    """

    def has_permission(self, request, view):

        # 🔐 JWT (будь-який користувач)
        if request.user and request.user.is_authenticated:
            return True

        # 🔑 API KEY (1C)
        if request.auth == "1C_API_KEY":
            return True

        return False


class ApiKey1С(BasePermission):
    """
    Доступ:
    - будь-який JWT-користувач
    - або API KEY (1C)
    """

    def has_permission(self, request, view):

        # 🔐 JWT (будь-який користувач)
        if request.user and request.user.is_authenticated:
            return True

        # 🔑 API KEY (1C)
        if request.auth == "1C_API_KEY":
            return True

        return False



from rest_framework.permissions import BasePermission


class IsAdminJWT(BasePermission):
    """
    Доступ ТІЛЬКИ для JWT admin
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )
