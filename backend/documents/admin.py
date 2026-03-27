from django.contrib import admin
from .models import UploadFile

@admin.register(UploadFile)
class UploadFileAdmin(admin.ModelAdmin):
    # Відображаємо основну інформацію про файл
    list_display = ('file_name', 'file_extension', 'author', 'create_date')
    
    # Фільтри за розширенням, автором та датою
    list_filter = ('file_extension', 'create_date', 'author')
    
    # Пошук за назвою файлу та описом
    search_fields = ('file_name', 'description', 'author__username')
    
    # Робимо дату створення тільки для читання
    readonly_fields = ('create_date',)

    # Групуємо поля для зручності, ховаємо довгий Base64 в окрему секцію
    fieldsets = (
        ('Основна інформація', {
            'fields': ('file_name', 'file_extension', 'description', 'author')
        }),
        ('Дані файлу', {
            'classes': ('collapse',),  # Секція буде згорнута за замовчуванням
            'fields': ('file_base64',),
            'description': "Увага: тут зберігається повний код файлу в Base64. Велика кількість тексту може сповільнити сторінку."
        }),
        ('Системна інформація', {
            'fields': ('create_date',),
        }),
    )

    # Автоматично заповнюємо автора при створенні через адмінку
    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.author:
            obj.author = request.user
        super().save_model(request, obj, form, change)