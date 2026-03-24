# from celery import shared_task
# from django.contrib.auth import get_user_model
# from webpush import send_group_notification, send_user_notification
# import logging
# from datetime import timezone

# User = get_user_model()
# logger = logging.getLogger(__name__)
# @shared_task(name='send_webpush_notification')
# def send_webpush_notification(recipient_id_1c, title, message):
#     try:

#         user = User.objects.filter(user_id_1C=recipient_id_1c).first()
        
#         if not user:
#             logger.warning(f"Користувача з GUID {recipient_id_1c} не знайдено")
#             return

#         base_url = "https://ordersportal.vstg.com.ua"

#         payload = {
#             "head": title,
#             "body": message,
#             "icon": f"{base_url}/header_logo_small.svg", 
#             "badge": f"{base_url}/header_logo_small.svg",
#             "url": f"{base_url}/dashboard" 
#         }

#         send_user_notification(user=user, payload=payload, ttl=1000)
#         logger.info(f"WebPush успішно відправлено для {user.username}")

#     except Exception as e:
#         logger.error(f"Помилка відправки WebPush: {str(e)}")




# from celery import shared_task
# from dotenv import load_dotenv
# from users.models import CustomUser

# @shared_task
# def delayed_notification_task(user_id, payload, ttl):
#     try:
#         user = CustomUser.objects.get(id=user_id)
#         send_user_notification(user=user, payload=payload, ttl=ttl)
#         return f"Notification sent to user {user_id} at {timezone.now()}"
#     except CustomUser.DoesNotExist:
#         pass



# import os
# import requests
# from celery import shared_task
# from django.db import connection
# from .GuidToBin1C import guid_to_1c_bin


# @shared_task(name='check_and_send_telegram_notification')
# def check_and_send_telegram_notification(message_id, recipient_guid_str):
#     from records.models import ChatMessage  
#     import requests
    
#     try:
#         # 1. Знаходимо повідомлення
#         msg = ChatMessage.objects.get(id=message_id)
        
#         # 2. Якщо вже прочитано — виходимо
#         if msg.is_read:
#             return f"Message {message_id} is already read."

#         # 3. Викликаємо процедуру
#         recipient_bin = guid_to_1c_bin(recipient_guid_str)
#         telegram_id = None
        
#         with connection.cursor() as cursor:
#             cursor.execute("EXEC [dbo].[GetTelegramID] @UserGUID=%s", [recipient_bin])
#             row = cursor.fetchone()
#             if row:
#                 telegram_id = row[1]


#         current_dir = os.path.dirname(os.path.abspath(__file__))
#         dotenv_path = os.path.join(current_dir, '..', '.env')

#         if os.path.exists(dotenv_path):
#             load_dotenv(dotenv_path)
#             # print(f"DEBUG: .env завантажено з {dotenv_path}") # Можна розкоментувати для перевірки
#         else:
#             # Якщо попередній шлях не спрацював, спробуємо прямий шлях від кореня сервера
#             load_dotenv('/var/www/html/ordersportal.vstg.com.ua/backend/.env')

#         # 4. Відправка в Telegram
#         if telegram_id:
#             token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
            
#             # Перевірка токена
#             get_me = requests.get(f"https://api.telegram.org/bot{token}/getMe").json()
#             if not get_me.get("ok"):
#                 return f"TG Token Error: {get_me.get('description')}"

#             # ФОРМУЄМО ТЕКСТ (обов'язково!)
#             notification_text = (
#                 f"🔔 <b>Непрочитане повідомлення!</b>\n"
#                 f"Ви отримали повідомлення в чаті:\n\n"
#                 f"<i>\"{msg.text[:150]}\"</i>"
#             )
            
#             url = f"https://api.telegram.org/bot{token}/sendMessage"
#             response = requests.post(url, json={
#                 "chat_id": telegram_id,
#                 "text": notification_text,
#                 "parse_mode": "HTML"
#             })
            
#             res_data = response.json()
#             if res_data.get("ok"):
#                 return f"Notification sent to TG: {telegram_id}"
#             else:
#                 return f"TG API Error: {res_data.get('description')}"
        
#         return "Telegram ID not found for this user."

#     except Exception as e:
#         return f"Task failed: {str(e)}"
    


# # backend/utils/tasks.py
# from celery import shared_task
# from django.db import connection
# from datetime import datetime, timedelta
# from asgiref.sync import async_to_sync
# from channels.layers import get_channel_layer
# from records.models import ChatMessage
# from .BinToGuid1C import bin_to_guid_1c
# import os
# import requests

# @shared_task(name='run_order_reminder_cron')
# def run_order_reminder_cron():
#     with connection.cursor() as cursor:
#         cursor.execute("EXEC [dbo].[GenerateOrderStuckNotifications]")
#         rows = cursor.fetchall()

#     channel_layer = get_channel_layer()
#     tg_token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')

#     for row in rows:
#         user_bin, order_num, status, hours, order_guid, tg_id, src_type = row

#         # 🔥 ПЕРЕВІРКА ГОДИН (Django side)
#         # Визначаємо "вікна": 24-26 годин або 48-50 годин
#         is_24h = 24 <= hours <= 42  # Спіймаємо в перший день після прострочення 24г
#         is_48h = 48 <= hours <= 66  # Спіймаємо на другий день

#         if is_24h or is_48h:
#             # Перевіряємо, чи ми вже створювали таке сповіщення за останні 12 годин
#             # щоб не спамити, якщо крон запуститься двічі в одному вікні
#             already_notified = ChatMessage.objects.filter(
#                 RelatedObjectId=order_guid,
#                 EventType='ORDER_STUCK_REMINDER',
#                 Timestamp__gt=datetime.now() - timedelta(hours=12)
#             ).exists()

#             if not already_notified:
#                 msg_text = f"Нагадування: {src_type} №{order_num} у статусі '{status}' вже {hours} год."

#                 # 1. Зберігаємо в БД (IsSentVtg=0 спочатку)
#                 new_msg = ChatMessage.objects.create(
#                     ChatId=f"sys_stuck_{order_num}",
#                     Text=msg_text,
#                     RecipientId=user_bin,
#                     RelatedObjectId=order_guid,
#                     IsNotification=True,
#                     EventType='ORDER_STUCK_REMINDER',
#                     IsRead=False,
#                     IsSentVtg=False
#                 )

#                 # 2. WebSocket (Миттєвий "дзвіночок")
#                 recipient_guid = bin_to_guid_1c(user_bin).lower()
#                 async_to_sync(channel_layer.group_send)(
#                     f"notify_{recipient_guid}",
#                     {
#                         "type": "notification_message",
#                         "data": {
#                             "type": "ORDER_STUCK_REMINDER",
#                             "text": msg_text,
#                             "order_num": order_num
#                         }
#                     }
#                 )

#                 # 3. Web Push (через існуючий таск)
#                 from backend.utils.tasks import send_webpush_notification
#                 send_webpush_notification.delay(
#                     recipient_id_1c=user_bin, 
#                     title="Замовлення зависло",
#                     message=msg_text
#                 )

#                 # 4. Telegram
#                 if tg_id and tg_token:
#                     url = f"https://api.telegram.org/bot{tg_token}/sendMessage"
#                     res = requests.post(url, json={
#                         "chat_id": tg_id,
#                         "text": f"⚠️ <b>{msg_text}</b>",
#                         "parse_mode": "HTML"
#                     })
#                     if res.status_code == 200:
#                         new_msg.IsSentVtg = True
#                         new_msg.save()

#     return f"Processed {len(rows)} potential orders."

import os
import requests
import logging
from datetime import datetime, timedelta
from django.db import connection
from django.contrib.auth import get_user_model
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from webpush import send_user_notification

# Використовуємо відносні імпорти, щоб уникнути ModuleNotFoundError
from .BinToGuid1C import bin_to_guid_1c
from .GuidToBin1C import guid_to_1c_bin

User = get_user_model()
logger = logging.getLogger(__name__)

# --- 1. WebPush Task ---
@shared_task(name='send_webpush_notification')
def send_webpush_notification(recipient_id_1c, title, message):
    try:
        user = User.objects.filter(user_id_1C=recipient_id_1c).first()
        if not user:
            return f"User {recipient_id_1c} not found"

        base_url = "https://ordersportal.vstg.com.ua"
        payload = {
            "head": title,
            "body": message,
            "icon": f"{base_url}/header_logo_small.svg",
            "url": f"{base_url}/dashboard"
        }
        send_user_notification(user=user, payload=payload, ttl=1000)
        return f"WebPush sent to {user.username}"
    except Exception as e:
        return f"WebPush error: {str(e)}"

# --- 2. Telegram Reminder (для звичайних чатів) ---
@shared_task(name='check_and_send_telegram_notification')
def check_and_send_telegram_notification(message_id, recipient_guid_str):
    from records.models import ChatMessage
    try:
        msg = ChatMessage.objects.get(id=message_id)
        if msg.is_read:
            return "Already read"

        recipient_bin = guid_to_1c_bin(recipient_guid_str)
        telegram_id = None
        
        with connection.cursor() as cursor:
            cursor.execute("EXEC [dbo].[GetTelegramID] @UserGUID=%s", [recipient_bin])
            row = cursor.fetchone()
            if row: telegram_id = row[1]

        token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
        if telegram_id and token:
            text = f"🔔 <b>Непрочитане повідомлення!</b>\n\n<i>\"{msg.text[:150]}\"</i>"
            requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={
                "chat_id": telegram_id, "text": text, "parse_mode": "HTML"
            })
            return f"Sent to TG {telegram_id}"
    except Exception as e:
        return str(e)

# --- 3. ГОЛОВНИЙ КРОН (24/48 годин) ---
@shared_task(name='run_order_reminder_cron')
def run_order_reminder_cron():
    from records.models import ChatMessage
    
    with connection.cursor() as cursor:
        cursor.execute("EXEC [dbo].[GenerateOrderStuckNotifications]")
        rows = cursor.fetchall()

    channel_layer = get_channel_layer()
    tg_token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')

    for row in rows:
        user_bin, order_num, status, hours, order_guid, tg_id, src_type = row

        # Розширюємо вікно до 20 годин, щоб ранковий крон не дублював вечірній
        # Усередині run_order_reminder_cron змінити фільтр і створення:

# 1. Виправляємо фільтрацію (поля маленькими літерами)
        already_notified = ChatMessage.objects.filter(
            related_object_id=order_guid,          # було RelatedObjectId
            event_type='ORDER_STUCK_REMINDER',    # було EventType
            timestamp__gt=datetime.now() - timedelta(hours=20) # було Timestamp
        ).exists()

        if not already_notified:
            msg_text = f"Нагадування: {src_type} №{order_num} у статусі '{status}' вже {hours} год."

            # Нам потрібно визначити ID для TransactionTypeID. 
            # Зазвичай: 1 - Прорахунок, 2 - Рекламація, 3 - Доп. замовлення.
            # Спробуємо розпарсити src_type або задати дефолт.
            
            t_type_id = 1 # Дефолт (Прорахунок)
            if "Рекламація" in src_type:
                t_type_id = 2
            elif "Дозамовлення" in src_type:
                t_type_id = 3


            clean_guid_hex = guid_to_1c_bin(order_guid)
            generated_chat_id = f"1_{clean_guid_hex}"

            # Створення запису в БД
            new_msg = ChatMessage.objects.create(
                chat_id=generated_chat_id,
                text=msg_text,
                recipient=user_bin,
                related_object_id=order_guid,
                is_notification=True,
                event_type='ORDER_STUCK_REMINDER',
                is_read=False,
                is_sent_vtg=False,
                # ДОДАЄМО ТИП ТРАНЗАКЦІЇ (ForeignKey очікує ID або об'єкт)
                transaction_type_id=t_type_id 
            )
    
    # Решта логіки (WebSocket, Telegram) залишається без змін, 
    # лише перевір, чи ти не звертаєшся до new_msg.IsSentVtg нижче (має бути new_msg.is_sent_vtg)
            # 2. WebSocket (Дзвіночок)
            recipient_guid = bin_to_guid_1c(user_bin).lower()
            async_to_sync(channel_layer.group_send)(
                f"notify_{recipient_guid}",
                {
                    "type": "notification_message",
                    "data": {
                        "type": "ORDER_STUCK_REMINDER",
                        "text": msg_text,
                        "order_num": order_num
                    }
                }
            )

            # 3. Web Push (через delay)
            send_webpush_notification.delay(user_bin, "Замовлення зависло", msg_text)

            # 4. Telegram
            if tg_id and tg_token:
                res = requests.post(f"https://api.telegram.org/bot{tg_token}/sendMessage", json={
                    "chat_id": tg_id,
                    "text": f"⚠️ <b>{msg_text}</b>",
                    "parse_mode": "HTML"
                })
                if res.status_code == 200:
                    new_msg.IsSentVtg = True
                    new_msg.save()

    return f"Processed {len(rows)} orders"
