from django.db import models
from backend.users.models import CustomUser  # підключаємо вашу модель користувача

class Video(models.Model):
    url = models.URLField(blank=True, null=True, verbose_name="Посилання на YouTube")
    title = models.CharField(max_length=255, verbose_name="Заголовок відео")
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата додавання")
    added_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_videos",
        verbose_name="Додав користувач"
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Відео"
        verbose_name_plural = "Відео"
        ordering = ['-created_at']
        db_table = 'video'
