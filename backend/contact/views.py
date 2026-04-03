from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMessage
import requests
from .models import HelpServiceContact, HelpServiceLog
from django.conf import settings

from rest_framework import viewsets
from .models import HelpServiceContact
from .serializers import ContactSerializer
from backend.permissions import IsAdminManagerOrReadOnly
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import HelpServiceLog
from .serializers import HelpServiceLogSerializer
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

# @extend_schema(
#     auth=[{"jwtAuth": []}],
# )
@extend_schema(exclude=True)
class ContactViewSet(viewsets.ModelViewSet):
    queryset = HelpServiceContact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAdminManagerOrReadOnly]


BOT_TOKEN = settings.BOT_TOKEN

@extend_schema(
    summary="Терміновий дзвінок клієнту (SOS)",
    description=(
        "Надсилає **терміновий запит на дзвінок** для обраного контакту служби підтримки.\n\n"
        "📌 Повідомлення відправляється:\n"
        "- у **Telegram** (якщо вказано telegram_id)\n"
        "- на **Email** (обовʼязково)\n\n"
        "🧾 Повідомлення містить:\n"
        "- імʼя клієнта\n"
        "- номер телефону клієнта\n\n"
        "📊 Результат зберігається в журналі SOS-викликів."
    ),
    tags=["urgent-call"],
    auth=[{"jwtAuth": []}],
    request=inline_serializer(
        name="UrgentCallRequest",
        fields={
            "contact_id": serializers.IntegerField(
                help_text="ID контакту служби підтримки, якому буде надіслано SOS-запит"
            )
        }
    ),
    responses={
        200: inline_serializer(
            name="UrgentCallResponse",
            fields={
                "detail": serializers.CharField(),
                "success": serializers.BooleanField(),
                "errors": serializers.ListField(
                    child=serializers.CharField(),
                    required=False
                ),
            }
        ),
        400: inline_serializer(
            name="UrgentCallError400",
            fields={"error": serializers.CharField()}
        ),
        404: inline_serializer(
            name="UrgentCallError404",
            fields={"error": serializers.CharField()}
        ),
    },
    exclude=True
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def urgent_call_request(request):
    contact_id = request.data.get('contact_id')  # кому відправляємо

    if not contact_id:
        return Response({'error': 'Не вказано контакт'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        contact = HelpServiceContact.objects.get(id=contact_id)
        recipient_email = contact.email.strip() if contact.email else None
        if not recipient_email:
            return Response({'error': 'Email контакту порожній'}, status=status.HTTP_400_BAD_REQUEST)

    except HelpServiceContact.DoesNotExist:
        return Response({'error': 'Контакт не знайдено'}, status=status.HTTP_404_NOT_FOUND)

    # Клієнт, що відправив запит
    client_name = getattr(request.user, 'full_name', None) or request.user.username
    client_phone = getattr(request.user, 'phone_number', None) or "Не вказано"

    message = f"📞 Терміново зателефонуйте клієнту {client_name} за номером {client_phone}."
    success = True
    errors = []

    # Telegram
    if contact.telegram_id:
        try:
            telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            resp = requests.post(telegram_url, data={'chat_id': contact.telegram_id, 'text': message}, timeout=10)
            resp.raise_for_status()
        except Exception as e:
            errors.append(f"Telegram error: {e}")
            success = False

    # Email через EmailMessage для підтримки кирилиці
    if recipient_email:
        try:
            email = EmailMessage(
                subject="🔴 Терміновий дзвінок клієнту",
                body=message,
                from_email=settings.EMAIL_HOST_USER,
                to=[recipient_email],
            )
            email.send(fail_silently=False)
        except Exception as e:
            errors.append(f"Email error: {e}")
            success = False

    # Логування
    try:
        HelpServiceLog.objects.create(
            create_date=datetime.now(),
            contact=contact,
            success=success,
            call_type=1,
            user=request.user
        )
    except Exception as e:
        errors.append(f"Logging error: {e}")

    response_data = {'detail': 'Повідомлення надіслано', 'success': success}
    if errors:
        response_data['errors'] = errors

    return Response(response_data, status=status.HTTP_200_OK)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import HelpServiceLog
from .serializers import HelpServiceLogSerializer

@extend_schema(
    summary="Журнал SOS-викликів",
    description=(
        "Повертає список **усіх термінових (SOS) викликів**.\n\n"
        "📌 Містить інформацію:\n"
        "- хто ініціював виклик\n"
        "- кому було відправлено повідомлення\n"
        "- дату та час\n"
        "- статус успішності\n\n"
        "🔐 **Доступ:**\n"
        "- JWT\n"
        "- зазвичай використовується адміністраторами"
    ),
    
    tags=["urgent-call"],
    auth=[{"jwtAuth": []}],
    exclude=True
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def help_log_list(request):
    """
    Повертає список усіх SOS-викликів (для адміністратора/менеджера),
    включаючи хто викликав і кому.
    """
    logs = HelpServiceLog.objects.select_related('contact', 'user').order_by('-create_date')
    serializer = HelpServiceLogSerializer(logs, many=True)
    return Response(serializer.data)
