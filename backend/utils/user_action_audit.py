"""Admin request audit, correlated with 1C calls, without request body logging."""
import json
import logging
import time
import uuid
from contextvars import ContextVar

_request = ContextVar("audit_request", default=None)
_IDENTIFIERS = {"id", "user_id", "order_id", "orderNumber", "order_number", "number", "calculationGUID", "calculation_guid", "contractor_guid", "contract", "branchId", "branch_id", "username", "query", "task_id"}


def safe_identifiers(value, depth=0):
    """Allowlisted references only: never serialize arbitrary payloads."""
    if depth > 2:
        return {}
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key in _IDENTIFIERS and isinstance(item, (str, int)):
                result[key] = str(item)[:150]
            elif isinstance(item, (dict, list)):
                nested = safe_identifiers(item, depth + 1)
                if nested:
                    result[key] = nested
        return result
    if isinstance(value, list):
        return [references for item in value[:20] if (references := safe_identifiers(item, depth + 1))]
    return {}


def actor_fields(user):
    if not getattr(user, "is_authenticated", False) or str(getattr(user, "role", "")).lower() != "admin":
        return None
    return {"user_id": user.pk, "username": user.username, "role": user.role}


def current_actor():
    request = _request.get()
    fields = actor_fields(getattr(request, "user", None))
    if fields:
        fields.update(request_id=request.audit_request_id, path=request.path, method=request.method)
    return fields


def emit_audit(event, fields):
    record = {"event": event, **fields}
    try:
        from utils.logging_setup import logger
        logger.info(json.dumps(record, ensure_ascii=False, default=str), extra={"tags": {"component": "user_audit", "action": event}})
    except Exception:
        # An unavailable log sink must never break an operation/payment.
        logging.getLogger("user_audit").exception("Audit sink unavailable")


def audit_1c_response(response):
    fields = current_actor()
    if not fields:
        return
    result = "http_error" if response.status_code >= 400 else "received"
    try:
        body = response.json()
        if isinstance(body, dict):
            if body.get("success") is False or any(isinstance(item, dict) and item.get("success") is False for item in (body.get("results") or [])):
                result = "rejected"
            elif body.get("success") is True or body.get("results"):
                result = "success"
        else:
            result = "unconfirmed"
    except (ValueError, TypeError):
        result = "invalid_response"
    emit_audit("admin_1c_response", {
        **fields, "query": response.request.headers.get("Query", "unknown"),
        "http_status": response.status_code, "result": result,
        "duration_ms": round(response.elapsed.total_seconds() * 1000),
    })


class AdminActionAuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.audit_request_id = uuid.uuid4().hex
        token = _request.set(request)
        started = time.monotonic()
        response = None
        references = {}
        try:
            length = int(request.META.get("CONTENT_LENGTH") or 0)
            if request.content_type == "application/json" and 0 < length <= 65536:
                references = safe_identifiers(json.loads(request.body))
        except (AttributeError, ValueError, TypeError):
            pass
        try:
            response = self.get_response(request)
            return response
        finally:
            try:
                fields = current_actor()
                if fields and request.path.startswith("/api/") and request.method not in {"OPTIONS", "HEAD"}:
                    match = getattr(request, "resolver_match", None)
                    targets = dict(getattr(match, "kwargs", {}) or {})
                    code = getattr(response, "status_code", 500)
                    emit_audit("admin_action", {
                        **fields, "action": getattr(match, "view_name", None) or request.path,
                        "targets": targets, "references": references,
                        "created_objects": safe_identifiers(getattr(response, "data", None)) if request.method == "POST" else {},
                        "http_status": code,
                        "result": "accepted" if code == 202 else "success" if code < 400 else "failed",
                        "duration_ms": round((time.monotonic() - started) * 1000),
                    })
            finally:
                _request.reset(token)
