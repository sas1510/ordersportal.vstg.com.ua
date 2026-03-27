from django import forms
from django.contrib import admin
from django.utils.html import format_html
from .models import MediaResource

class MediaResourceForm(forms.ModelForm):

    upload_file = forms.FileField(
        required=False, 
        label="Завантажити файл",
        help_text="Оберіть файл, який буде збережено як бінарні дані в БД"
    )

    class Meta:
        model = MediaResource
        fields = '__all__'

    def save(self, commit=True):
        instance = super().save(commit=False)
        uploaded_file = self.cleaned_data.get('upload_file')
        
  
        if uploaded_file:
            instance.file_data = uploaded_file.read()
      
            if not instance.file_extension:
                instance.file_extension = uploaded_file.name.split('.')[-1]
        
        if commit:
            instance.save()
        return instance

@admin.register(MediaResource)
class MediaResourceAdmin(admin.ModelAdmin):
    form = MediaResourceForm
    list_display = ('title', 'resource_type', 'author', 'created_at', 'get_file_info')
    list_filter = ('resource_type', 'created_at')
    

    readonly_fields = ('created_at', 'file_data')

    fieldsets = (
        ('Загальна інформація', {
            'fields': ('title', 'description', 'author', 'resource_type')
        }),
        ('Відео ресурси (YouTube/TikTok)', {
            'fields': ('url',),
        }),
        ('Файлові ресурси (БД)', {
            'fields': ('upload_file', 'file_extension', 'file_data'),
        }),
        ('Системні дані', {
            'fields': ('created_at',),
        }),
    )

    def get_file_info(self, obj):
        if obj.resource_type == MediaResource.ResourceType.FILE and obj.file_data:
            size = len(obj.file_data) / 1024
            return format_html("💾 Файл ({:.1f} KB)", size)
        elif obj.url:
            return format_html('<a href="{}" target="_blank">🔗 Посилання</a>', obj.url)
        return "-"
    get_file_info.short_description = "Статус/Вміст"