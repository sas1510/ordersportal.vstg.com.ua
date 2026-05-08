from django.db import models
from django.core.exceptions import ValidationError
from users.models import CustomUser

class MediaCategory(models.Model):
    """Модель для категорій медіа-ресурсів"""
    id = models.BigAutoField(primary_key=True, db_column='ID')
    name = models.CharField(
        max_length=100, 
        verbose_name="Назва категорії", 
        db_column='Name'
    )
    description = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="Опис", 
        db_column='Description'
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Категорія медіа"
        verbose_name_plural = "Категорії медіа"
        db_table = 'MediaCategory'


class MediaResource(models.Model):
    # Поле, яке визначає, що це - відео чи файл
    class ResourceType(models.TextChoices):
        YOUTUBE = 'youtube', 'YouTube'
        TIKTOK  = 'tiktok',  'TikTok'
        INSTA   = 'instagram','Instagram'
        FB      = 'facebook', 'Facebook'
        FILE    = 'file',     'Файл'

    # --- Спільні поля ---
    id = models.BigAutoField(primary_key=True, db_column='ID')

    titles = models.JSONField(
        default=dict, 
        verbose_name="Назви (UA, EN, IT...)",
        db_column='Titles'
    )
    
    # ЗВ'ЯЗОК З КАТЕГОРІЄЮ (Випадаючий список)
    category = models.ForeignKey(
        MediaCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resources",
        verbose_name="Категорія",
        db_column='CategoryID'
    )

    descriptions = models.JSONField(
        default=dict, 
        blank=True, 
        null=True,
        verbose_name="Описи (UA, EN, IT...)",
        db_column='Descriptions'
    )

    author = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="added_resources",
        verbose_name="Автор",
        db_column='AuthorID'
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Дата додавання", 
        db_column='CreatedAt'
    )

    external_id = models.CharField(
        max_length=255, 
        unique=True, 
        null=True, 
        blank=True,
        verbose_name="ID у соцмережі",
        db_column='ExternalID'
    )
    
    resource_type = models.CharField(
        max_length=10,
        choices=ResourceType.choices,
        verbose_name="Тип ресурсу",
        db_column='ResourceType'
    )

    # --- Поля для 'YOUTUBE' та 'TIKTOK' ---
    urls = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name="Посилання (URL) для різних мов",
        db_column='Urls'
    )

    # --- Поля тільки для 'FILE' ---
    file_data = models.BinaryField(
        blank=True, 
        null=True, 
        verbose_name="Файл (бінарні дані)", 
        db_column='FileData'
    )
    
    file_extension = models.CharField(
        max_length=10, 
        blank=True, 
        null=True, 
        verbose_name="Розширення файлу", 
        db_column='FileExtension'
    )

    image_url = models.URLField(
        max_length=1000, 
        null=True, 
        blank=True, 
        verbose_name="URL зображення", 
        db_column='ImageUrl'
    )

    def __str__(self):
        # Правильний варіант для JSONField
        name = self.titles.get('ua', 'Resource') if isinstance(self.titles, dict) else "Resource"
        return name
    
    def clean(self):
        super().clean()
        # Валідація для відео: перевіряємо чи є хоча б одне посилання у JSON
        if self.resource_type in ['youtube', 'tiktok', 'instagram', 'facebook']:
            if not self.urls or not any(self.urls.values()):
                raise ValidationError("Для відео-ресурсів потрібно додати хоча б одне посилання.")

    # def clean(self):
    #     super().clean()
        
    #     if self.resource_type in (self.ResourceType.YOUTUBE, self.ResourceType.TIKTOK):
    #         if not self.url:
    #             raise ValidationError(f"Для типу '{self.get_resource_type_display()}' поле 'Посилання (URL)' є обов'язковим.")
    #         self.file_data = None 
    #         self.file_extension = None
        
    #     elif self.resource_type == self.ResourceType.FILE:
    #         if not self.file_data or not self.file_extension:
    #             if not self.pk: 
    #                  raise ValidationError("Для типу 'Файл' поля 'Бінарні дані' та 'Розширення' є обов'язковими.")
    #         self.url = None

    class Meta:
        verbose_name = "Медіа Ресурс"
        verbose_name_plural = "Медіа Ресурси"
        ordering = ['-created_at'] 
        db_table = 'MediaResource'