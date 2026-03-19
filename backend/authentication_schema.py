from drf_spectacular.extensions import OpenApiAuthenticationExtension


class OneCApiKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "backend.authentication.OneCApiKeyAuthentication"
    name = "ApiKeyAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-KEY",
        }
