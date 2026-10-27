import base64
import hashlib
import hmac
import json
import secrets
import time
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework import serializers
from users.models import CustomUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication


class ZamirTicketView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response['Cache-Control'] = 'no-store, private'
        response['Pragma'] = 'no-cache'
        return response

    def dealer_access_error(self, user):
        if not user.is_active or str(user.role or '').strip().lower() != 'admin':
            return Response({'detail': 'Замірник тимчасово доступний лише адміністраторам.'}, status=403)
        expires = user.expire_date
        if expires:
            if timezone.is_naive(expires):
                expires = timezone.make_aware(expires)
            if expires <= timezone.now():
                return Response({'detail': 'Термін доступу користувача завершився.'}, status=403)
        return None

    def get(self, request):
        user = request.user
        denied = self.dealer_access_error(user)
        if denied is not None:
            return denied
        email = (user.email or '').strip()
        try:
            validate_email(email)
        except ValidationError:
            return Response({'detail': 'Для входу в замірник заповніть коректний email.', 'code': 'email_required'}, status=400)
        if not getattr(user, 'email_confirmed', False):
            return Response({'detail': 'Підтвердьте актуальну пошту для входу в замірник.', 'code': 'email_required'}, status=400)
        key = getattr(settings, 'MEASUREMENT_API_KEY', '') or ''
        if not key:
            return Response({'detail': 'Інтеграцію замірника не налаштовано.'}, status=503)
        payload = {'user_id': user.pk, 'email': email,
            'name': (user.full_name or user.username or '').strip(),
            'exp': int(time.time()) + 60, 'nonce': secrets.token_urlsafe(24)}
        data = base64.urlsafe_b64encode(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).rstrip(b'=').decode('ascii')
        signature = hmac.new(key.encode('utf-8'), data.encode('ascii'), hashlib.sha256).hexdigest()
        return Response({'ticket': f'{data}.{signature}'})


class ZamirEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class ZamirProfileView(ZamirTicketView):
    def get(self, request):
        denied = self.dealer_access_error(request.user)
        if denied is not None:
            return denied
        email = (request.user.email or '').strip()
        try:
            validate_email(email)
            required = not bool(getattr(request.user, 'email_confirmed', False))
        except ValidationError:
            required = True
        return Response({'email': email, 'email_required': required})

    def post(self, request):
        denied = self.dealer_access_error(request.user)
        if denied is not None:
            return denied
        serializer = ZamirEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip()
        if CustomUser.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
            return Response({'email': ['Ця адреса вже використовується іншим користувачем.']}, status=400)
        user = request.user
        if (user.email or '') != email or not user.email_confirmed:
            user.email = email
            # The dealer explicitly confirms the address in the portal form.
            user.email_confirmed = True
            user.save(update_fields=['email', 'email_confirmed'])
        return Response({'email': email, 'email_required': False})
