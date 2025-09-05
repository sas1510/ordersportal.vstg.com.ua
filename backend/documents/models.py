# from django.db import models

# # Create your models here.
# from django.db import models
# from django.contrib.auth import get_user_model
# from users.models import CustomUser 

# User = get_user_model()

# # class Document(models.Model):
# #     title = models.CharField(max_length=255)
# #     file = models.FileField(upload_to='documents/', blank=True, null=True)
# #     description = models.TextField(blank=True, verbose_name="Опис")
# #     author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
# #     created_at = models.DateTimeField(auto_now_add=True)

# class UploadFile(models.Model):
#     file_name = models.CharField(max_length=255)
#     file_path = models.CharField(max_length=255)
#     description = models.TextField(blank=True, null=True)
#     create_date = models.DateTimeField()
#     author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

#     def __str__(self):
#         return self.file_name
from django.db import models
from users.models import CustomUser

class UploadFile(models.Model):
    file_name = models.CharField(max_length=255, verbose_name="Назва файлу")
    file_path = models.CharField(max_length=255, verbose_name="Шлях до файлу")
    description = models.TextField(blank=True, null=True, verbose_name="Опис")
    create_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    author = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="uploaded_files",
        verbose_name="Автор"
    )

    def __str__(self):
        return self.file_name

    class Meta:
        verbose_name = "Файл"
        verbose_name_plural = "Файли"
        ordering = ['-create_date']
        db_table = 'UploadFiles'