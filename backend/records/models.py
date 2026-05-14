from django.db import models
from users.models import CustomUser

from django.conf import settings



class TransactionType(models.Model):
    class Meta:
        db_table = "TransactionTypes"

    id = models.BigAutoField(primary_key=True, db_column='ID')
    # id = models.BiIntegerField(primary_key=True, db_column='ID')
    type_name = models.CharField(max_length=64, db_column='TypeName')
    description = models.CharField(max_length=255, null=True, blank=True, db_column='Description')



import uuid
from django.db import models



class FileType(models.Model):
    class Meta:
        db_table = "FileTypes"

    id = models.BigAutoField(primary_key=True, db_column='ID')

    type_name = models.CharField(max_length=64, db_column='TypeName')
    extensions = models.CharField(max_length=255, db_column='Extensions')
    description = models.CharField(max_length=255, null=True, blank=True, db_column='Description')


class TransactionFile(models.Model):


    class Meta:

        db_table = "TransactionFiles"
    
    id = models.BigAutoField(primary_key=True, db_column='ID')
    base_transaction_id = models.BinaryField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_column='BaseTransactionID',
        verbose_name='Базовий ID транзакції'
    )

    transaction_type = models.ForeignKey(
        TransactionType, 
        on_delete=models.CASCADE, 
        db_column='TransactionTypeID', 
        related_name='files_by_type', 
        verbose_name='Тип транзакції'
    )

    
    file_type = models.ForeignKey(
        FileType, 
        on_delete=models.CASCADE,
        db_column='FileTypeId' 
    )
    
    file_name = models.CharField(
        max_length=255,
        db_column='FileName' 
    )
    
    file_extension = models.CharField(
        max_length=32,
        db_column='FileExtension' 
    )
    
    file_path = models.TextField(
        db_column='FilePath', 
        null=True,
        blank=True
    )
    
    file_data = models.BinaryField(
        null=True, 
        blank=True,
        db_column='FileData' 
    )

    thumbnail_data = models.BinaryField(
        null=True, 
        blank=True,
        db_column='ThumbnailData',
        verbose_name='Зменшена копія даних'
    )


from django.db import models
from .models import TransactionType 


from django.db import models
from django.conf import settings

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


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