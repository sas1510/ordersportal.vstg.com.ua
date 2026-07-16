from django.http import JsonResponse

from backend.maintenance_mode import build_maintenance_payload, get_maintenance_state


class OneCMaintenanceMiddleware:
    EXEMPT_PREFIXES = (
        "/api/login/",
        "/api/logout/",
        "/api/token/refresh/",
        "/api/user/me/",
        "/api/system/maintenance/1c/",
        "/api/schema/",
        "/api/docs/",
        "/api/redoc/",
        "/api/webpush/",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path or ""

        if path.startswith("/api/") and not self._is_exempt(path):
            state = get_maintenance_state()
            if state["enabled"]:
                return JsonResponse(build_maintenance_payload(), status=503)

        return self.get_response(request)

    def _is_exempt(self, path):
        return any(path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES)
