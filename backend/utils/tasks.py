from celery import shared_task
from django.contrib.auth import get_user_model
from webpush import send_group_notification, send_user_notification
import logging
from datetime import timezone

User = get_user_model()
logger = logging.getLogger(__name__)
@shared_task(name='send_webpush_notification')
def send_webpush_notification(recipient_id_1c, title, message):
    try:
        # Змінюємо contractor_guid на user_id_1C
        user = User.objects.filter(user_id_1C=recipient_id_1c).first()
        
        if not user:
            logger.warning(f"Користувача з GUID {recipient_id_1c} не знайдено")
            return

        payload = {
            "head": title,
            "body": message,
            "icon": "/static/images/logo.png",
            "url": "/dashboard" 
        }

        send_user_notification(user=user, payload=payload, ttl=1000)
        logger.info(f"WebPush успішно відправлено для {user.username}")

    except Exception as e:
        logger.error(f"Помилка відправки WebPush: {str(e)}")




from celery import shared_task

from users.models import CustomUser

@shared_task
def delayed_notification_task(user_id, payload, ttl):
    try:
        user = CustomUser.objects.get(id=user_id)
        send_user_notification(user=user, payload=payload, ttl=ttl)
        return f"Notification sent to user {user_id} at {timezone.now()}"
    except CustomUser.DoesNotExist:
        pass