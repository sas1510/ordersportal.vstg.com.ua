# media/admin.py

from django.contrib import admin
from .models import MediaResource

@admin.register(MediaResource)
class MediaResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'author', 'created_at')
    list_filter = ('resource_type', 'author')
    search_fields = ('title', 'description', 'author__username')
    
    # Поля, які відображаються при редагуванні
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'author', 'resource_type')
        }),
        ('Посилання (для Відео)', {
            'classes': ('collapse',), # Поле буде прихованим за замовчуванням
            'fields': ('url',),
        }),
        ('Файл (для Завантажень)', {
            'classes': ('collapse',),
            'fields': ('file_base64', 'file_extension'),
        }),
    )