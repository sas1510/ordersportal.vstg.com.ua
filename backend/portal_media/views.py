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

# import logging
import time
# logger = logging.getLogger(__name__)

from backend.utils.logging_setup import logger


@extend_schema_view(
    list=extend_schema(
        summary="Отримати список медіа-ресурсів",
        tags=["media-resources"],
    )
)
class MediaResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для медіа-ресурсів. 
    Автоматично пакує мовні поля (title_ua, url_it тощо) у JSONField.
    """
    serializer_class = MediaResourceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = MediaResource.objects.select_related('category', 'author').all().order_by('-created_at')
        
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
            
        types = self.request.query_params.get('types')
        if types:
            type_list = types.split(',')
            queryset = queryset.filter(resource_type__in=type_list)
            
        return queryset

    def _pack_localized_data(self, data):
        """
        Допоміжний метод: збирає поля типу 'title_ua', 'title_en' 
        у JSON-структуру для titles, descriptions та urls.
        """
        
        languages = ['ua', 'en', 'it']
        
   
        titles = {}
        descriptions = {}
        urls = {}

        for lang in languages:

            t_val = data.get(f'title_{lang}')
            if t_val: titles[lang] = t_val

       
            d_val = data.get(f'description_{lang}')
            if d_val: descriptions[lang] = d_val


            u_val = data.get(f'url_{lang}')
            if u_val: urls[lang] = u_val

     
        if titles: data['titles'] = titles
        if descriptions: data['descriptions'] = descriptions
        if urls: data['urls'] = urls
        
        return data

    def create(self, request, *args, **kwargs):

        start_time = time.time()
        user_name = request.user.username
        
        logger.info(f"User {user_name} is creating new media resource", extra={
            'tags': {'action': 'media_create', 'user': user_name}
        })

     
        data = request.data.copy()
        data = self._pack_localized_data(data)
        
        serializer = self.get_serializer(data=data)


        if not serializer.is_valid():
            logger.warning(f"Media creation validation failed for {user_name}", extra={
                'tags': {'action': 'media_create', 'status': 'validation_error'},
                'errors': serializer.errors
            })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)

        duration = time.time() - start_time
        logger.info(f"Media resource created: {serializer.data.get('id')}", extra={
            'tags': {
                'action': 'media_create',
                'status': 'success',
                'user': user_name,
                'duration_sec': round(duration, 4)
            }
        })

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        start_time = time.time()
        user_name = request.user.username


        partial = kwargs.pop('partial', False)
        instance = self.get_object()


        logger.info(f"User {user_name} updating media resource {instance.id}", extra={
            'tags': {'action': 'media_update', 'user': user_name, 'resource_id': instance.id}
        })
        
        data = request.data.copy()
        data = self._pack_localized_data(data)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)


        duration = time.time() - start_time
        logger.info(f"Media resource {instance.id} updated successfully", extra={
            'tags': {
                'action': 'media_update',
                'status': 'success',
                'duration_sec': round(duration, 4)
            }
        })
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def handle_exception(self, exc):
        response = super().handle_exception(exc)
        if response and response.status_code == 403:
            user_name = self.request.user.username if self.request.user.is_authenticated else "anonymous"
            logger.warning(f"Forbidden access to media resources by {user_name}", extra={
                'tags': {'action': 'media_access', 'status': 'forbidden', 'user': user_name}
            })
            response.data = {
                "detail": "Доступ заборонено. Тільки адміністратори можуть редагувати файли."
            }
        return response