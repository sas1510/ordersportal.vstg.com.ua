from django.db import models
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from pathlib import Path
from uuid import uuid4

def private_transfer_storage():
    return FileSystemStorage(location=Path(settings.BASE_DIR) / 'private_uploads', base_url=None)

def transfer_photo_path(instance, filename):
    return f'funds_transfers/{uuid4().hex}{Path(filename).suffix.lower()}'

class FundsTransferSubmission(models.Model):
    contractor_guid = models.UUIDField(db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='UAH')
    comment = models.TextField(blank=True)
    photo = models.FileField(storage=private_transfer_storage, upload_to=transfer_photo_path)
    created_at = models.DateTimeField(auto_now_add=True)
    manager_notification_status = models.CharField(max_length=12, default='pending', db_index=True)
    manager_notified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at', '-pk']

# Create your models here.
