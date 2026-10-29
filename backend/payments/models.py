"""Compatibility callables for already-applied historical migrations.

The funds-submission feature and its active model were removed. Do not remove
these functions while migration 0001 still references them.
"""
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from pathlib import Path
from uuid import uuid4

def private_transfer_storage():
    return FileSystemStorage(location=Path(settings.BASE_DIR) / 'private_uploads', base_url=None)

def transfer_photo_path(instance, filename):
    return f'funds_transfers/{uuid4().hex}{Path(filename).suffix.lower()}'

