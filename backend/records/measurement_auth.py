import secrets
from collections.abc import Mapping

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import APIException, AuthenticationFailed, ValidationError
from users.models import CustomUser


class MeasurementFallbackUnavailable(APIException):
    status_code = 503
    default_detail = 'Контрагента «Дилер Портал» не знайдено в 1С.'


class MeasurementIntegrationUser:
    is_authenticated = True
    pk = None
    full_name = 'Дилер Портал'

    def __init__(self, source_user_id=None):
        self.measurement_source_user_id = source_user_id
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT TOP (2) Ссылка
                FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты]
                WHERE Код = %s AND Наименование = %s AND ПометкаУдаления = 0x00
                """,
                ['000046216', self.full_name],
            )
            rows = cursor.fetchall()
        if len(rows) != 1:
            raise MeasurementFallbackUnavailable()
        self.user_id_1C = bytes(rows[0][0])


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
        if user_id is None or (isinstance(user_id, str) and not user_id.strip()):
            return MeasurementIntegrationUser(), '1C_API_KEY'
        if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id < 1:
            raise ValidationError({'user_id': 'Потрібен додатний цілий ID із portal_db.dbo.User.'})
        try:
            user = CustomUser.objects.get(pk=user_id, is_active=True)
        except CustomUser.DoesNotExist:
            return MeasurementIntegrationUser(user_id), '1C_API_KEY'
        expires = user.expire_date
        if expires:
            if timezone.is_naive(expires):
                expires = timezone.make_aware(expires)
            if expires <= timezone.now():
                return MeasurementIntegrationUser(user_id), '1C_API_KEY'
        can_submit = str(user.role or '').strip().lower() in {'dealer', 'customer'} or (
            user.role == "internal_dealer" and user.internal_dealer_can_edit
        )
        if not can_submit or not user.user_id_1C:
            return MeasurementIntegrationUser(user_id), '1C_API_KEY'
        return user, '1C_API_KEY'
