import base64

from django.db import models

from users.models import CustomUser


class BonusProduct(models.Model):
    id = models.BigAutoField(primary_key=True, db_column='ID')
    name = models.CharField(max_length=255, db_column='Name', verbose_name='Назва товару')
    category = models.CharField(max_length=255, db_column='Category', verbose_name='Категорія')
    price = models.PositiveIntegerField(db_column='Price', verbose_name='Вартість у балах')
    image_data = models.BinaryField(blank=True, null=True, db_column='ImageData', verbose_name='Зображення')
    image_extension = models.CharField(max_length=20, blank=True, null=True, db_column='ImageExtension', verbose_name='Розширення зображення')
    is_active = models.BooleanField(default=True, db_column='IsActive', verbose_name='Активний')
    display_order = models.PositiveIntegerField(default=0, db_column='DisplayOrder', verbose_name='Порядок сортування')
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bonus_products',
        db_column='AuthorID',
        verbose_name='Автор',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt', verbose_name='Створено')
    updated_at = models.DateTimeField(auto_now=True, db_column='UpdatedAt', verbose_name='Оновлено')

    class Meta:
        db_table = 'BonusProduct'
        verbose_name = 'Бонусний товар'
        verbose_name_plural = 'Бонусні товари'
        ordering = ['-created_at', 'name']
        app_label = 'bonus'

    def __str__(self):
        return self.name

    @property
    def image_base64(self):
        if not self.image_data:
            return None
        return base64.b64encode(self.image_data).decode('utf-8')
