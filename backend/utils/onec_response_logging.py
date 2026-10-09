"""Log every 1C HTTP response before status checks or JSON parsing."""

import json
import logging
import uuid


logger = logging.getLogger("onec.responses")
logger.setLevel(logging.INFO)
# Emit to stderr so both web services and Celery expose responses in journalctl.
logger.propagate = False
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)


def log_1c_response(response, *args, **kwargs):
    """Requests response hook; does not log credentials or request headers."""
    from utils.user_action_audit import audit_1c_response
    try:
        audit_1c_response(response)
    except Exception:
        logger.exception("Failed to audit 1C response")
    response_id = uuid.uuid4().hex
    query = response.request.headers.get("Query", "unknown")
    body = response.text
    # Keep each record small enough for journals, without dropping response data.
    chunk_size = 2000
    parts = max(1, (len(body) + chunk_size - 1) // chunk_size)
    level = logging.ERROR if response.status_code >= 400 else logging.INFO
    for index in range(parts):
        logger.log(
            level,
            "1C response id=%s query=%s status=%s part=%s/%s body=%s",
            response_id, query, response.status_code, index + 1, parts,
            json.dumps(body[index * chunk_size:(index + 1) * chunk_size], ensure_ascii=False),
        )
    return response
