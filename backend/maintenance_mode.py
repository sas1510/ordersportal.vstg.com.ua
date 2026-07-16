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
        "message": DEFAULT_MAINTENANCE_MESSAGE,
        "updated_at": None,
        "updated_by": None,
    }


def get_maintenance_state():
    if not _STATE_FILE.exists():
        return _default_state()

    try:
        data = json.loads(_STATE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _default_state()

    state = _default_state()
    state.update(
        {
            "enabled": bool(data.get("enabled")),
            "message": data.get("message") or DEFAULT_MAINTENANCE_MESSAGE,
            "updated_at": data.get("updated_at"),
            "updated_by": data.get("updated_by"),
        }
    )
    return state


def build_maintenance_payload():
    state = get_maintenance_state()
    return {
        "error": "database_recovery",
        "detail": state["message"],
        "maintenance": {
            "enabled": bool(state["enabled"]),
            "updated_at": state["updated_at"],
            "updated_by": state["updated_by"],
        },
    }


def set_maintenance_state(enabled, message=None, updated_by=None):
    _RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    state = {
        "enabled": bool(enabled),
        "message": message or DEFAULT_MAINTENANCE_MESSAGE,
        "updated_at": timezone.now().isoformat(),
        "updated_by": updated_by,
    }

    _STATE_FILE.write_text(
        json.dumps(state, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return state
