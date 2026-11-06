import logging
from uuid import UUID

from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from users.internal_dealer import PortalJWTAuthentication as JWTAuthentication
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import CustomUser
from utils.GuidToBin1C import guid_to_1c_bin
from .dealer_preview import DEALER_ROLES, STAFF_PREVIEW_ROLES, DealerPreviewAuthentication, change_preview_session, check_scope, is_primary_admin, issue_preview_token, resolve_staff_preview

logger = logging.getLogger(__name__)


@api_view(["GET", "POST"])
@authentication_classes([DealerPreviewAuthentication, JWTAuthentication])
@permission_classes([IsAuthenticated])
def start_dealer_preview(request):
    nested = isinstance(request.auth, dict) and request.auth.get("staff_preview")
    actor_id = request.auth["dealer_preview_actor"] if nested else request.user.pk
    request._request.dealer_audit_identity = (actor_id, None)
    if request.method == "GET" or "staff_id" in request.data:
        if nested or not is_primary_admin(request.user):
            raise PermissionDenied("Доступно лише головному адміністратору.")
        if request.method == "GET":
            users = CustomUser.objects.filter(Q(is_superuser=False) | Q(username="admin_test"), is_active=True, role__in=STAFF_PREVIEW_ROLES).exclude(pk=request.user.pk)
            return Response(list(users.order_by("full_name", "username").values("id", "full_name", "username", "role")))
        try:
            staff_id = int(request.data.get("staff_id"))
        except (TypeError, ValueError):
            raise ValidationError({"detail": "Виберіть працівника."})
        session = {"actor": request.user.pk, "staff": staff_id}
        target, _ = resolve_staff_preview(session)
        request._request.dealer_audit_identity = (request.user.pk, target.pk)
        return Response({"token": issue_preview_token(session)})

    try:
        contractor = str(UUID(str(request.data.get("contractor_guid"))))
    except (TypeError, ValueError):
        raise ValidationError({"contractor_guid": "Виберіть дилера."})
    check_scope(request.user, contractor)
    dealers = list(CustomUser.objects.filter(user_id_1C=guid_to_1c_bin(contractor), role__in=DEALER_ROLES, is_active=True).order_by("pk")[:2])
    if len(dealers) != 1:
        raise ValidationError({"detail": "Для дилера потрібен один активний обліковий запис порталу."})
    dealer = dealers[0]
    request._request.dealer_audit_identity = (actor_id, dealer.pk)
    session = {"actor": actor_id, "dealer": dealer.pk, "contractor": contractor}
    if nested:
        session["via_staff"] = request.user.pk
    token = issue_preview_token(session)
    logger.info("Dealer preview started actor=%s dealer=%s", actor_id, dealer.pk)
    return Response({"token": token})


@api_view(["POST", "DELETE"])
@authentication_classes([DealerPreviewAuthentication])
@permission_classes([IsAuthenticated])
def dealer_preview_session(request):
    change_preview_session(request.auth["preview_session"], end=request.method == "DELETE")
    return Response(status=204)
