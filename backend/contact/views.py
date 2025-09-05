from rest_framework import viewsets, permissions
from .models import Contact
from .serializers import ContactSerializer
from backend.permissions import IsAdminOrReadOnly

from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
import os

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAdminOrReadOnly]

TELEGRAM_BOT_TOKEN = "8473889809:AAEY-DK9qSvPII_rXVYvMNesM0kAjLn3AO0"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def urgent_call_request(request):
    contact_id = request.data.get('contact_id')
    client_name = request.data.get('client_name')
    client_phone = request.data.get('client_phone')

    if not all([contact_id, client_name, client_phone]):
        return Response({'error': 'Не всі поля заповнені'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        contact = Contact.objects.get(id=contact_id)
    except Contact.DoesNotExist:
        return Response({'error': 'Контакт не знайдено'}, status=status.HTTP_404_NOT_FOUND)

    message = f"📞 Терміново зателефонуйте клієнту {client_name} за номером {client_phone}."

    # Надіслати повідомлення в Telegram без бібліотеки
    try:
        telegram_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': contact.telegram_id,
            'text': message,
        }
        requests.post(telegram_url, data=payload)
    except Exception as e:
        print("Telegram error:", e)

    # Надіслати Email
    try:
        send_mail(
            subject="🔴 Терміновий дзвінок клієнту",
            message=message,
            from_email="workvs.market@gmail.com",
            recipient_list=[contact.email],
            fail_silently=True,
        )
    except Exception as e:
        print("Email error:", e)

    return Response({'detail': 'Повідомлення надіслано'}, status=status.HTTP_200_OK)
