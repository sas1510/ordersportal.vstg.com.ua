from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import MediaCategory, MediaResource
from .serializers import MediaCategorySerializer, MediaResourceSerializer
from .permissions import IsAdminOrReadOnly
from drf_spectacular.utils import (
    extend_schema_view,
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)
from urllib.parse import urlparse, parse_qs
import re
import requests

# import logging
import time
# logger = logging.getLogger(__name__)

from backend.utils.logging_setup import logger


def extract_youtube_video_id(raw_url):
    if not raw_url or not isinstance(raw_url, str):
        return ""

    try:
        parsed = urlparse(raw_url.strip())
    except Exception:
        return ""

    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""

    if hostname == "youtu.be":
        return path.lstrip("/").split("/")[0]

    if "youtube.com" in hostname:
        if "/shorts/" in path:
            return path.split("/shorts/")[1].split("/")[0]

        query_video_id = parse_qs(parsed.query).get("v", [""])[0]
        if query_video_id:
            return query_video_id

    return ""


def format_video_duration(total_seconds):
    total_seconds = int(total_seconds or 0)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def resolve_youtube_duration(raw_url):
    video_id = extract_youtube_video_id(raw_url)
    if not video_id:
        return None

    watch_url = f"https://www.youtube.com/watch?v={video_id}"

    try:
        response = requests.get(
            watch_url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
                ),
            },
            timeout=8,
        )
        response.raise_for_status()
    except Exception:
        return None

    html = response.text or ""

    length_match = re.search(r'"lengthSeconds":"(\d+)"', html)
    if length_match:
        return format_video_duration(length_match.group(1))

    duration_ms_match = re.search(r'"approxDurationMs":"(\d+)"', html)
    if duration_ms_match:
        return format_video_duration(int(duration_ms_match.group(1)) // 1000)

    return None


@extend_schema_view(
    list=extend_schema(
        summary="Отримати список медіа-ресурсів",
        tags=["media-resources"],
    )
)
class MediaResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для медіа-ресурсів. 
    Автоматично пакує мовні поля (title_ua, title_de, url_it тощо) у JSONField.
    """
    serializer_class = MediaResourceSerializer
    permission_classes = [IsAdminOrReadOnly]
    localized_languages = ("ua", "en", "it", "de", "ro", "hu")

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

    def _pack_localized_data(self, data, instance=None):
        """
        Допоміжний метод: збирає поля типу 'title_ua', 'title_en', 'title_de'
        у JSON-структуру для titles, descriptions та urls.

        Якщо ресурс оновлюється, значення мерджаться з існуючими JSON-полями,
        щоб частковий PATCH/PUT не затирав інші локалі.
        """

        localized_groups = {
            "titles": "title",
            "descriptions": "description",
            "urls": "url",
        }

        for target_field, raw_prefix in localized_groups.items():
            existing_values = {}
            if instance is not None:
                instance_values = getattr(instance, target_field, None)
                if isinstance(instance_values, dict):
                    existing_values.update(instance_values)

            payload_values = data.get(target_field)
            if isinstance(payload_values, dict):
                existing_values.update({
                    lang: value for lang, value in payload_values.items() if value not in (None, "")
                })

            has_raw_values = False
            for lang in self.localized_languages:
                raw_key = f"{raw_prefix}_{lang}"
                raw_value = data.pop(raw_key, None)
                if raw_value not in (None, ""):
                    existing_values[lang] = raw_value
                    has_raw_values = True

            if existing_values and (has_raw_values or target_field in data or instance is not None):
                data[target_field] = existing_values

        return data

    def _maybe_populate_duration(self, data, instance=None):
        resource_type = data.get("resource_type") or getattr(instance, "resource_type", None)

        if resource_type not in [MediaResource.ResourceType.YOUTUBE, MediaResource.ResourceType.FAQ]:
            return data

        if data.get("duration") not in (None, ""):
            return data

        urls = data.get("urls")
        if not isinstance(urls, dict) and instance is not None:
            urls = getattr(instance, "urls", None)

        if not isinstance(urls, dict):
            return data

        primary_url = urls.get("ua") or next((value for value in urls.values() if value), "")
        duration = resolve_youtube_duration(primary_url)

        if duration:
            data["duration"] = duration
        elif instance is not None and getattr(instance, "duration", None):
            data["duration"] = instance.duration

        return data

    def create(self, request, *args, **kwargs):

        start_time = time.time()
        user_name = request.user.username
        
        logger.info(f"User {user_name} is creating new media resource", extra={
            'tags': {'action': 'media_create', 'user': user_name}
        })

     
        data = request.data.copy()
        data = self._pack_localized_data(data)
        data = self._maybe_populate_duration(data)
        
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
        data = self._pack_localized_data(data, instance=instance)
        data = self._maybe_populate_duration(data, instance=instance)
        
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


@extend_schema_view(
    list=extend_schema(
        summary="Отримати список категорій медіа",
        tags=["media-categories"],
        parameters=[
            OpenApiParameter(
                name="usage_scope",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Фільтр за сферою використання категорії: general, video, faq",
            ),
        ],
    )
)
class MediaCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = MediaCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = MediaCategory.objects.all().order_by('sort_order', 'name')
        usage_scope = self.request.query_params.get('usage_scope')
        if usage_scope:
            queryset = queryset.filter(usage_scope=usage_scope)
        return queryset
