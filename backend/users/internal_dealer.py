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


def enforce_internal_dealer_readonly(request, user):
    if getattr(user, "role", None) != "internal_dealer":
        return
    path = request.path_info.rstrip("/") + "/"
    if internal_dealer_is_readonly(user) and (
        (request.method not in SAFE_METHODS and path not in SESSION_ACTIONS) or path.endswith("/mark-read/")
    ):
        raise PermissionDenied("Доступний лише перегляд даних.")

    target = re.match(r"^/api/(calculations|orders|order|complaints)/([0-9a-fA-F-]{36})/", path)
    if target:
        from users.dealer_preview import dealer_owns_document
        from utils.GuidToBin1C import guid_to_1c_bin
        kind, guid = target.groups()
        if kind == "order":
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
