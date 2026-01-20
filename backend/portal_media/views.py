# media/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import MediaResource
from .serializers import MediaResourceSerializer
from .permissions import IsAdminOrReadOnly # Імпортуємо наш дозвіл
from drf_spectacular.utils import (
    extend_schema_view,
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)


@extend_schema_view(
    list=extend_schema(
        summary="Отримати список медіа-ресурсів",
        description=(
            "Повертає список **медіа-ресурсів порталу** (відео або файли).\n\n"
            "🔎 **Фільтрація:**\n"
            "- `?resource_type=file` — тільки файли\n"
            "- `?types=youtube` —  тип відео\n\n"
            "🔐 **Доступ:**\n"
            "- GET — всі авторизовані користувачі\n"
            "- POST/PUT/DELETE — тільки адміністратори / менеджери"
        ),
        parameters=[
            OpenApiParameter(
                name="resource_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Тип ресурсу (file, youtube)",
                required=False,
            ),
            OpenApiParameter(
                name="types",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Кілька типів через кому (youtube)",
                required=False,
            ),
        ],
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),

    retrieve=extend_schema(
        summary="Отримати медіа-ресурс",
        description="Повертає детальну інформацію про один медіа-ресурс.",
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),

    create=extend_schema(
        summary="Створити медіа-ресурс",
        description=(
            "Створює новий медіа-ресурс (відео або файл).\n\n"
            "🔐 **Доступ:** тільки адміністратори\n\n"
            "👤 Автор визначається автоматично з поточного користувача."
        ),
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),

    update=extend_schema(
        summary="Оновити медіа-ресурс",
        description="Повністю оновлює медіа-ресурс.",
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),

    partial_update=extend_schema(
        summary="Частково оновити медіа-ресурс",
        description="Оновлює окремі поля медіа-ресурсу.",
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),

    destroy=extend_schema(
        summary="Видалити медіа-ресурс",
        description="Видаляє медіа-ресурс.",
        tags=["media-resources"],
        auth=[{"jwtAuth": []}],
    ),
)
class MediaResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для керування всіма медіа-ресурсами 
    (Відео, Файли).
    """
    serializer_class = MediaResourceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """
        Повертає відфільтрований набір даних
        """
        queryset = MediaResource.objects.all().order_by('-created_at')
        
        # 1. Фільтр для ОДНОГО типу (для сторінки Файлів)
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
            
        # 2. Фільтр для КІЛЬКОХ типів (для сторінки Відео)
        types = self.request.query_params.get('types')
        if types:
            type_list = types.split(',') # 'youtube,tiktok' -> ['youtube', 'tiktok']
            queryset = queryset.filter(resource_type__in=type_list)
            
        return queryset

    def perform_create(self, serializer):
        """
        При створенні автоматично призначаємо автором поточного користувача.
        """
        serializer.save(author=self.request.user)

    def handle_exception(self, exc):
        """
        Кастомна обробка помилки 403 (Заборонено).
        """
        response = super().handle_exception(exc)
        if response.status_code == 403:
            response.data = {
                "detail": "Доступ заборонено. Тільки адміністратори та менеджери можуть виконувати цю дію."
            }
        return response
    


    