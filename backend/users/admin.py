# from django.contrib import admin

# # Register your models here.
# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from .models import CustomUser

# class CustomUserAdmin(UserAdmin):
#     model = CustomUser
#     list_display = ('id', 'username', 'full_name', 'role', 'is_staff', 'is_superuser', 'enable')
#     list_filter = ('role', 'is_staff', 'is_superuser', 'enable')
#     search_fields = ('username', 'full_name', 'phone_number')
#     ordering = ('id',)
    
#     fieldsets = (
#         (None, {'fields': ('username', 'password', 'full_name', 'role', 'phone_number', 'organization')}),
#         ('Permissions', {'fields': ('is_staff', 'is_superuser', 'enable', 'groups', 'user_permissions')}),
#         ('Important dates', {'fields': ('last_login', 'date_joined', 'expire_date')}),
#     )
    
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('username', 'full_name', 'role', 'password1', 'password2', 'is_staff', 'is_superuser', 'enable')}
#         ),
#     )

# admin.site.register(CustomUser, CustomUserAdmin)
# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Invitation # Додано Invitation

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # ВИПРАВЛЕНО: 'enable' -> 'is_active'
    list_display = ('id', 'username', 'full_name', 'role', 'is_staff', 'is_superuser', 'is_active')
    # ВИПРАВЛЕНО: 'enable' -> 'is_active'
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'full_name', 'phone_number')
    ordering = ('id',)
    
    fieldsets = (
        # ВИПРАВЛЕНО: 'organization' видалено, оскільки його немає в новій моделі
        (None, {'fields': ('username', 'password', 'full_name', 'role', 'phone_number')}),
        # ВИПРАВЛЕНО: 'enable' -> 'is_active'
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'is_active', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'expire_date')}),
        # Додано секцію для інших полів
        ('1C/Portal Data', {'fields': ('user_id_1C', 'permit_finance_info', 'old_portal_id')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            # ВИПРАВЛЕНО: 'enable' -> 'is_active'
            'fields': ('username', 'full_name', 'role', 'password', 'is_staff', 'is_superuser', 'is_active')}
        ),
    )
    # Забираємо first_name, last_name з форм редагування
    filter_horizontal = ('groups', 'user_permissions',)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('code', 'user_id_1C', 'used', 'created_at', 'used_at')
    list_filter = ('used',)
    search_fields = ('code', 'user_id_1C')
    readonly_fields = ('created_at', 'used_at')


admin.site.register(CustomUser, CustomUserAdmin)