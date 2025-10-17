from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('id', 'username', 'full_name', 'role', 'is_staff', 'is_superuser', 'enable')
    list_filter = ('role', 'is_staff', 'is_superuser', 'enable')
    search_fields = ('username', 'full_name', 'phone_number')
    ordering = ('id',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password', 'full_name', 'role', 'phone_number', 'organization')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'enable', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'expire_date')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'full_name', 'role', 'password1', 'password2', 'is_staff', 'is_superuser', 'enable')}
        ),
    )

admin.site.register(CustomUser, CustomUserAdmin)
