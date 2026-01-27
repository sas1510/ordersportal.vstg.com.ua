from django.db import models
from backend.users.models import CustomUser
# from users.models import CustomUser
from django.conf import settings
# Create your models here.
class TransactionType(models.Model):
    class Meta:
        db_table = "TransactionTypes"

    id = models.BigAutoField(primary_key=True, db_column='ID')
    # id = models.BiIntegerField(primary_key=True, db_column='ID')
    type_name = models.CharField(max_length=64, db_column='TypeName')
    description = models.CharField(max_length=255, null=True, blank=True, db_column='Description')



import uuid
from django.db import models

# Припускаємо, що моделі 'Record' та 'FileType'
# визначені в іншому місці вашого проєкту
# from .some_app.models import Record, FileType

class FileType(models.Model):
    class Meta:
        db_table = "FileTypes"

    id = models.BigAutoField(primary_key=True, db_column='ID')
    # id = models.PositiveSmallIntegerField(primary_key=True)
    type_name = models.CharField(max_length=64, db_column='TypeName')
    extensions = models.CharField(max_length=255, db_column='Extensions')
    description = models.CharField(max_length=255, null=True, blank=True, db_column='Description')


class TransactionFile(models.Model):


    class Meta:
        # Встановлюємо назву таблиці в camelCase, 
        # зберігаючи вашу схему 'transactions'
        db_table = "TransactionFiles"
    
    id = models.BigAutoField(primary_key=True, db_column='ID')
    base_transaction_id = models.BinaryField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_column='BaseTransactionID', # Назва колонки, як у Record
        verbose_name='Базовий ID транзакції'
    )

    transaction_type = models.ForeignKey(
        TransactionType, 
        on_delete=models.CASCADE, 
        db_column='TransactionTypeID', # Використовуємо ID, щоб уникнути конфлікту з TransactionType
        related_name='files_by_type', # Новий related_name, якщо Messages не використовується в TransactionType
        verbose_name='Тип транзакції'
    )

    
    file_type = models.ForeignKey(
        FileType, 
        on_delete=models.CASCADE,
        db_column='FileTypeId' # camelCase для ForeignKey
    )
    
    file_name = models.CharField(
        max_length=255,
        db_column='FileName' # camelCase
    )
    
    file_extension = models.CharField(
        max_length=32,
        db_column='FileExtension' # camelCase
    )
    
    file_path = models.TextField(
        db_column='FilePath', # camelCa
        null=True,
        blank=True
    )
    
    file_data = models.BinaryField(
        null=True, 
        blank=True,
        db_column='FileData' # camelCase
    )

    thumbnail_data = models.BinaryField(
        null=True, 
        blank=True,
        db_column='ThumbnailData', # Назва колонки у базі даних
        verbose_name='Зменшена копія даних'
    )



# Припускаємо, що CustomUser та Record визначені вище 
# або імпортовані, наприклад:
# from .users_models import CustomUser
# from .records_models import Record

from django.db import models

# Імпортуємо модель TransactionType
from .models import TransactionType # Припускаємо, що TransactionType знаходиться у цьому ж файлі або app.

# --- МОДЕЛЬ MESSAGE (КОМЕНТАР) ---

class Message(models.Model):
    class Meta:
        db_table = "Message"
        ordering = ['created_at']
        verbose_name = 'Коментар'
        verbose_name_plural = 'Коментарі'

    id = models.BigAutoField(primary_key=True, db_column='ID')

    # Поле для зберігання номера транзакції/запису з іншої системи
    base_transaction_id = models.BinaryField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_column='BaseTransactionID', # Назва колонки, як у Record
        verbose_name='Базовий ID транзакції'
    )
    
    # ForeignKey до моделі TransactionType
    transaction_type = models.ForeignKey(
        TransactionType, 
        on_delete=models.CASCADE, 
        db_column='TransactionTypeID', # Використовуємо ID, щоб уникнути конфлікту з TransactionType
        related_name='messages_by_type', # Новий related_name, якщо Messages не використовується в TransactionType
        verbose_name='Тип транзакції'
    )

    writer_id = models.BinaryField(
        max_length=16,
        null=True,
        blank=True,
        db_column='WriterID',
        verbose_name='Автор (GUID)'
    )
    
    message = models.TextField(db_column='Message')
    

    is_read = models.BooleanField(
        default=False, 
        db_column='IsRead', 
        verbose_name='Прочитано'
    )
    
    created_at = models.DateTimeField(
            auto_now_add=True,
            db_column='CreatedAt'
        )

    def __str__(self):
        return f"[{self.transaction_type.type_name}] {self.message[:30]}"