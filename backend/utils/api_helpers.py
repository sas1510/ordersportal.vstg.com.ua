# backend/utils/api_helpers.py
from rest_framework.response import Response


def safe_view(func):
    """
    Обгортає view та красиво ловить помилки
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except PermissionError as e:
            return Response({"detail": str(e)}, status=403)
    return wrapper


