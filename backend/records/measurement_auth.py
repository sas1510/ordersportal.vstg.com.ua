import secrets
from collections.abc import Mapping

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from users.models import CustomUser


class MeasurementApiKeyAuthentication(BaseAuthentication):
    """A server-to-server key may submit orders on behalf of a portal dealer ID."""

    def authenticate_header(self, request):
        return 'X-API-KEY'

    def authenticate(self, request):
        expected = getattr(settings, 'MEASUREMENT_API_KEY', '') or ''
        supplied = request.headers.get('X-API-KEY', '')
        if not expected or not supplied or not secrets.compare_digest(supplied.encode(), expected.encode()):
            raise AuthenticationFailed('Недійсний ключ інтеграції замірника.')
        request._measurement_key_valid = True
        if not isinstance(request.data, Mapping):
            raise ValidationError('Потрібен JSON-об’єкт.')
        user_id = request.data.get('user_id')
        if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id < 1:
            raise ValidationError({'user_id': 'Потрібен додатний цілий ID із portal_db.dbo.User.'})
        try:
            user = CustomUser.objects.get(pk=user_id, is_active=True)
        except CustomUser.DoesNotExist:
            raise PermissionDenied('Користувач недоступний для створення замовлення.')
        expires = user.expire_date
        if expires:
            if timezone.is_naive(expires):
                expires = timezone.make_aware(expires)
            if expires <= timezone.now():
                raise PermissionDenied('Термін доступу користувача завершився.')
        if str(user.role or '').strip().lower() not in {'dealer', 'customer'}:
            raise PermissionDenied('Ви не дилер. Створення заявки недоступне.')
        if not user.user_id_1C:
            raise PermissionDenied('Потрібен користувач дилера з прив’язкою UserId1C.')
        # Reuse the existing contractor resolution without allowing point overrides.
        return user, '1C_API_KEY'
