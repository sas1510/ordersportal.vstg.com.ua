"""Read-only access policy for the internal dealer role."""
import re
from types import SimpleNamespace

from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
# These endpoints operate on authentication sessions, not business data.
SESSION_ACTIONS = {"/api/logout/", "/api/token/refresh/", "/api/dealer-preview/session/"}


def internal_dealer_is_readonly(user):
    return getattr(user, "role", None) == "internal_dealer" and not bool(
        getattr(user, "internal_dealer_can_edit", False)
    )


def internal_dealer_after_sales_access(user):
    owner = getattr(user, "user_id_1C", None)
    return getattr(user, "role", None) == "internal_dealer" and isinstance(owner, (bytes, bytearray, memoryview)) and len(owner) == 16


def after_sales_request_allowed(request, user, path):
    if not internal_dealer_after_sales_access(user):
        return False
    if path in {"/api/additional_orders/save_additional_order/", "/api/complaints/create_complaints/", "/api/complaints/media-token/"}:
        return request.method == "POST"
    match = re.fullmatch(r"/api/complaints/delete_complaint/([0-9a-fA-F-]{36})/", path)
    order = re.fullmatch(r"/api/orders/([0-9a-fA-F-]{36})/confirm/", path)
    if (match and request.method == "DELETE") or (order and request.method == "POST"):
        from django.db import connection
        from utils.GuidToBin1C import guid_to_1c_bin
        # Both document types use the claims directory; only an owned linked order may be confirmed.
        column = "Ссылка" if match else "ЗаказПокупателяПретензия"
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT TOP (1) Ссылка FROM [oknastyle_biV2].[dbo].[Документы.БВ_Претензия] WHERE {column}=%s AND Контрагент=%s AND ПометкаУдаления=0x00", [guid_to_1c_bin((match or order).group(1)), user.user_id_1C])
            return cursor.fetchone() is not None
    return False


def enforce_internal_dealer_readonly(request, user):
    if getattr(user, "role", None) != "internal_dealer":
        return
    path = request.path_info.rstrip("/") + "/"
    if internal_dealer_is_readonly(user) and not after_sales_request_allowed(request, user, path) and (
        (request.method not in SAFE_METHODS and path not in SESSION_ACTIONS) or path.endswith("/mark-read/")
    ):
        raise PermissionDenied("Доступний лише перегляд даних.")

    target = re.match(r"^/api/(calculations|orders|order|complaints)/([0-9a-fA-F-]{36})/", path)
    if target:
        from users.dealer_preview import dealer_owns_document
        from utils.GuidToBin1C import guid_to_1c_bin
        kind, guid = target.groups()
        if kind in {"order", "orders"}:
            from utils.contractor import ensure_order_action_access
            try:
                ensure_order_action_access(SimpleNamespace(user=user), guid)
            except (ValueError, PermissionError):
                raise PermissionDenied("Document access denied.")
        else:
            transaction_type = 2 if kind == "complaints" else 1
            if not dealer_owns_document(guid_to_1c_bin(guid), transaction_type, user.user_id_1C):
                raise PermissionDenied("Document access denied.")


class PortalJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result:
            enforce_internal_dealer_readonly(request, result[0])
        return result

