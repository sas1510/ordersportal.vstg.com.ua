import hashlib
import secrets
from collections import Counter
from datetime import timedelta

from django.conf import settings
from asgiref.sync import async_to_sync
from django.db import DatabaseError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.onec_api import send_to_1c
from backend.utils.logging_setup import logger
from backend.permissions import IsAdminJWT
from users.models import CustomUser
from .models import TelegramBotApiKey, TelegramPortalLink
from .views import (
    get_orders_by_period_and_contractor, _notify_order_confirmation_participants,
    execute_stored_procedure, execute_additional_orders_procedure,
)


class HasTelegramBotApiKey(BasePermission):
    message = "\u041d\u0435\u0434\u0456\u0439\u0441\u043d\u0438\u0439 \u043a\u043b\u044e\u0447 \u0434\u043e\u0441\u0442\u0443\u043f\u0443 Telegram-\u0431\u043e\u0442\u0430."

    def has_permission(self, request, view):
        supplied_key = (request.headers.get("X-Portal-Bot-Key") or "").strip()
        if not supplied_key:
            return False

        # Keep the env key working during a gradual production rollout.
        env_key = (getattr(settings, "TELEGRAM_BOT_API_KEY", "") or "").strip()
        if env_key and secrets.compare_digest(supplied_key, env_key):
            return True

        try:
            key_hash = hashlib.sha256(supplied_key.encode("utf-8")).hexdigest()
            key = TelegramBotApiKey.objects.filter(
                key_hash=key_hash,
                is_active=True,
            ).first()
            if not key:
                return False
            TelegramBotApiKey.objects.filter(pk=key.pk).update(last_used_at=timezone.now())
            return True
        except DatabaseError:
            logger.exception("Telegram bot key database lookup failed")
            return False


STATUS_DEFINITIONS = (
    ("new", "Нові", "#6B98BF"),
    ("awaiting_confirmation", "Очікують підтвердження", "#ED8B33"),
    ("awaiting_payment", "Очікують оплату", "#D75C54"),
    ("confirmed", "Підтверджені", "#70A58A"),
    ("production", "У виробництві", "#B4D947"),
    ("delayed", "Запізнення", "#ED8B33"),
    ("ready", "Готові", "#70A58A"),
    ("shipped", "Відвантажені", "#6B98BF"),
    ("rejected", "Відмови", "#AEAEAE"),
)

def _clean(value):
    return " ".join(str(value or "").split())


def _status_key(value):
    normalized = _clean(value).lower()
    if any(part in normalized for part in ("відмова", "отказ")):
        return "rejected"
    if "підтверджен" in normalized or "подтвержден" in normalized:
        return "confirmed"
    if any(part in normalized for part in ("запіз", "просроч", "затрим")):
        return "delayed"
    if any(part in normalized for part in ("очікуємо оплат", "очикуємо оплат", "ожидаем оплат")):
        return "awaiting_payment"
    if any(part in normalized for part in ("очікуємо підтвердж", "очикуємо підтвердж", "ожидаем подтверж", "ескіз", "эскиз")):
        return "awaiting_confirmation"
    if any(part in normalized for part in ("виробниц", "производств", "в робот")):
        return "production"
    if any(part in normalized for part in ("відвантаж", "достав", "реаліз")):
        return "shipped"
    if "готов" in normalized:
        return "ready"
    if any(part in normalized for part in ("новий", "новое", "новый", "в обробці", "в обработке")):
        return "new"
    return "other"
def _serialise_order(order, calculation):
    return {
        "id": str(order.get("idGuid") or ""),
        "number": _clean(order.get("number")),
        "linked_order_number": _clean(order.get("linkedOrderNumber")) or None,
        "status": _clean(order.get("status")) or "\u041d\u043e\u0432\u0438\u0439",
        "status_key": _status_key(order.get("status")),
        "date": order.get("dateRaw").isoformat() if getattr(order.get("dateRaw"), "isoformat", None) else order.get("dateRaw"),
        "amount": round(float(order.get("amount") or 0), 2),
        "paid": round(float(order.get("paid") or 0), 2),
        "count": int(order.get("count") or 0),
        "currency": _clean(order.get("currency") or calculation.get("currency")) or "\u0433\u0440\u043d",
    }



def _iso_value(value):
    return value.isoformat() if getattr(value, "isoformat", None) else value


def _serialise_order_details(order, calculation):
    """Return portal details for an order already scoped to the linked dealer."""
    item = _serialise_order(order, calculation)
    amount = item["amount"]
    paid = item["paid"]
    item.update({
        "calculation_number": _clean(calculation.get("number")) or None,
        "calculation_date": _iso_value(calculation.get("dateRaw")),
        "dealer": _clean(calculation.get("dealer")) or None,
        "recipient": _clean(calculation.get("recipient")) or None,
        "delivery_address": _clean(order.get("deliveryAddress") or calculation.get("deliveryAddresses")) or None,
        "organization_name": _clean(order.get("organizationName")) or None,
        "debt": round(max(amount - paid, 0), 2),
        "planned_production_from": _iso_value(order.get("planProductionMin")),
        "planned_production_to": _iso_value(order.get("planProductionMax")),
        "actual_production_from": _iso_value(order.get("factProductionMin")),
        "actual_ready_from": _iso_value(order.get("factReadyMin")),
        "planned_delivery": _iso_value(order.get("planDelivery")),
        "planned_departure": _iso_value(order.get("planDeparture")),
        "realization_date": _iso_value(order.get("realizationDate")),
    })
    return item

def _linked_user(chat_id):
    try:
        return TelegramPortalLink.objects.select_related("user").get(
            telegram_chat_id=int(chat_id),
            user__is_active=True,
        ).user
    except (TelegramPortalLink.DoesNotExist, TypeError, ValueError):
        return None


def _orders_for_user(user, days=180):
    if not user.user_id_1C:
        return []
    today = timezone.localdate()
    calculations = get_orders_by_period_and_contractor(
        today - timedelta(days=days),
        today,
        user.user_id_1C,
    )
    return [
        _serialise_order(order, calculation)
        for calculation in calculations
        for order in (calculation.get("orders") or [])
        if order.get("idGuid") and order.get("number")
    ]


def _menu_payload(user, orders):
    counts = Counter(order["status_key"] for order in orders)
    return {
        "user": {"id": user.id, "name": user.full_name or user.username, "role": user.role},
        "status_counts": dict(counts),
        "buttons": [
            {"text": f"{label} ({counts.get(key, 0)})", "command": f"/orders {key}", "status": key, "color": color}
            for key, label, color in STATUS_DEFINITIONS
        ],
        "reply_keyboard": [
            ["\U0001f4e6 \u041c\u043e\u0457 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f", "\U0001f4ca \u0417\u0432\u0456\u0442 \u0437\u0430 \u0441\u044c\u043e\u0433\u043e\u0434\u043d\u0456"],
            ["\U0001f195 \u041d\u043e\u0432\u0456", "\u23f3 \u041e\u0447\u0456\u043a\u0443\u044e\u0442\u044c \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f"],
            ["\U0001f4b3 \u041e\u0447\u0456\u043a\u0443\u044e\u0442\u044c \u043e\u043f\u043b\u0430\u0442\u0443", "\U0001f3ed \u0423 \u0432\u0438\u0440\u043e\u0431\u043d\u0438\u0446\u0442\u0432\u0456"],
            ["\U0001f7e0 \u0417\u0430\u043f\u0456\u0437\u043d\u0435\u043d\u043d\u044f", "\u2705 \u0413\u043e\u0442\u043e\u0432\u0456"],
            ["\U0001f504 \u041e\u043d\u043e\u0432\u0438\u0442\u0438 \u043c\u0435\u043d\u044e", "\u2753 \u0414\u043e\u043f\u043e\u043c\u043e\u0433\u0430"],
        ],
    }


def _request_chat_id(request):
    return request.data.get("chat_id") if request.method == "POST" else request.query_params.get("chat_id")


@api_view(["GET", "POST"])
@permission_classes([IsAdminJWT])
def telegram_bot_admin_key(request):
    if request.method == "GET":
        key = TelegramBotApiKey.objects.filter(is_active=True).order_by("-created_at").first()
        return Response({
            "configured": bool(key),
            "key_prefix": key.key_prefix if key else None,
            "created_at": key.created_at if key else None,
        })

    raw_key = "tgb_" + secrets.token_urlsafe(32)
    with transaction.atomic():
        TelegramBotApiKey.objects.filter(is_active=True).update(is_active=False)
        key = TelegramBotApiKey.objects.create(
            key_hash=hashlib.sha256(raw_key.encode("utf-8")).hexdigest(),
            key_prefix=raw_key[:12],
            created_by=request.user,
        )
    logger.info("Telegram bot API key rotated by %s", request.user.username)
    return Response({
        "success": True,
        "api_key": raw_key,
        "key_prefix": key.key_prefix,
        "message": "\u041a\u043b\u044e\u0447 \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u043e. \u0421\u043a\u043e\u043f\u0456\u044e\u0439\u0442\u0435 \u0439\u043e\u0433\u043e \u0437\u0430\u0440\u0430\u0437: \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e \u0432\u0456\u043d \u043d\u0435 \u0432\u0456\u0434\u043e\u0431\u0440\u0430\u0437\u0438\u0442\u044c\u0441\u044f.",
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_link(request):
    chat_id = request.data.get("chat_id")
    user_guid = _clean(request.data.get("user_guid"))
    try:
        chat_id = int(chat_id)
        user_bin = guid_to_1c_bin(user_guid)
    except (TypeError, ValueError):
        return Response({"success": False, "error": "\u041d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u0439 chat_id \u0430\u0431\u043e user_guid."}, status=status.HTTP_400_BAD_REQUEST)
    user = CustomUser.objects.filter(user_id_1C=user_bin, is_active=True).first()
    if not user:
        return Response({"success": False, "error": "\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u043f\u043e\u0440\u0442\u0430\u043b\u0443 \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e."}, status=status.HTTP_404_NOT_FOUND)
    TelegramPortalLink.objects.update_or_create(telegram_chat_id=chat_id, defaults={"user": user})
    return Response({"success": True, "message": "Telegram \u043f\u0440\u0438\u0432'\u044f\u0437\u0430\u043d\u043e \u0434\u043e \u043f\u043e\u0440\u0442\u0430\u043b\u0443.", "user": user.full_name or user.username})


@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_menu(request):
    user = _linked_user(_request_chat_id(request))
    if not user:
        return Response({"success": False, "error": "\u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0432\u0438\u043a\u043e\u043d\u0430\u0439\u0442\u0435 /start \u0437 \u043a\u043e\u0434\u043e\u043c \u043f\u043e\u0440\u0442\u0430\u043b\u0443."}, status=status.HTTP_403_FORBIDDEN)
    try:
        return Response({"success": True, "data": _menu_payload(user, _orders_for_user(user))})
    except DatabaseError:
        logger.exception("Telegram bot menu database error for %s", user.username)
        return Response({"success": False, "error": "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0437 1\u0421."}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_orders(request):
    user = _linked_user(_request_chat_id(request))
    if not user:
        return Response({"success": False, "error": "Telegram \u043d\u0435 \u043f\u0440\u0438\u0432'\u044f\u0437\u0430\u043d\u0438\u0439 \u0434\u043e \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u043f\u043e\u0440\u0442\u0430\u043b\u0443."}, status=status.HTTP_403_FORBIDDEN)
    status_filter = _clean(request.query_params.get("status")).lower()
    period = _clean(request.query_params.get("period")).lower()
    try:
        if period == "month":
            today = timezone.localdate()
            calculations = get_orders_by_period_and_contractor(
                today.replace(day=1), today, user.user_id_1C,
            )
            orders = [
                _serialise_order(order, calculation)
                for calculation in calculations
                for order in (calculation.get("orders") or [])
                if order.get("idGuid") and order.get("number")
            ]
        else:
            orders = _orders_for_user(user)
    except DatabaseError:
        logger.exception("Telegram bot orders database error for %s", user.username)
        return Response({"success": False, "error": "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0437 1\u0421."}, status=status.HTTP_502_BAD_GATEWAY)
    if status_filter and status_filter != "all":
        orders = [order for order in orders if order["status_key"] == status_filter]
    return Response({"success": True, "orders": orders, "total": len(orders), "status": status_filter or "all", "period": period or "recent"})




@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_reclamations(request):
    user = _linked_user(_request_chat_id(request))
    if not user or not user.user_id_1C:
        return Response({"success": False, "error": "Telegram is not linked to a dealer profile."}, status=status.HTTP_403_FORBIDDEN)
    try:
        rows = async_to_sync(execute_stored_procedure)(user.user_id_1C, timezone.localdate().year)
        complaints = [{
            "id": str(row.get("ComplaintGuid") or ""),
            "number": _clean(row.get("ComplaintNumber") or row.get("Number") or row.get("ClaimNumber")),
            "status": _clean(row.get("StatusName") or row.get("Status") or "—"),
            "date": _iso_value(row.get("ComplaintDate") or row.get("Date")),
            "order_number": _clean(row.get("OrderNumber") or row.get("ClientOrderNumber")),
            "description": _clean(row.get("AdditionalInformation") or row.get("Description")),
        } for row in rows]
        return Response({"success": True, "reclamations": complaints, "total": len(complaints)})
    except DatabaseError:
        logger.exception("Telegram bot reclamations database error for %s", user.username)
        return Response({"success": False, "error": "Could not load reclamations from 1C."}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_additional_orders(request):
    user = _linked_user(_request_chat_id(request))
    if not user or not user.user_id_1C:
        return Response({"success": False, "error": "Telegram is not linked to a dealer profile."}, status=status.HTTP_403_FORBIDDEN)
    try:
        rows = execute_additional_orders_procedure(user.user_id_1C, timezone.localdate().year)
        additional_orders = [{
            "id": str(row.get("AdditionalOrderGuid") or ""),
            "number": _clean(row.get("AdditionalOrderNumber") or row.get("Number")),
            "status": _clean(row.get("StatusName") or row.get("Status") or "—"),
            "date": _iso_value(row.get("AdditionalOrderDate") or row.get("Date")),
            "order_number": _clean(row.get("OrderNumber") or row.get("ClaimOrderNumber")),
            "amount": round(float(row.get("DocumentAmount") or 0), 2),
            "paid": round(float(row.get("TotalPayments") or 0), 2),
            "count": int(row.get("ConstructionsQTY") or 0),
            "currency": _clean(row.get("Currency")) or "грн",
        } for row in rows]
        return Response({"success": True, "additional_orders": additional_orders, "total": len(additional_orders)})
    except DatabaseError:
        logger.exception("Telegram bot additional orders database error for %s", user.username)
        return Response({"success": False, "error": "Could not load additional orders from 1C."}, status=status.HTTP_502_BAD_GATEWAY)

@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_order_details(request):
    user = _linked_user(_request_chat_id(request))
    if not user:
        return Response({"success": False, "error": "Telegram is not linked to a portal user."}, status=status.HTTP_403_FORBIDDEN)

    order_id = _clean(request.query_params.get("order_id"))
    order_number = _clean(request.query_params.get("order_number"))
    if not order_id and not order_number:
        return Response({"success": False, "error": "Provide order_id or order_number."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        calculations = get_orders_by_period_and_contractor(
            timezone.localdate() - timedelta(days=180),
            timezone.localdate(),
            user.user_id_1C,
        )
        for calculation in calculations:
            for order in calculation.get("orders") or []:
                same_id = order_id and _clean(order.get("idGuid")).lower() == order_id.lower()
                same_number = order_number and _clean(order.get("number")) == order_number
                if same_id or same_number:
                    return Response({"success": True, "order": _serialise_order_details(order, calculation)})
    except DatabaseError:
        logger.exception("Telegram bot order details database error for %s", user.username)
        return Response({"success": False, "error": "Could not load order details from 1C."}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({"success": False, "error": "Order not found or not available for this dealer."}, status=status.HTTP_404_NOT_FOUND)

@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_daily_report(request):
    user = _linked_user(_request_chat_id(request))
    if not user:
        return Response({"success": False, "error": "Telegram \u043d\u0435 \u043f\u0440\u0438\u0432'\u044f\u0437\u0430\u043d\u0438\u0439 \u0434\u043e \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u043f\u043e\u0440\u0442\u0430\u043b\u0443."}, status=status.HTTP_403_FORBIDDEN)
    today = timezone.localdate()
    orders = _orders_for_user(user, days=1)
    today_orders = [order for order in orders if str(order.get("date") or "").startswith(today.isoformat())]
    return Response({"success": True, "report": {
        "date": today.isoformat(), "user_name": user.full_name or user.username,
        "orders_count": len(today_orders), "constructions_count": sum(order["count"] for order in today_orders),
        "turnover": round(sum(order["amount"] for order in today_orders), 2),
        "currency": next((order["currency"] for order in today_orders), "\u0433\u0440\u043d"),
        "statuses": dict(Counter(order["status_key"] for order in today_orders)),
    }})


@api_view(["GET"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_daily_recipients(request):
    links = TelegramPortalLink.objects.select_related("user").filter(user__is_active=True, user__role="customer")
    return Response({"success": True, "recipients": [{"chat_id": link.telegram_chat_id, "user_name": link.user.full_name or link.user.username} for link in links]})


@api_view(["POST"])
@permission_classes([HasTelegramBotApiKey])
def telegram_bot_confirm_order(request):
    user = _linked_user(_request_chat_id(request))
    order_id = _clean(request.data.get("order_id"))
    order_number = _clean(request.data.get("order_number"))
    linked_order_number = _clean(request.data.get("linked_order_number"))
    if not user:
        return Response({"success": False, "error": "Telegram \u043d\u0435 \u043f\u0440\u0438\u0432'\u044f\u0437\u0430\u043d\u0438\u0439 \u0434\u043e \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u043f\u043e\u0440\u0442\u0430\u043b\u0443."}, status=status.HTTP_403_FORBIDDEN)
    if not order_id or not order_number:
        return Response({"success": False, "error": "\u041f\u043e\u0442\u0440\u0456\u0431\u043d\u0456 order_id \u0442\u0430 order_number."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        owned_order = next((order for order in _orders_for_user(user) if order["id"].lower() == order_id.lower() and order["number"] == order_number), None)
    except DatabaseError:
        logger.exception("Telegram bot confirm lookup error for %s", user.username)
        return Response({"success": False, "error": "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0432 1\u0421."}, status=status.HTTP_502_BAD_GATEWAY)
    if not owned_order:
        logger.warning("Telegram bot denied confirmation of order %s for user %s", order_id, user.username)
        return Response({"success": False, "error": "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043d\u0435 \u043d\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u0446\u044c\u043e\u043c\u0443 \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0443."}, status=status.HTTP_403_FORBIDDEN)
    current_status = owned_order["status"].lower()
    if any(value in current_status for value in ("\u0435\u0441\u043a\u0456\u0437 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436", "\u0440\u0438\u0441\u0443\u043d\u043e\u043a - \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d", "\u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e", "\u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e")):
        return Response({"success": False, "error": "\u0426\u0435 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0432\u0436\u0435 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u0435."}, status=status.HTTP_409_CONFLICT)
    is_sketch = order_number.upper().startswith("34-")
    try:
        result = send_to_1c("SetOrderStatus", {"order_id": order_id, "status_code": "000000017" if is_sketch else "000000002"})
    except Exception:
        logger.exception("Telegram bot could not confirm order %s", order_id)
        return Response({"success": False, "error": "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f \u0432 1\u0421."}, status=status.HTTP_502_BAD_GATEWAY)
    if not isinstance(result, dict) or result.get("success") is not True:
        error = result.get("error", "1\u0421 \u043d\u0435 \u0437\u043c\u0456\u043d\u0438\u043b\u0430 \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f.") if isinstance(result, dict) else "1\u0421 \u043f\u043e\u0432\u0435\u0440\u043d\u0443\u043b\u0430 \u043d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0443 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u0434\u044c."
        return Response({"success": False, "error": error}, status=status.HTTP_502_BAD_GATEWAY)
    _notify_order_confirmation_participants(request_user=user, order_number=order_number, linked_order_number=linked_order_number or owned_order.get("linked_order_number") or "", is_sketch_order=is_sketch)
    logger.info("Telegram bot confirmed order %s for user %s", order_number, user.username)
    return Response({"success": True, "message": "\u0415\u0441\u043a\u0456\u0437 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e." if is_sketch else "\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e."})
