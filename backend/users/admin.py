from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Invitation, UserApiKey

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Відображення списку користувачів
    list_display = ('username', 'email', 'full_name', 'role', 'is_active', 'is_staff', 'expire_date')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'full_name', 'phone_number')
    ordering = ('username',)

    # Розподіл полів при редагуванні користувача
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Особиста інформація', {'fields': ('full_name', 'email', 'phone_number', 'role')}),
        ('1С Інтеграція', {'fields': ('user_id_1C', 'permit_finance_info', 'old_portal_id')}),
        ('Безпека та терміни', {'fields': ('is_active', 'is_staff', 'is_superuser', 'expire_date', 'email_confirmed')}),
        ('Групи та права', {'fields': ('groups', 'user_permissions')}),
        ('Важливі дати', {'fields': ('last_login', 'date_joined')}),
    )

    # Поля, які додаються при створенні нового користувача через адмінку
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {
            'classes': ('wide',),
            'fields': ('full_name', 'role', 'email'),
        }),
    )

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('code', 'user_id_1C', 'used', 'created_at', 'used_at')
    list_filter = ('used', 'created_at')
    search_fields = ('code',)
    readonly_fields = ('created_at', 'used_at')

@admin.register(UserApiKey)
class UserApiKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'expire_date', 'last_used_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'user__username', 'api_key')
    readonly_fields = ('api_key', 'created_at', 'last_used_at')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)