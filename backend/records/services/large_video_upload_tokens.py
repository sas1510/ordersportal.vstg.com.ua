from datetime import timedelta
from secrets import token_urlsafe
from urllib.parse import urlencode

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone

from ..models import ChatLargeVideoUploadToken


LARGE_VIDEO_UPLOAD_TOKEN_SALT = "records.large_video_upload"


def get_large_video_upload_token_ttl_seconds():
    return int(getattr(settings, "SUPPORT_CHAT_LARGE_VIDEO_UPLOAD_TTL", 7200))


def get_large_video_upload_signer():
    return TimestampSigner(salt=LARGE_VIDEO_UPLOAD_TOKEN_SALT)


def build_large_video_upload_signed_token(token_value):
    return get_large_video_upload_signer().sign(token_value)


def build_large_video_upload_portal_url(signed_token):
    base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    return f"{base_url}/support/video-upload?{urlencode({'token': signed_token})}"


def create_large_video_upload_token(
    *,
    message,
    original_file_name=None,
    telegram_chat_id=None,
    telegram_message_id=None,
):
    raw_token = token_urlsafe(32)
    token_record = ChatLargeVideoUploadToken.objects.create(
        message=message,
        chat_id=message.chat_id,
        token=raw_token,
        original_file_name=original_file_name,
        expires_at=timezone.now() + timedelta(seconds=get_large_video_upload_token_ttl_seconds()),
        telegram_chat_id=telegram_chat_id,
        telegram_message_id=telegram_message_id,
    )
    signed_token = build_large_video_upload_signed_token(raw_token)
    return token_record, signed_token


def validate_large_video_upload_signed_token(signed_token):
    if not signed_token:
        return None, "missing"

    try:
        raw_token = get_large_video_upload_signer().unsign(
            signed_token,
            max_age=get_large_video_upload_token_ttl_seconds(),
        )
    except SignatureExpired:
        return None, "expired"
    except BadSignature:
        return None, "invalid"

    token_record = (
        ChatLargeVideoUploadToken.objects
        .select_related("message")
        .filter(token=raw_token)
        .first()
    )

    if not token_record:
        return None, "invalid"

    if token_record.is_used:
        return token_record, "used"

    if token_record.expires_at <= timezone.now():
        return token_record, "expired"

    if token_record.chat_id != token_record.message.chat_id:
        return token_record, "mismatch"

    return token_record, "ok"


def mark_large_video_upload_token_used(token_record, attachment_id):
    token_record.is_used = True
    token_record.used_at = timezone.now()
    token_record.uploaded_attachment_id = attachment_id
    token_record.save(update_fields=["is_used", "used_at", "uploaded_attachment_id"])
