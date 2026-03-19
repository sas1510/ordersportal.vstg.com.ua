from rest_framework import authentication, exceptions
from django.utils import timezone

class ApiKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('X-API-KEY')
        
        if not api_key:
            return None


        from .models import UserApiKey 

        try:
 
            key_obj = UserApiKey.objects.select_related('user').get(
                api_key=api_key,
                is_active=True,
                expire_date__gt=timezone.now()
            )
        except UserApiKey.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid API-key')

        return (key_obj.user, None)