# media/models.py

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import CustomUser # Переконайтесь, що шлях до CustomUser правильний

class MediaResource(models.Model):
    
    # Поле, яке визначає, що це - відео чи файл
    class ResourceType(models.TextChoices):
        YOUTUBE = 'youtube', 'Відео (YouTube)'
        TIKTOK  = 'tiktok',  'Відео (TikTok)'
        FILE    = 'file',    'Файл (завантаження)'

    # --- Спільні поля ---
    
    id = models.BigAutoField(primary_key=True, db_column='ID')

    title = models.CharField(
        max_length=255, 
        verbose_name="Назва/Заголовок", 
        db_column='Title'
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Опис", 
        db_column='Description'
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
    
    resource_type = models.CharField(
        max_length=10,
        choices=ResourceType.choices,
        verbose_name="Тип ресурсу",
        db_column='ResourceType'
    )

    # --- Поля для 'YOUTUBE' та 'TIKTOK' ---
    url = models.URLField(
        blank=True, 
        null=True, 
        verbose_name="Посилання (URL)",
        db_column='Url'
    )

    # --- ЗМІНЕНО: Поля тільки для 'FILE' ---
    
    # Використовуємо BinaryField замість TextField
    file_data = models.BinaryField(
        blank=True, 
        null=True, 
        verbose_name="Файл (бінарні дані)", 
        db_column='FileData'  # Змінено назву колонки
    )
    
    file_extension = models.CharField(
        max_length=10, 
        blank=True, 
        null=True, 
        verbose_name="Розширення файлу", 
        db_column='FileExtension'
    )

    def __str__(self):
        return f"[{self.get_resource_type_display()}] {self.title}"

    # Валідація, щоб не можна було одночасно
    # заповнити і 'url', і 'file_data'
    def clean(self):
        super().clean()
        
        if self.resource_type in (self.ResourceType.YOUTUBE, self.ResourceType.TIKTOK):
            if not self.url:
                raise ValidationError(f"Для типу '{self.get_resource_type_display()}' поле 'Посилання (URL)' є обов'язковим.")
            
            # ЗМІНЕНО: Очищуємо file_data
            self.file_data = None 
            self.file_extension = None
        
        elif self.resource_type == self.ResourceType.FILE:
            
            # ЗМІНЕНО: Перевіряємо file_data
            if not self.file_data or not self.file_extension:
                # Ця перевірка спрацює тільки при створенні, 
                # при оновленні 'file_data' може бути порожнім
                if not self.pk: 
                     raise ValidationError("Для типу 'Файл' поля 'Бінарні дані' та 'Розширення' є обов'язковими.")
            self.url = None

    class Meta:
        verbose_name = "Медіа Ресурс"
        verbose_name_plural = "Медіа Ресурси"
        ordering = ['-created_at'] 
        db_table = 'MediaResource'