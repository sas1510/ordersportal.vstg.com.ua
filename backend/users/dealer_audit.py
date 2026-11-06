import hashlib
import logging
from uuid import uuid4

from django.core.cache import cache

from utils.logging_setup import logger as loki
from utils.portal_error_alerts import enqueue_alert

logger = logging.getLogger(__name__)
START_PATH = "/api/dealer-preview/start/"


def emit_dealer_audit(message, *, failed=False):
    level = logging.WARNING if failed else logging.INFO
    logger.log(level, message)
    loki.log(level, message, extra={"tags": {"feature": "dealer-delegation"}})


class DealerAuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path_info == "/api/dealer-preview/session/" and response.status_code < 400:
            return response
        start = request.path_info == START_PATH and request.method == "POST"
        scheme = request.META.get("HTTP_AUTHORIZATION", "").split(None, 1)
        delegated = bool(scheme and scheme[0].lower() == "dealerpreview")
        if not (start or delegated):
            return response

        data = getattr(response, "data", None)
        business_failure = isinstance(data, dict) and (
            data.get("success") is False or data.get("status") in ("error", "failed", "failure")
        )
        failed = response.status_code >= 400 or business_failure
        if not (start or failed or request.method not in {"GET", "HEAD", "OPTIONS"}):
            return response

        match = request.resolver_match
        route = match.route if match else "unresolved"
        actor, dealer = getattr(request, "dealer_audit_identity", (None, None))
        event_id = getattr(request, "_portal_error_id", None) or uuid4().hex[:12]
        outcome = "failed" if failed else "ok"
        emit_dealer_audit(
            f"Dealer delegation result event={event_id} actor={actor} dealer={dealer} "
            f"method={request.method} route={route} status={response.status_code} outcome={outcome}",
            failed=failed,
        )
        if failed and not getattr(request, "_portal_error_reported", False):
            fingerprint = hashlib.sha256(f"{request.method}|{route}|{response.status_code}|{business_failure}".encode()).hexdigest()
            try:
                if cache.add(f"dealer-audit-alert:{fingerprint}", True, timeout=300):
                    enqueue_alert(f"Помилка дії від імені дилера\nID: {event_id}\nHTTP: {response.status_code}\nШукай ID у Grafana (dealer-delegation).")
            except Exception:
                logger.warning("Dealer delegation alert could not be queued event=%s", event_id)
        return response
