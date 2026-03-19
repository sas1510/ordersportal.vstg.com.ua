# media/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    """
    Дозволяє всім перегляд (GET), але змінювати (POST/PUT/DELETE) 
    можуть лише admin або manager.
    """
    def has_permission(self, request, view):
        # Якщо запит безпечний (GET, HEAD, OPTIONS) — дозволяємо всім
        if request.method in SAFE_METHODS:
            return True
        
        # Для інших методів (POST, PUT, PATCH, DELETE)
        # Перевіряємо, чи користувач автентифікований та чи є в потрібній групі
        return (
            request.user.is_authenticated and
            request.user.groups.filter(name__in=['admin', 'manager']).exists()
        )