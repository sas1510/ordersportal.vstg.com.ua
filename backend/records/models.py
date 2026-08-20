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
    



class ChatMessageAttachment(models.Model):
    Id = models.BigAutoField(primary_key=True, db_column="Id")

    MessageId = models.ForeignKey(
        ChatMessage,
        db_column="MessageId",
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    AttachmentType = models.CharField(db_column="AttachmentType", max_length=20)
    FileName = models.CharField(db_column="FileName", max_length=255, null=True, blank=True)
    OriginalFileName = models.CharField(db_column="OriginalFileName", max_length=255, null=True, blank=True)
    MimeType = models.CharField(db_column="MimeType", max_length=100, null=True, blank=True)
    FileExtension = models.CharField(db_column="FileExtension", max_length=20, null=True, blank=True)
    FileSize = models.BigIntegerField(db_column="FileSize", null=True, blank=True)
    FileData = models.BinaryField(db_column="FileData")
    DurationSeconds = models.IntegerField(db_column="DurationSeconds", null=True, blank=True)
    CreatedAt = models.DateTimeField(db_column="CreatedAt", auto_now_add=True)

    class Meta:
        db_table = "ChatMessageAttachment"
        managed = False


class ChatTelegramMap(models.Model):
    Id = models.BigAutoField(primary_key=True, db_column="Id")

    MessageId = models.ForeignKey(
        ChatMessage,
        db_column="MessageId",
        on_delete=models.CASCADE,
        related_name="telegram_maps"
    )
    ChatId = models.CharField(db_column="ChatId", max_length=255)
    TelegramChatId = models.BigIntegerField(db_column="TelegramChatId")
    TelegramMessageId = models.BigIntegerField(db_column="TelegramMessageId")
    TelegramReplyToMessageId = models.BigIntegerField(
        db_column="TelegramReplyToMessageId",
        null=True,
        blank=True
    )
    Direction = models.CharField(db_column="Direction", max_length=20)
    CreatedAt = models.DateTimeField(db_column="CreatedAt", auto_now_add=True)

    class Meta:
        db_table = "ChatTelegramMap"
        managed = False


class ChatLargeVideoUploadToken(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="ID")
    message = models.ForeignKey(
        ChatMessage,
        db_column="MessageId",
        on_delete=models.CASCADE,
        related_name="large_video_upload_tokens",
    )
    chat_id = models.CharField(db_column="ChatId", max_length=255, db_index=True)
    token = models.CharField(db_column="Token", max_length=128, unique=True, db_index=True)
    original_file_name = models.CharField(
        db_column="OriginalFileName",
        max_length=255,
        null=True,
        blank=True,
    )
    is_used = models.BooleanField(db_column="IsUsed", default=False)
    used_at = models.DateTimeField(db_column="UsedAt", null=True, blank=True)
    expires_at = models.DateTimeField(db_column="ExpiresAt")
    created_at = models.DateTimeField(db_column="CreatedAt", auto_now_add=True)
    uploaded_attachment_id = models.BigIntegerField(
        db_column="UploadedAttachmentId",
        null=True,
        blank=True,
    )
    telegram_chat_id = models.BigIntegerField(
        db_column="TelegramChatId",
        null=True,
        blank=True,
    )
    telegram_message_id = models.BigIntegerField(
        db_column="TelegramMessageId",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "ChatLargeVideoUploadToken"

    def __str__(self):
        return f"{self.chat_id}:{self.message_id}:{self.token[:10]}"

class TelegramPortalLink(models.Model):
    """Secure binding between a Telegram chat and one portal account."""

    id = models.BigAutoField(primary_key=True, db_column='ID')
    telegram_chat_id = models.BigIntegerField(unique=True, db_column='TelegramChatId')
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='telegram_portal_links',
        db_column='UserID',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='UpdatedAt')

    class Meta:
        db_table = 'TelegramPortalLink'

    def __str__(self):
        return f'{self.telegram_chat_id} -> {self.user_id}'

class TelegramBotApiKey(models.Model):
    """Hashed service key used by the n8n Telegram workflow."""

    id = models.BigAutoField(primary_key=True, db_column='ID')
    key_hash = models.CharField(max_length=64, unique=True, db_column='KeyHash')
    key_prefix = models.CharField(max_length=16, db_column='KeyPrefix')
    is_active = models.BooleanField(default=True, db_column='IsActive')
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')
    last_used_at = models.DateTimeField(null=True, blank=True, db_column='LastUsedAt')
    created_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_telegram_bot_keys',
        db_column='CreatedByUserID',
    )

    class Meta:
        db_table = 'TelegramBotApiKeys'

    def __str__(self):
        return f'{self.key_prefix}... ({"active" if self.is_active else "inactive"})'

class CalculationIdempotencyRecord(models.Model):
    """Durable result/uncertainty record for API calculation creation."""

    idempotency_key = models.UUIDField(db_column="IdempotencyKey", unique=True)
    payload_hash = models.CharField(db_column="PayloadHash", max_length=64)
    status = models.CharField(db_column="Status", max_length=30, default="sending")
    calculation_guid = models.UUIDField(
        db_column="CalculationGuid", null=True, blank=True
    )
    response_body = models.JSONField(db_column="ResponseBody", null=True, blank=True)
    last_error = models.TextField(db_column="LastError", null=True, blank=True)
    created_at = models.DateTimeField(db_column="CreatedAt", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="UpdatedAt", auto_now=True)

    class Meta:
        db_table = "CalculationIdempotencyRecords"


class PortalAnnouncement(models.Model):
    STYLE_CHOICES = [("info", "Інформація"), ("success", "Успіх"), ("warning", "Попередження"), ("critical", "Критично"), ("update", "Оновлення")]
    STATUS_CHOICES = [("draft", "Чернетка"), ("scheduled", "Заплановано"), ("active", "Активне"), ("finished", "Завершено"), ("cancelled", "Скасовано")]
    AUDIENCE_CHOICES = [("all", "Усі"), ("roles", "Ролі"), ("users", "Користувачі")]
    id = models.BigAutoField(primary_key=True, db_column="ID")
    title = models.CharField(max_length=255, db_column="Title")
    body = models.TextField(db_column="Body")
    style = models.CharField(max_length=16, choices=STYLE_CHOICES, default="info", db_column="Style")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft", db_column="Status", db_index=True)
    audience_mode = models.CharField(max_length=16, choices=AUDIENCE_CHOICES, default="all", db_column="AudienceMode")
    audience_roles = models.JSONField(default=list, blank=True, db_column="AudienceRoles")
    audience_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="targeted_announcements", db_table="PortalAnnouncementAudience")
    scheduled_at = models.DateTimeField(null=True, blank=True, db_column="ScheduledAt", db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_column="PublishedAt")
    expires_at = models.DateTimeField(null=True, blank=True, db_column="ExpiresAt", db_index=True)
    require_acknowledgement = models.BooleanField(default=False, db_column="RequireAcknowledgement")
    show_every_login = models.BooleanField(default=False, db_column="ShowEveryLogin")
    action_label = models.CharField(max_length=80, blank=True, default="", db_column="ActionLabel")
    action_url = models.URLField(blank=True, default="", db_column="ActionUrl")
    attachment = models.FileField(upload_to="announcements/%Y/%m/", null=True, blank=True, db_column="Attachment")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="created_announcements", db_column="CreatedBy")
    created_at = models.DateTimeField(auto_now_add=True, db_column="CreatedAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="UpdatedAt")
    class Meta:
        db_table = "PortalAnnouncement"
        ordering = ["-created_at"]

class PortalAnnouncementReceipt(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="ID")
    announcement = models.ForeignKey(PortalAnnouncement, on_delete=models.CASCADE, related_name="receipts", db_column="AnnouncementID")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcement_receipts", db_column="UserID")
    first_shown_at = models.DateTimeField(null=True, blank=True, db_column="FirstShownAt")
    last_shown_at = models.DateTimeField(null=True, blank=True, db_column="LastShownAt")
    shown_count = models.PositiveIntegerField(default=0, db_column="ShownCount")
    acknowledged_at = models.DateTimeField(null=True, blank=True, db_column="AcknowledgedAt")
    dismissed_at = models.DateTimeField(null=True, blank=True, db_column="DismissedAt")
    class Meta:
        db_table = "PortalAnnouncementReceipt"
        constraints = [models.UniqueConstraint(fields=["announcement", "user"], name="unique_announcement_receipt")]
        indexes = [models.Index(fields=["user", "acknowledged_at"]), models.Index(fields=["announcement", "acknowledged_at"])]
