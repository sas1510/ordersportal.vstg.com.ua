from datetime import date, datetime, timedelta
from django.conf import settings
from uuid import UUID
from zoneinfo import ZoneInfo
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import DeliveryNotificationState, DeliveryNotificationReceipt

def delivery_cutoff():
    configured = date.fromisoformat(str(getattr(settings, "DELIVERY_NOTIFICATION_START_DATE", "2026-10-12")))
    today = timezone.now().astimezone(ZoneInfo("Europe/Kyiv")).date()
    return max(configured, today - timedelta(days=7))


def normalize_delivery(item):
    guid = str(UUID(str(item["orderGuid"])))
    if not item.get("delivery"):
        return {"orderGuid": guid, "delivery": "", "number": str(item.get("number", ""))[:80], "calculation": str(item.get("calculation", ""))[:120]}
    raw = str(item["delivery"])
    planned = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if planned.tzinfo:
        planned = planned.astimezone(ZoneInfo("Europe/Kyiv"))
    if planned.date() < delivery_cutoff():
        return None
    key = planned.strftime("%Y-%m-%dT%H:%M")
    count = item.get("count")
    if count is not None:
        count = int(count)
        if count < 0 or count > 1000000:
            raise ValueError("Invalid construction count")
    return {"orderGuid": guid, "delivery": key, "number": str(item.get("number", ""))[:80], "calculation": str(item.get("calculation", ""))[:120], "count": count}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_delivery_notifications(request):
    if getattr(request.user, "role", "") not in {"customer", "dealer"}:
        return Response({"deliveries": []})
    # Only observations/receipts of the requesting user's currently displayed
    # orders are stored. No data is queried or sent to another user.
    rows = request.data.get("orders")
    if not isinstance(rows, list) or len(rows) > 10000:
        return Response({"error": "Некоректний список доставок."}, status=400)
    try:
        normalized = [normalize_delivery(item) for item in rows]
    except (ValueError, KeyError, TypeError):
        return Response({"error": "Некоректна дата або номер доставки."}, status=400)
    notices = []
    with transaction.atomic():
        state, _ = DeliveryNotificationState.objects.get_or_create(user=request.user)
        state = DeliveryNotificationState.objects.select_for_update().get(pk=state.pk)
        for item in normalized:
            if not item or not item["delivery"]:
                continue
            receipt, _ = DeliveryNotificationReceipt.objects.get_or_create(user=request.user, order_guid=item["orderGuid"], delivery_key=item["delivery"], defaults={"notify": bool(item["delivery"])})
            # Recover eligible dates previously suppressed by initial baselining.
            # Blank keys (unassigned or before cutoff) never trigger a notice.
            if item["delivery"] and not receipt.notify and receipt.shown_at is None:
                receipt.notify = True
                receipt.save(update_fields=["notify"])
            if receipt.notify and receipt.shown_at is None:
                notices.append({**item, "receiptId": receipt.pk})
        if not state.initialized:
            state.initialized = True
            state.save(update_fields=["initialized"])
    return Response({"deliveries": notices})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_delivery_notifications_shown(request):
    if getattr(request.user, "role", "") not in {"customer", "dealer"}:
        return Response({"error": "Сповіщення про доставку доступні лише дилерам."}, status=403)
    ids = request.data.get("ids")
    if not isinstance(ids, list) or len(ids) > 10000 or any(type(item) is not int or item <= 0 for item in ids):
        return Response({"error": "Некоректний список сповіщень."}, status=400)
    updated = DeliveryNotificationReceipt.objects.filter(user=request.user, pk__in=ids, notify=True, shown_at__isnull=True).update(shown_at=timezone.now())
    return Response({"marked": updated})
