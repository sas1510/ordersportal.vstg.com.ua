import json
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.utils import timezone


DEFAULT_MAINTENANCE_MESSAGE = (
    "Наразі наша база оновлюється, зачекайте декілька хвилин."
)

_RUNTIME_DIR = Path(settings.BASE_DIR) / "runtime"
_STATE_FILE = _RUNTIME_DIR / "one_c_maintenance_state.json"


def _default_state():
    return {
        "enabled": False,
        "manual_enabled": False,
        "scheduled_enabled": False,
        "window_configured": False,
        "message": DEFAULT_MAINTENANCE_MESSAGE,
        "starts_at": None,
        "ends_at": None,
        "updated_at": None,
        "updated_by": None,
        "source": None,
    }


def _parse_state_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        dt_value = value
    else:
        try:
            dt_value = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None

    if timezone.is_naive(dt_value):
        return timezone.make_aware(dt_value, timezone.get_current_timezone())

    return dt_value.astimezone(timezone.get_current_timezone())


def _build_state(raw_state):
    state = _default_state()
    manual_enabled = bool(
        raw_state.get("manual_enabled", raw_state.get("enabled"))
    )
    starts_at = raw_state.get("starts_at")
    ends_at = raw_state.get("ends_at")
    start_dt = _parse_state_datetime(starts_at)
    end_dt = _parse_state_datetime(ends_at)
    window_configured = bool(starts_at and ends_at and start_dt and end_dt)
    now_dt = timezone.now()
    scheduled_enabled = bool(
        window_configured and start_dt <= now_dt <= end_dt
    )

    state.update(
        {
            "enabled": bool(manual_enabled or scheduled_enabled),
            "manual_enabled": manual_enabled,
            "scheduled_enabled": scheduled_enabled,
            "window_configured": window_configured,
            "message": raw_state.get("message") or DEFAULT_MAINTENANCE_MESSAGE,
            "starts_at": starts_at,
            "ends_at": ends_at,
            "updated_at": raw_state.get("updated_at"),
            "updated_by": raw_state.get("updated_by"),
            "source": raw_state.get("source"),
        }
    )
    return state


def get_maintenance_state():
    if not _STATE_FILE.exists():
        return _default_state()

    try:
        data = json.loads(_STATE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _default_state()
    return _build_state(data)


def build_maintenance_payload():
    state = get_maintenance_state()
    return {
        "error": "database_recovery",
        "detail": state["message"],
        "maintenance": {
            "enabled": bool(state["enabled"]),
            "manual_enabled": bool(state["manual_enabled"]),
            "scheduled_enabled": bool(state["scheduled_enabled"]),
            "window_configured": bool(state["window_configured"]),
            "starts_at": state["starts_at"],
            "ends_at": state["ends_at"],
            "updated_at": state["updated_at"],
            "updated_by": state["updated_by"],
            "source": state["source"],
        },
    }


def set_maintenance_state(
    enabled=None,
    message=None,
    updated_by=None,
    starts_at=None,
    ends_at=None,
    clear_schedule=False,
    source=None,
):
    _RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    current_state = get_maintenance_state()
    manual_enabled = current_state["manual_enabled"]
    next_starts_at = current_state["starts_at"]
    next_ends_at = current_state["ends_at"]

    if enabled is not None:
        manual_enabled = bool(enabled)

    if clear_schedule:
        next_starts_at = None
        next_ends_at = None
    elif starts_at is not None or ends_at is not None:
        next_starts_at = starts_at
        next_ends_at = ends_at

    raw_state = {
        "enabled": bool(manual_enabled),
        "manual_enabled": bool(manual_enabled),
        "message": message or current_state["message"] or DEFAULT_MAINTENANCE_MESSAGE,
        "starts_at": next_starts_at,
        "ends_at": next_ends_at,
        "updated_at": timezone.now().isoformat(),
        "updated_by": updated_by,
        "source": source or current_state.get("source"),
    }

    _STATE_FILE.write_text(
        json.dumps(raw_state, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return get_maintenance_state()
