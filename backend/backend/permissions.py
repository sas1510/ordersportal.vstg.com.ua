from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Дозволяє користувачам з певними ролями (admin, manager, regional_manager) змінювати дані.
    Інші можуть тільки читати.
    """
    allowed_roles = {"admin"}

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and
            getattr(request.user, "user_type", None) in self.allowed_roles
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and
            getattr(request.user, "user_type", None) in self.allowed_roles
        )
