from rest_framework import status
from rest_framework.response import Response

from backend.utils.logging_setup import logger


FINANCE_RESTRICTED_ROLES = {"dealer", "customer"}


def finance_access_denied_response(request):
    """Return 403 when a dealer has no PermitFinanceInfo."""
    user = getattr(request, "user", None)
    if not getattr(user, "is_authenticated", False):
        return None

    role = str(getattr(user, "role", "") or "").strip()
    if role not in FINANCE_RESTRICTED_ROLES:
        return None

    if bool(getattr(user, "permit_finance_info", False)):
        return None

    logger.warning(
        "Finance access denied",
        extra={"tags": {
            "action": "finance_access",
            "status": "forbidden",
            "user": getattr(user, "username", "unknown"),
            "role": role,
        }},
    )
    return Response(
        {"detail": "Доступ до фінансової інформації вимкнено для вашого користувача."},
        status=status.HTTP_403_FORBIDDEN,
    )
