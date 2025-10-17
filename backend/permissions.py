from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS



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
