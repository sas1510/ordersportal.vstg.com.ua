from django.db import models
from users.models import CustomUser
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

# class Message(models.Model):
#     class Meta:
#         db_table = "Message"
#         ordering = ['created_at']
#         verbose_name = 'Коментар'
#         verbose_name_plural = 'Коментарі'

#     id = models.BigAutoField(primary_key=True, db_column='ID')

#     # Поле для зберігання номера транзакції/запису з іншої системи
#     base_transaction_id = models.BinaryField(
#         max_length=255, 
#         null=True, 
#         blank=True, 
#         db_column='BaseTransactionID', # Назва колонки, як у Record
#         verbose_name='Базовий ID транзакції'
#     )
    
#     # ForeignKey до моделі TransactionType
#     transaction_type = models.ForeignKey(
#         TransactionType, 
#         on_delete=models.CASCADE, 
#         db_column='TransactionTypeID', # Використовуємо ID, щоб уникнути конфлікту з TransactionType
#         related_name='messages_by_type', # Новий related_name, якщо Messages не використовується в TransactionType
#         verbose_name='Тип транзакції'
#     )

#     writer_id = models.BinaryField(
#         max_length=16,
#         null=True,
#         blank=True,
#         db_column='WriterID',
#         verbose_name='Автор (GUID)'
#     )
    
#     message = models.TextField(db_column='Message')
    

#     is_read = models.BooleanField(
#         default=False, 
#         db_column='IsRead', 
#         verbose_name='Прочитано'
#     )

#     is_send = models.BooleanField(
#         default=False, 
#         db_column='IsSend', 
#         verbose_name='Сповіщення надіслано'
#     )
    
#     created_at = models.DateTimeField(
#             auto_now_add=True,
#             db_column='CreatedAt'
#         )

#     def __str__(self):
#         return f"[{self.transaction_type.type_name}] {self.message[:30]}"




from django.db import models
from django.conf import settings

# class UserDashboardConfig(models.Model):
#     class Meta:
#         # Зберігаємо ваш стиль іменування таблиць
#         db_table = "UserDashboard"
#         verbose_name = 'Налаштування дашборду'
#         verbose_name_plural = 'Налаштування дашбордів'

#     # MS SQL використовує BIGINT для BigAutoField
#     id = models.BigAutoField(primary_key=True, db_column='ID')
    
#     # ForeignKey до вашого кастомного користувача
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL, 
#         on_delete=models.CASCADE, 
#         db_column='UserID',
#         related_name='dashboard_configs'
#     )
    
#     layout_name = models.CharField(
#         max_length=255, 
#         default='default', 
#         db_column='LayoutName'
#     )
    
#     # Для MS SQL Django розгорне це в NVARCHAR(MAX)
#     config = models.JSONField(
#         db_column='Config',
#         help_text="Масив конфігурації віджетів у форматі JSON"
#     )
    
#     updated_at = models.DateTimeField(
#         auto_now=True, 
#         db_column='UpdatedAt'
#     )

#     def __str__(self):
#         return f"{self.user} - {self.layout_name}"
    


from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

# class Notification(models.Model):


#     id = models.BigAutoField(primary_key=True, db_column='ID')

#     EVENT_CHOICES = [
#         ('STATUS_CHANGED', 'Зміна статусу'),
#         ('NEW_MESSAGE', 'Нове повідомлення'),
#         ('ORDER_CREATED', 'Створено замовлення'),
#         ('ORDER_CANCELLED', 'Скасовано замовлення'),
#         ('PAYMENT_RECEIVED', 'Отримано оплату'),
#     ]



#     event_type = models.CharField(
#         max_length=50,
#         choices=EVENT_CHOICES,
#         db_column='EventType'
#     )

#     base_transaction_id = models.BinaryField(
#         max_length=255,
#         null=True,
#         blank=True,
#         db_column='BaseTransactionID',
#         verbose_name='Базовий ID транзакції'
#     )

#     old_value = models.CharField(
#         max_length=255,
#         null=True,
#         blank=True,
#         db_column='OldValue'
#     )

#     new_value = models.CharField(
#         max_length=255,
#         null=True,
#         blank=True,
#         db_column='NewValue'
#     )

#     message = models.TextField(
#         null=True,
#         blank=True,
#         db_column='Message'
#     )

#     is_read = models.BooleanField(
#         default=False,
#         db_column='IsRead'
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#         db_column='CreatedAt'
#     )

#     # Зв'язок з TransactionType
#     transaction_type = models.ForeignKey(
#         TransactionType,
#         on_delete=models.CASCADE,
#         related_name='notifications',
#         db_column='TransactionTypeID',
#         verbose_name='Тип транзакції'
#     )

#     # Зв'язок з користувачем
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='notifications',
#         db_column='UserID'
#     )

#     class Meta:
#         db_table = 'Notifications'
#         ordering = ['-created_at']
#         verbose_name = 'Сповіщення'
#         verbose_name_plural = 'Сповіщення'
        
#         # Індекси ідентичні тим, що в міграції
#         indexes = [
#             models.Index(fields=['user', 'is_read'], name='Notificatio_UserID_a7ec13_idx'),
#             models.Index(fields=['transaction_type', 'base_transaction_id'], name='Notificatio_Transac_f1800b_idx'),
#             models.Index(fields=['event_type'], name='Notificatio_EventTy_98c27e_idx'),
#         ]

#     def __str__(self):
#         return f"{self.event_type} for {self.user}"






from django.db import models
from django.conf import settings

class ChatMessage(models.Model):

    chat_id = models.CharField(max_length=255, db_index=True, db_column='ChatId', verbose_name="ID Чату")

    timestamp = models.DateTimeField(auto_now_add=True,  db_column='Timestamp', verbose_name="Період")
    
    related_object_id = models.BinaryField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_column='RelatedObjectId', 
        verbose_name="Об'єктОснова"
        )
    
    
    # models.CharField(max_length=100, blank=True,  null=True, db_column='RelatedObjectId', verbose_name="Об'єктОснова")
    

    # author = models.ForeignKey(
    #     settings.AUTH_USER_MODEL, 
    #     on_delete=models.CASCADE, 
    #     db_column='AuthorId',  # Змінено для зрозумілості в БД
    #     related_name='sent_messages', # Додано
    #     verbose_name="Автор"
    # )

    # recipient = models.ForeignKey(
    #     settings.AUTH_USER_MODEL, 
    #     on_delete=models.CASCADE, 
    #     db_column='RecipientId', # Змінено для зрозумілості в БД
    #     related_name='received_messages', # Додано
    #     null=True, blank=True,
    #     verbose_name="Отримувач"
    # )

    author = models.BinaryField(
        max_length=24, 
        null=True, 
        blank=True, 
        db_column='AuthorId'
    )
    
    recipient = models.BinaryField(
        max_length=24, 
        null=True, 
        blank=True, 
        db_column='RecipientId'
    )
 
    text = models.TextField(verbose_name="Текст повідомлення", db_column='Text')
    

    is_read = models.BooleanField(default=False, verbose_name="Прочитано", db_column='IsRead')
    

    is_sent_vtg = models.BooleanField(default=False, verbose_name="Відправлено ВТГ", db_column='IsSentVtg')
    

    transaction_type = models.ForeignKey(
        TransactionType,
        on_delete=models.CASCADE,
        # related_name='type',
        db_column='TransactionTypeID',
        verbose_name='Тип транзакції'
    )


    

    is_notification = models.BooleanField(default=False, verbose_name="Це повідомлення", db_column='IsNotification')
    
    event_type = models.CharField(max_length=100, blank=True, verbose_name="Тип події", db_column='EventType' )
    
    class Meta:
        db_table = 'ChatMessage'
        verbose_name = "Повідомлення"
        verbose_name_plural = "Повідомлення"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.author} -> {self.chat_id}: {self.text[:20]}..."