from django.contrib import admin

from .models import BonusProduct


@admin.register(BonusProduct)
class BonusProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'display_order', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'category')
    ordering = ('display_order', 'name', '-created_at')
