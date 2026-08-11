# portal_media/admin.py

from django.contrib import admin
from .models import MediaCategory, MediaResource


@admin.register(MediaCategory)
class MediaCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'usage_scope', 'icon_name', 'sort_order')
    list_filter = ('usage_scope',)
    search_fields = ('name', 'description', 'icon_name')
    ordering = ('sort_order', 'name')

@admin.register(MediaResource)
class MediaResourceAdmin(admin.ModelAdmin):
    # Замінюємо 'title' на новий метод 'get_title'
    list_display = ('get_title', 'category', 'resource_type', 'is_popular', 'created_at')
    list_filter = ('resource_type', 'category', 'is_popular')
    
    # Створюємо метод для відображення назви в списку
    def get_title(self, obj):
        # Повертаємо українську назву, якщо вона є, інакше англійську
        if isinstance(obj.titles, dict):
            return obj.titles.get('ua') or obj.titles.get('en') or "No title"
        return "Invalid Data"
    
    # Налаштовуємо заголовок колонки в адмінці
    get_title.short_description = 'Назва'
