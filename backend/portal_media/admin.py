from django.contrib import admin
from django.utils.html import format_html
from .models import MediaResource

@admin.register(MediaResource)
class MediaResourceAdmin(admin.ModelAdmin):
    # Відображення списку ресурсів
    list_display = ('title', 'resource_type', 'author', 'created_at', 'get_file_status')
    list_filter = ('resource_type', 'created_at', 'author')
    search_fields = ('title', 'description', 'url')
    readonly_fields = ('created_at',)

    # Розподіл полів на логічні блоки
    fieldsets = (
        ('Загальна інформація', {
            'fields': ('title', 'description', 'author', 'resource_type')
        }),
        ('Відео ресурси (YouTube/TikTok)', {
            'fields': ('url',),
            'description': "Заповнюйте це поле тільки для відео-ресурсів."
        }),
        ('Файлові ресурси (Binary)', {
            'fields': ('file_extension', 'file_data'),
            'description': "Ці поля використовуються лише для завантаження файлів безпосередньо в БД."
        }),
        ('Системні дані', {
            'fields': ('created_at',),
        }),
    )

    def get_file_status(self, obj):
        """Відображає статус файлу або посилання у списку."""
        if obj.resource_type == MediaResource.ResourceType.FILE:
            if obj.file_data:
                # Розрахунок приблизного розміру в КБ
                size = len(obj.file_data) / 1024
                return format_html('<span style="color: green;">💾 Файл ({:.1f} KB)</span>', size)
            return format_html('<span style="color: red;">❌ Порожньо</span>')
        return format_html('<a href="{0}" target="_blank">🔗 Перейти за посиланням</a>', obj.url)
    
    get_file_status.short_description = "Вміст/Статус"

    def save_model(self, request, obj, form, change):
        """Автоматично призначає автора, якщо він не вказаний."""
        if not obj.pk and not obj.author:
            obj.author = request.user
        super().save_model(request, obj, form, change)

    # Якщо ви хочете додати валідацію clean() безпосередньо в форму адмінки
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)