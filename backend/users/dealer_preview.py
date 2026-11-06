import logging
import re
from uuid import uuid4

import redis
from django.conf import settings

from django.core import signing
from django.db import connection
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from users.models import CustomUser
from utils.contractor import get_accessible_dealer_rows, get_dealer_scope_requester_ids
from utils.BinToGuid1C import bin_to_guid_1c
from utils.GuidToBin1C import guid_to_1c_bin

PREVIEW_ROLES = {"admin", "region_manager", "regionalManager", "branch_manager", "branches_director"}
DEALER_ROLES = {"customer", "dealer", "internal_dealer"}
SALT = "portal.dealer-preview.v1"
IDLE_SECONDS = 1800
MAX_AGE_SECONDS = 3600
SESSION_PATH = "/api/dealer-preview/session/"
_sessions = redis.Redis.from_url(settings.CELERY_BROKER_URL, socket_timeout=2, socket_connect_timeout=2)
logger = logging.getLogger(__name__)
BLOCKED_PREFIXES = (
    "/api/login/", "/api/logout/", "/api/token/", "/api/register/",
    "/api/change-password/", "/api/users/", "/api/admin/",
    "/api/dealer-preview/", "/api/user/telegram-link/", "/api/telegram-bot/",
    "/api/webpush/",
)


STAFF_PREVIEW_ROLES = PREVIEW_ROLES | {"manager", "director", "branch_manager", "branches_director"}
STAFF_READ_PATHS = {
    "/api/user/me/", "/api/user-name/", "/api/system/maintenance/1c/", "/api/users/all/",
    "/api/dealer-portal-users/", "/api/order/get_orders_info/", "/api/order/get_orders_info_all/",
    "/api/complaints/get_reclamation_info/", "/api/complaints/get_reclamation_info_all/",
    "/api/additional_orders/get_additional_orders_info/", "/api/additional_orders/get_additional_orders_info_all/",
    "/api/payments/get_payment_status_view/", "/api/payments/dealers/bills/",
    "/api/get_wds_codes/", "/api/bonus-products/", "/api/contacts/",
    "/api/media-resources/", "/api/media-categories/",
    "/api/dealer-portal-reports/", "/api/managers/", "/api/production-unified-analytics/", "/api/production-timeliness/", "/api/dealer-portal-comparison/",
    "/api/urgent-call-list/", "/api/portal-managers/",
}


def is_primary_admin(user):
    return user.username == "admin" and user.role == "admin" and user.is_active and user.is_superuser


def resolve_staff_preview(session):
    users = CustomUser.objects.filter(pk__in=[session["actor"], session["staff"]], is_active=True).in_bulk()
    actor = users.get(session["actor"])
    target = users.get(session["staff"])
    if not actor or not is_primary_admin(actor) or not target or (target.is_superuser and target.username != "admin_test") or target.role not in STAFF_PREVIEW_ROLES:
        raise PermissionDenied("Перегляд від імені працівника недоступний.")
    return target, actor.pk


def issue_preview_token(session):
    session = {**session, "sid": uuid4().hex}
    _sessions.set(f"portal:dealer-preview:{session['sid']}", "1", ex=IDLE_SECONDS)
    return signing.dumps(session, salt=SALT)


def load_preview_token(token):
    try:
        value = token.decode("ascii") if isinstance(token, bytes) else token
        session = signing.loads(value, salt=SALT, max_age=MAX_AGE_SECONDS)
        sid = session.get("sid")
        if not sid:
            # Existing tabs keep their original fixed 30-minute lifetime.
            return signing.loads(value, salt=SALT, max_age=IDLE_SECONDS)
        if not _sessions.exists(f"portal:dealer-preview:{sid}"):
            raise AuthenticationFailed("Сесія перегляду завершилася.")
        return session
    except (signing.BadSignature, UnicodeError):
        raise AuthenticationFailed("Сесія перегляду завершилася.")


def change_preview_session(session, *, end):
    sid = session.get("sid")
    if not sid:
        return
    key = f"portal:dealer-preview:{sid}"
    if end:
        _sessions.delete(key)
    elif not _sessions.expire(key, IDLE_SECONDS):
        raise AuthenticationFailed("Сесія перегляду завершилася.")


def dealer_owns_document(document_id, transaction_type, contractor):
    with connection.cursor() as cursor:
        cursor.execute("EXEC dbo.GetDocumentOwner @DocumentId=%s, @TransactionType=%s", [document_id, transaction_type])
        row = cursor.fetchone()
    return bool(row and row[0] and contractor and bytes(row[0]) == bytes(contractor))


def get_preview_dealer_rows(actor):
    """Add active internal dealers to preview only, preserving portfolio scope."""
    if actor.role not in PREVIEW_ROLES:
        raise PermissionDenied("Вхід від імені дилера недоступний для вашої ролі.")
    rows = list(get_accessible_dealer_rows(actor))
    seen = {
        str(bin_to_guid_1c(bytes(row["ContractorID"])) if isinstance(row.get("ContractorID"), (bytes, bytearray, memoryview)) else row.get("ContractorID", "")).lower()
        for row in rows
    }
    with connection.cursor() as cursor:
        for requester_id in dict.fromkeys(get_dealer_scope_requester_ids(actor)):
            cursor.execute("""
                SELECT DISTINCT C.Ссылка AS ContractorID, C.Код AS ContractorCode,
                    C.Наименование AS ContractorName,
                    C.ОсновнойМенеджерПокупателя AS MainManagerID
                FROM [portal_db].[dbo].[User] DealerUser
                JOIN [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C
                    ON C.Ссылка = DealerUser.UserId1C
                JOIN [portal_db].[dbo].[User] Requester ON Requester.Id = %s AND Requester.IsActive = 1
                WHERE DealerUser.Role = N'internal_dealer' AND DealerUser.IsActive = 1
                    AND C.ПометкаУдаления = 0x00
                    AND (Requester.Role = N'admin' OR (
                        Requester.Role IN (N'manager', N'region_manager') AND EXISTS (
                            SELECT 1 FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты.МенеджерыПокупателя] MP
                            WHERE MP.Ссылка = C.Ссылка AND MP.МенеджерПокупателя = Requester.UserId1C
                        )
                    ))
            """, [requester_id])
            columns = [column[0] for column in cursor.description]
            for values in cursor.fetchall():
                row = dict(zip(columns, values))
                key = str(bin_to_guid_1c(bytes(row["ContractorID"]))).lower()
                if key not in seen:
                    row["DealerRole"] = "internal_dealer"
                    rows.append(row)
                    seen.add(key)
    return sorted(rows, key=lambda row: str(row.get("ContractorName") or "").casefold())


def check_scope(actor, contractor_guid):
    if actor.role not in PREVIEW_ROLES:
        raise PermissionDenied("Вхід від імені дилера недоступний для вашої ролі.")
    allowed = {
        str(bin_to_guid_1c(bytes(row["ContractorID"])) if isinstance(row.get("ContractorID"), (bytes, bytearray, memoryview)) else row.get("ContractorID", "")).lower()
        for row in get_preview_dealer_rows(actor)
    }
    if contractor_guid.lower() not in allowed:
        raise PermissionDenied("Цей дилер не закріплений за вами.")


class DealerPreviewAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != b"dealerpreview":
            return None
        if len(parts) != 2:
            raise AuthenticationFailed("Некоректна сесія перегляду.")
        path = request.path_info.rstrip("/") + "/"
        session = load_preview_token(parts[1])
        if path == SESSION_PATH and request.method in {"POST", "DELETE"}:
            target, actor_id = resolve_staff_preview(session) if "staff" in session else resolve_dealer_session(parts[1], session=session, allow_readonly=True)
            return target, {"preview_session": session, "dealer_preview_actor": actor_id}

        if "staff" in session:
            target, actor_id = resolve_staff_preview(session)
            request._request.dealer_audit_identity = (actor_id, target.pk)
            if path == "/api/dealer-preview/start/" and request.method == "POST" and target.role in {"region_manager", "regionalManager"}:
                return target, {"dealer_preview_actor": actor_id, "staff_preview": True}
            if request.method not in {"GET", "HEAD", "OPTIONS"} or path not in STAFF_READ_PATHS:
                raise PermissionDenied("Режим перегляду працівника дозволяє лише читання.")
            return target, {"dealer_preview_actor": actor_id, "staff_preview": True}

        if (path.startswith(BLOCKED_PREFIXES) or path.endswith("/mark-read/")
                or (path == "/api/zamir/profile/" and request.method not in {"GET", "HEAD", "OPTIONS"})):
            raise PermissionDenied("Ця дія недоступна в делегованій сесії.")
        dealer, actor_id = resolve_dealer_session(parts[1], session=session, allow_readonly=True)
        request._request.dealer_audit_identity = (actor_id, dealer.pk)
        readonly = "via_staff" in session
        if readonly and (request.method not in {"GET", "HEAD", "OPTIONS"} or path not in STAFF_READ_PATHS | {
            "/api/balance/", "/api/partner-debts/", "/api/payments/get_dealer_payment_page_data/",
            "/api/payments/get_dealer_advance_balance/", "/api/payments/dealers/profile/",
            "/api/notifications/", "/api/notifications/count/", "/api/messages/", "/api/dealer-addresses/",
        }):
            raise PermissionDenied("Доступно лише читання кабінету дилера.")
        target = re.match(r"^/api/(calculations|orders|order|complaints(?:/delete_complaint)?)/([0-9a-fA-F-]{36})/", path)
        if target:
            kind, guid = target.groups()
            if kind.startswith("complaints") or kind == "calculations" or (kind == "orders" and "/files/" in path):
                document_type = 2 if kind.startswith("complaints") else 1
                allowed = dealer_owns_document(guid_to_1c_bin(guid), document_type, dealer.user_id_1C)
            else:
                from types import SimpleNamespace
                from utils.contractor import ensure_order_action_access
                try:
                    ensure_order_action_access(SimpleNamespace(user=dealer), guid)
                    allowed = True
                except (PermissionError, ValueError):
                    allowed = False
            if not allowed:
                raise PermissionDenied("Документ не належить вибраному дилеру.")

        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            logger.info("Delegated dealer action actor=%s dealer=%s method=%s path=%s", actor_id, dealer.pk, request.method, path)
        from users.internal_dealer import enforce_internal_dealer_readonly
        enforce_internal_dealer_readonly(request, dealer)
        return dealer, {"dealer_preview_actor": actor_id, "staff_preview": readonly}


def resolve_dealer_session(token, *, session=None, allow_readonly=False):
    if session is None:
        session = load_preview_token(token)
    if "staff" in session or ("via_staff" in session and not allow_readonly):
        raise PermissionDenied("Ця сесія не є сесією дилера.")
    users = CustomUser.objects.filter(pk__in=[session["actor"], session["dealer"]], is_active=True).in_bulk()
    actor = users.get(session["actor"])
    dealer = users.get(session["dealer"])
    if not actor or not dealer or dealer.role not in DEALER_ROLES or dealer.user_id_1C != guid_to_1c_bin(session["contractor"]):
        raise AuthenticationFailed("Сесія дилера більше недоступна.")
    if "via_staff" in session:
        staff, _ = resolve_staff_preview({"actor": actor.pk, "staff": session["via_staff"]})
        if staff.role not in {"region_manager", "regionalManager"}:
            raise PermissionDenied("Перегляд дилера недоступний.")
        check_scope(staff, session["contractor"])
    else:
        check_scope(actor, session["contractor"])
    return dealer, actor.pk
