from django.contrib import admin
from .models import HelpServiceContact, HelpServiceLog

@admin.register(HelpServiceContact)
class HelpServiceContactAdmin(admin.ModelAdmin):
    # Відображення списку контактів
    list_display = ('id', 'contact_name', 'department', 'phone', 'email', 'telegram_id')
    # Фільтрація за відділом
    list_filter = ('department',)
    # Пошук за іменем, телефоном та поштою
    search_fields = ('contact_name', 'phone', 'email', 'department')
    ordering = ('contact_name',)

@admin.register(HelpServiceLog)
class HelpServiceLogAdmin(admin.ModelAdmin):
    # Відображення логів викликів
    list_display = ('id', 'create_date', 'contact', 'user', 'call_type', 'success')
    # Зручні фільтри: по даті, по успішності та по типу виклику
    list_filter = ('success', 'call_type', 'create_date')
    # Пошук за іменем контакту або логіном користувача, який звертався
    search_fields = ('contact__contact_name', 'user__username')
    # Тільки для читання (логи зазвичай не редагують вручну)
    readonly_fields = ('create_date',)
    
    # Сортування: спочатку найновіші
    ordering = ('-create_date',)