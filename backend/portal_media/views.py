# media/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import MediaResource
from .serializers import MediaResourceSerializer
from .permissions import IsAdminOrReadOnly # Імпортуємо наш дозвіл

class MediaResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для керування всіма медіа-ресурсами 
    (Відео, TikTok, Файли).
    
    Підтримує фільтрацію:
    ?resource_type=file
    ?types=youtube,tiktok
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