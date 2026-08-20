from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PortalAnnouncement, PortalAnnouncementReceipt
from users.models import CustomUser

ADMIN_ROLES = {"admin"}

def _admin(request):
    return str(getattr(request.user, "role", "")).lower() in ADMIN_ROLES

def _serialize(announcement, receipt=None, include_stats=False):
    data = {
        "id": announcement.id, "title": announcement.title, "body": announcement.body,
        "style": announcement.style, "status": announcement.status,
        "audience_mode": announcement.audience_mode, "audience_roles": announcement.audience_roles or [],
        "audience_user_ids": list(announcement.audience_users.values_list("id", flat=True)),
        "scheduled_at": announcement.scheduled_at, "published_at": announcement.published_at,
        "expires_at": announcement.expires_at, "require_acknowledgement": announcement.require_acknowledgement,
        "show_every_login": announcement.show_every_login, "action_label": announcement.action_label,
        "action_url": announcement.action_url, "attachment_url": announcement.attachment.url if announcement.attachment else "",
        "created_at": announcement.created_at, "created_by": getattr(announcement.created_by, "full_name", None) or getattr(announcement.created_by, "username", ""),
    }
    if receipt:
        data["receipt"] = {"shown_count": receipt.shown_count, "acknowledged_at": receipt.acknowledged_at, "dismissed_at": receipt.dismissed_at}
    if include_stats:
        qs = announcement.receipts.all()
        data["stats"] = {"total": qs.count(), "shown": qs.filter(first_shown_at__isnull=False).count(), "acknowledged": qs.filter(acknowledged_at__isnull=False).count(), "dismissed": qs.filter(dismissed_at__isnull=False).count()}
    return data

def _targets(announcement):
    qs = CustomUser.objects.filter(is_active=True)
    if announcement.audience_mode == "roles":
        return qs.filter(role__in=announcement.audience_roles or [])
    if announcement.audience_mode == "users":
        return announcement.audience_users.filter(is_active=True)
    return qs

def _publish_due():
    now = timezone.now()
    due = PortalAnnouncement.objects.filter(status="scheduled", scheduled_at__lte=now)
    for item in due:
        item.status, item.published_at = "active", now
        item.save(update_fields=["status", "published_at", "updated_at"])
        PortalAnnouncementReceipt.objects.bulk_create([PortalAnnouncementReceipt(announcement=item, user=user) for user in _targets(item)], ignore_conflicts=True)
    PortalAnnouncement.objects.filter(status="active", expires_at__isnull=False, expires_at__lte=now).update(status="finished")

def _save(request, instance=None):
    data = request.data
    item = instance or PortalAnnouncement(created_by=request.user)
    for name in ("title", "body", "style", "audience_mode", "action_label", "action_url"):
        if name in data: setattr(item, name, data.get(name) or "")
    for name in ("require_acknowledgement", "show_every_login"):
        if name in data: setattr(item, name, str(data.get(name)).lower() in ("true", "1", "yes"))
    for name in ("scheduled_at", "expires_at"):
        if name in data:
            value = data.get(name) or None
            parsed = parse_datetime(value) if value else None
            if parsed and timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            setattr(item, name, parsed)
    roles = data.get("audience_roles", [])
    if isinstance(roles, str): roles = [x for x in roles.split(",") if x]
    item.audience_roles = roles
    requested_status = data.get("status", item.status)
    if requested_status in {"draft", "cancelled"}: item.status = requested_status
    elif item.scheduled_at and item.scheduled_at > timezone.now(): item.status = "scheduled"
    else: item.status, item.published_at = "active", item.published_at or timezone.now()
    if request.FILES.get("attachment"): item.attachment = request.FILES["attachment"]
    item.save()
    ids = data.get("audience_user_ids", [])
    if isinstance(ids, str): ids = [x for x in ids.split(",") if x]
    if item.audience_mode == "users": item.audience_users.set(CustomUser.objects.filter(id__in=ids))
    else: item.audience_users.clear()
    if item.status == "active":
        PortalAnnouncementReceipt.objects.bulk_create([PortalAnnouncementReceipt(announcement=item, user=user) for user in _targets(item)], ignore_conflicts=True)
    return item

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def announcements(request):
    _publish_due()
    if not _admin(request): return Response({"detail": "Forbidden"}, status=403)
    if request.method == "POST": return Response(_serialize(_save(request), include_stats=True), status=201)
    return Response([_serialize(item, include_stats=True) for item in PortalAnnouncement.objects.all()])

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def announcement_detail(request, pk):
    if not _admin(request): return Response({"detail": "Forbidden"}, status=403)
    item = PortalAnnouncement.objects.get(pk=pk)
    if request.method == "DELETE": item.delete(); return Response(status=204)
    return Response(_serialize(_save(request, item), include_stats=True))

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_announcements(request):
    _publish_due(); now = timezone.now()
    receipts = PortalAnnouncementReceipt.objects.select_related("announcement").filter(user=request.user, announcement__status="active").filter(Q(announcement__expires_at__isnull=True)|Q(announcement__expires_at__gt=now)).filter(acknowledged_at__isnull=True).filter(Q(announcement__show_every_login=True)|Q(dismissed_at__isnull=True)).order_by("announcement__published_at")
    result=[]
    for receipt in receipts:
        receipt.shown_count += 1
        receipt.last_shown_at = now
        receipt.first_shown_at = receipt.first_shown_at or now
        receipt.save(update_fields=["shown_count", "last_shown_at", "first_shown_at"])
        result.append(_serialize(receipt.announcement, receipt))
    return Response(result)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_receipt(request, pk):
    receipt = PortalAnnouncementReceipt.objects.get(announcement_id=pk, user=request.user)
    action = request.data.get("action")
    if action == "acknowledge": receipt.acknowledged_at = timezone.now()
    elif action == "dismiss" and not receipt.announcement.require_acknowledgement: receipt.dismissed_at = timezone.now()
    else: return Response({"detail": "Invalid action"}, status=400)
    receipt.save(); return Response({"success": True})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_receipts(request, pk):
    if not _admin(request): return Response({"detail": "Forbidden"}, status=403)
    rows = PortalAnnouncementReceipt.objects.filter(announcement_id=pk).select_related("user")
    return Response([{ "user_id": r.user_id, "user": r.user.full_name or r.user.username, "role": r.user.role, "shown_count": r.shown_count, "first_shown_at": r.first_shown_at, "last_shown_at": r.last_shown_at, "acknowledged_at": r.acknowledged_at, "dismissed_at": r.dismissed_at } for r in rows])
