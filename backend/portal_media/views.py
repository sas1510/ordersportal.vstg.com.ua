from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import MediaResource
from .serializers import MediaResourceSerializer
from .permissions import IsAdminOrReadOnly
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
            "Повертає список медіа-ресурсів порталу.\n\n"
            "🔎 **Фільтрація:**\n"
            "- `?resource_type=file` — тільки файли\n"
            "- `?types=youtube,tiktok` — фільтр за кількома типами\n"
            "- `?category_id=1` — фільтр за конкретною категорією\n"
        ),
        parameters=[
            OpenApiParameter(name="resource_type", type=OpenApiTypes.STR, description="Тип ресурсу"),
            OpenApiParameter(name="types", type=OpenApiTypes.STR, description="Типи через кому"),
            OpenApiParameter(name="category_id", type=OpenApiTypes.INT, description="ID категорії"),
        ],
        tags=["media-resources"],
    )
)
class MediaResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для керування всіма медіа-ресурсами (Відео, Файли) з підтримкою категорій.
    """
    serializer_class = MediaResourceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        # Додаємо select_related('category'), щоб підтягнути дані категорії одним запитом
        queryset = MediaResource.objects.select_related('category', 'author').all().order_by('-created_at')
        
        # 1. Фільтр за категорією
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # 2. Фільтр для ОДНОГО типу
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
            
        # 3. Фільтр для КІЛЬКОХ типів
        types = self.request.query_params.get('types')
        if types:
            type_list = types.split(',')
            queryset = queryset.filter(resource_type__in=type_list)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def handle_exception(self, exc):
        response = super().handle_exception(exc)
        if response and response.status_code == 403:
            response.data = {
                "detail": "Доступ заборонено. Тільки адміністратори та менеджери можуть виконувати цю дію."
            }
        return response