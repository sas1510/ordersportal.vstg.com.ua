from urllib.parse import urlencode

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.urls import reverse


SUPPORT_CHAT_ATTACHMENT_TOKEN_SALT = "records.support_chat_attachment"


def get_support_chat_attachment_token_max_age():
    return int(getattr(settings, "SUPPORT_CHAT_ATTACHMENT_TOKEN_MAX_AGE", 360000))


def get_support_chat_attachment_signer():
    return TimestampSigner(salt=SUPPORT_CHAT_ATTACHMENT_TOKEN_SALT)


def build_support_chat_attachment_token(attachment_id):
    return get_support_chat_attachment_signer().sign(str(attachment_id))


def build_support_chat_attachment_url(
    attachment_id,
    route_name,
    request=None,
    absolute=False,
):
    token = build_support_chat_attachment_token(attachment_id)
    path = reverse(route_name, kwargs={"attachment_id": attachment_id})
    signed_path = f"{path}?{urlencode({'token': token})}"

    if absolute and request is not None:
        return request.build_absolute_uri(signed_path)

    return signed_path


def validate_support_chat_attachment_token(attachment_id, token):
    try:
        unsigned_value = get_support_chat_attachment_signer().unsign(
            token,
            max_age=get_support_chat_attachment_token_max_age(),
        )
    except SignatureExpired:
        return False, "expired"
    except BadSignature:
        return False, "invalid"

    if unsigned_value != str(attachment_id):
        return False, "mismatch"

    return True, "ok"
