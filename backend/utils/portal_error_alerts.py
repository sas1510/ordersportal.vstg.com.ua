"""Bounded, non-blocking Telegram alerts without request data or secrets."""
import hashlib
import logging
import queue
import sys
import threading
import uuid
from pathlib import Path
from django.conf import settings
from django.core.cache import cache
from django.core.signals import got_request_exception
from django.dispatch import receiver

logger = logging.getLogger(__name__)
_queue = queue.Queue(maxsize=50)
_lock = threading.Lock()
_worker = None


def send_alert(text):
    import requests
    token = getattr(settings, "PORTAL_ERROR_TELEGRAM_BOT_TOKEN", "")
    chat_id = getattr(settings, "PORTAL_ERROR_TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        response = requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={"chat_id": chat_id, "text": text, "disable_web_page_preview": True}, timeout=5)
        if response.status_code != 200:
            logger.warning("Portal error Telegram alert rejected (HTTP %s)", response.status_code)
    except Exception:
        # Never log the URL, token, response body or exception text.
        logger.warning("Portal error Telegram alert transport failed")


def _run():
    while True:
        text = _queue.get()
        try:
            send_alert(text)
        finally:
            _queue.task_done()


def enqueue_alert(text):
    global _worker
    with _lock:
        if _worker is None or not _worker.is_alive():
            _worker = threading.Thread(target=_run, name="portal-error-alerts", daemon=True)
            _worker.start()
    try:
        _queue.put_nowait(text)
    except queue.Full:
        logger.warning("Portal error Telegram alert queue is full")


def report_error(request, exc_info=None):
    if getattr(request, "_portal_error_reported", False):
        return getattr(request, "_portal_error_id", None)
    error_id = getattr(request, "_portal_error_id", None) or str(uuid.uuid4())[:8].upper()
    request._portal_error_id = error_id
    request._portal_error_reported = True
    kind, _, tb = exc_info or sys.exc_info()
    error_type = kind.__name__ if kind else "ServerError"
    location = ""
    if tb:
        while tb.tb_next:
            tb = tb.tb_next
        location = f"{Path(tb.tb_frame.f_code.co_filename).name}:{tb.tb_lineno} ({tb.tb_frame.f_code.co_name})"
    # Do not expose URL parameters, body, cookies, user names, exception values
    # or stack-frame locals. Detailed traceback remains in the server logs.
    path = getattr(request, "path", "/")[:200]
    user = getattr(request, "user", None)
    user_id = getattr(user, "pk", None) if getattr(user, "is_authenticated", False) else None
    fingerprint = hashlib.sha256(f"{path}|{error_type}|{location}".encode()).hexdigest()
    try:
        if not cache.add(f"portal-error-alert:{fingerprint}", True, timeout=300):
            return error_id
    except Exception:
        return error_id  # Alerting must never break the error handler.
    if getattr(settings, "PORTAL_ERROR_TELEGRAM_BOT_TOKEN", "") and getattr(settings, "PORTAL_ERROR_TELEGRAM_CHAT_ID", ""):
        enqueue_alert(f"🚨 Помилка порталу\nID: {error_id}\n{getattr(request, 'method', '')} {path}\nТип: {error_type}\nМісце: {location or 'див. серверний лог'}\nКористувач ID: {user_id or 'неавторизований'}")
    return error_id


@receiver(got_request_exception, dispatch_uid="portal_error_telegram")
def on_request_exception(sender, request, **kwargs):
    try:
        report_error(request)
    except Exception:
        logger.warning("Portal error alert could not be queued")
