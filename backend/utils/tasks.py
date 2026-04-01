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
from django.utils import timezone

from .BinToGuid1C import bin_to_guid_1c
from .GuidToBin1C import guid_to_1c_bin
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


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



@shared_task(name='check_and_send_telegram_notification')
def check_and_send_telegram_notification(message_id, recipient_guid_str, t_type, doc_number, is_dealer):
    from records.models import ChatMessage
    from django.conf import settings
    import os
    import requests
    
    try:
        msg = ChatMessage.objects.get(id=message_id)
        # Якщо повідомлення вже прочитане — нічого не шлемо
        if msg.is_read:
            return "Already read"

        recipient_bin = guid_to_1c_bin(recipient_guid_str)
        telegram_id = None

        # 1. Визначаємо назву типу документа для тексту
        document_names = {
            1: "прорахунку",
            2: "рекламації",
            3: "дозамовленні" 
        }
        document_type = document_names.get(t_type, "замовленні")
        
        # 2. Логіка формування посилання (ТІЛЬКИ для дилера)
        link_html = ""
        if is_dealer:
            pages_map = {
                1: "orders",
                2: "complaints",
                3: "additional-orders" 
            }
            page = pages_map.get(t_type, "orders")
            doc_year = msg.timestamp.year
            # Формуємо URL
            direct_link = f"{settings.FRONTEND_URL}{page}?search={doc_number}&year={doc_year}"
            link_html = f"\n\n🔗 <a href='{direct_link}'>Перейти до документа</a>"

        # 3. Отримуємо Telegram ID з бази
        with connection.cursor() as cursor:
            cursor.execute("EXEC [dbo].[GetTelegramID] @UserGUID=%s", [recipient_bin])
            row = cursor.fetchone()
            if row: 
                telegram_id = row[1]

        token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
        
        if telegram_id and token:

            text = (
                f"🔔 <b>Непрочитане повідомлення!</b>\n"
                f"У {document_type} <b>№{doc_number}</b>.\n\n"
                f"<i>\"{msg.text}...\"</i>"
                f"{link_html}"
            )

            requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage", 
                json={
                    "chat_id": telegram_id, 
                    "text": text, 
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True 
                },
                timeout=10
            )
            return f"Sent to TG {telegram_id} (Dealer: {is_dealer})"
            
        return "No telegram_id or token found"

    except ChatMessage.DoesNotExist:
        return "Message not found"
    except Exception as e:
        return str(e)



from dotenv import load_dotenv
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


load_dotenv()


from collections import defaultdict
from collections import defaultdict
from django.utils import timezone
from datetime import timedelta

# @shared_task(name='run_order_reminder_cron')
# def run_order_reminder_cron():
#     from records.models import ChatMessage
    
#     with connection.cursor() as cursor:
#         cursor.execute("EXEC [dbo].[GenerateOrderStuckNotifications]")
#         rows = cursor.fetchall()

#     channel_layer = get_channel_layer()
#     tg_token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
    

#     user_notifications = defaultdict(list)
    
#     for row in rows:
#         user_bin, order_num, status, hours, order_guid, tg_id, src_type = row
        

#         if hours >= 168: time_label, check_h = "більше 7 днів", 160
#         elif hours >= 48: time_label, check_h = "більше 48 год", 40
#         elif hours >= 24: time_label, check_h = "більше 24 год", 20
#         else: continue

#         already = ChatMessage.objects.filter(
#             related_object_id=order_guid,
#             event_type='ORDER_STUCK_REMINDER',
#             text__icontains=time_label,
#             timestamp__gt=timezone.now() - timedelta(hours=check_h)
#         ).exists()

#         if not already:
      
#             clean_text = f"{src_type} №{order_num.strip()} ({status}) — {time_label}"
            
#             user_notifications[user_bin].append({
#                 'order_num': order_num.strip(),
#                 'status': status,
#                 'time_label': time_label,
#                 'order_guid': order_guid,
#                 'tg_id': tg_id,
#                 'src_type': src_type,
#                 'text_simple': clean_text,
#                 'text_tg_row': f"• {clean_text}"
#             })


#     for user_bin, items in user_notifications.items():
#         if not items: continue


#         base_url = "https://ordersportal.vstg.com.ua"
#         current_year = timezone.now().year



#         for item in items:


#             path = '/orders'
#             if "Рекл" in item['src_type']: path = '/complaints'
#             elif "Доз" in item['src_type']: path = '/additional-orders'

         
#             order_link = f"{base_url}{path}?search={item['order_num']}&year={current_year}"
            

#             item['text_tg_row'] = f"• <a href='{order_link}'>{item['src_type']} №{item['order_num']}</a> ({item['status']}) — {item['time_label']}"


#             guid_str = bin_to_guid_1c(item['order_guid'])
#             t_id = 2 if "Рекл" in item['src_type'] else (3 if "Доз" in item['src_type'] else 1)
            
#             ChatMessage.objects.create(
#                 chat_id=f"{t_id}_{guid_str.replace('-','')}",
#                 text=item['text_simple'], 
#                 recipient=user_bin,
#                 related_object_id=item['order_guid'],
#                 is_notification=True,
#                 event_type='ORDER_STUCK_REMINDER',
#                 transaction_type_id=t_id,
#                 timestamp=timezone.now()
#             )


#         count = len(items)
#         if count == 1:
#             group_msg = items[0]['text_simple']
#         else:
#             # "У вас 5 замовлень потребують уваги (№01-331, №45-159...)"
#             order_nums = ", ".join([i['order_num'] for i in items[:3]]) # Беремо перші три 
#             if count > 3: order_nums += " та інші"
#             group_msg = f"У вас {count} замовлень потребують уваги: {order_nums}"

#         # 3. WEB PUSH
#         send_webpush_notification.delay(
#             user_bin, 
#             "Нагадування", 
#             group_msg
#         )

     
#         recipient_guid = bin_to_guid_1c(user_bin).lower()
#         async_to_sync(channel_layer.group_send)(
#             f"notify_{recipient_guid}",
#             {
#                 "type": "notification_message",
#                 "data": {
#                     "type": "ORDER_STUCK_REMINDER",
#                     "text": group_msg,
#                     "count": count
#                 }
#             }
#         )

#         # 5. Telegram 
#         tg_id = items[0]['tg_id']
#         if tg_id and tg_token:
#             dashboard_url = "https://ordersportal.vstg.com.ua/dashboard"
#             orders_list_text = "\n".join([i['text_tg_row'] for i in items])
            
#             full_tg_text = (
#                 f"⚠️ <b>У вас є замовлення, що потребують уваги:</b>\n\n"
#                 f"{orders_list_text}\n\n"
#                 f"🔗 <a href='{dashboard_url}'>Перейти на портал</a>"
#             )

#             try:
#                 requests.post(
#                     f"https://api.telegram.org/bot{tg_token}/sendMessage",
#                     json={
#                         "chat_id": tg_id,
#                         "text": full_tg_text,
#                         "parse_mode": "HTML",
#                         "disable_web_page_preview": True
#                     },
#                     timeout=10
#                 )
#             except Exception as e:
#                 logger.error(f"TG group send error: {e}")

#     return f"Processed {len(user_notifications)} users"

@shared_task(name='run_order_reminder_cron')
def run_order_reminder_cron():
    from records.models import ChatMessage
    import logging
    logger = logging.getLogger(__name__)
    
    with connection.cursor() as cursor:
        cursor.execute("EXEC [dbo].[GenerateOrderStuckNotifications]")
        rows = cursor.fetchall()

    channel_layer = get_channel_layer()
    tg_token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
    
    user_notifications = defaultdict(list)
    created_count = 0
    
    for row in rows:
        user_bin, order_num, status, hours, order_guid, tg_id, src_type = row
        
        # Визначаємо рівень сповіщення
        if hours >= 168: 
            time_label, check_h = "більше 7 днів", 160
        elif hours >= 48: 
            time_label, check_h = "більше 48 год", 40
        elif hours >= 24: 
            time_label, check_h = "більше 24 год", 20
        else: 
            continue

        # ПЕРЕВІРКА: чи саме ТАКЕ сповіщення вже було для цього замовлення
        already = ChatMessage.objects.filter(
            related_object_id=order_guid,
            event_type='ORDER_STUCK_REMINDER',
            text__icontains=time_label, # Шукаємо конкретно "48 год" або "24 год"
            timestamp__gt=timezone.now() - timedelta(hours=check_h)
        ).exists()

        if not already:
            clean_text = f"{src_type} №{order_num.strip()} ({status}) — {time_label}"
            
            # Зберігаємо дані для групової відправки
            item_data = {
                'order_num': order_num.strip(),
                'status': status,
                'time_label': time_label,
                'order_guid': order_guid,
                'tg_id': tg_id,
                'src_type': src_type,
                'text_simple': clean_text
            }
            user_notifications[user_bin].append(item_data)
            
            # 1. Створюємо запис у базу (ChatMessage) для історії кожного замовлення
            guid_str = bin_to_guid_1c(order_guid)
            t_id = 2 if "Рекл" in src_type else (3 if "Доз" in src_type else 1)
            
            ChatMessage.objects.create(
                chat_id=f"{t_id}_{guid_str.replace('-','')}",
                text=clean_text, 
                recipient=user_bin,
                related_object_id=order_guid,
                is_notification=True,
                event_type='ORDER_STUCK_REMINDER',
                transaction_type_id=t_id,
                timestamp=timezone.now()
            )
            created_count += 1

    # 2. Групова відправка сповіщень користувачам (WebPush, WebSockets, Telegram)
    for user_bin, items in user_notifications.items():
        if not items: continue

        base_url = "https://ordersportal.vstg.com.ua"
        current_year = timezone.now().year
        
        # Формуємо красивий список для Telegram
        tg_rows = []
        for item in items:
            path = '/orders'
            if "Рекл" in item['src_type']: path = '/complaints'
            elif "Доз" in item['src_type']: path = '/additional-orders'
            
            order_link = f"{base_url}{path}?search={item['order_num']}&year={current_year}"
            tg_rows.append(f"• <a href='{order_link}'>{item['src_type']} №{item['order_num']}</a> ({item['status']}) — <b>{item['time_label']}</b>")

        count = len(items)
        if count == 1:
            group_msg = items[0]['text_simple']
        else:
            nums = ", ".join([i['order_num'] for i in items[:3]])
            group_msg = f"У вас {count} замовлень потребують уваги ({nums}{' та інші' if count > 3 else ''})"

        # WEB PUSH
        send_webpush_notification.delay(user_bin, "Нагадування", group_msg)

        # WEB SOCKETS (Live update)
        recipient_guid = bin_to_guid_1c(user_bin).lower()
        async_to_sync(channel_layer.group_send)(
            f"notify_{recipient_guid}",
            {
                "type": "notification_message",
                "data": {"type": "ORDER_STUCK_REMINDER", "text": group_msg, "count": count}
            }
        )

        # TELEGRAM
        tg_id = items[0]['tg_id']
        if tg_id and tg_token:
            full_tg_text = (
                f"⚠️ <b>Замовлення, що потребують уваги:</b>\n\n"
                + "\n".join(tg_rows) +
                f"\n\n🔗 <a href='{base_url}/dashboard'>Перейти на портал</a>"
            )
            try:
                requests.post(
                    f"https://api.telegram.org/bot{tg_token}/sendMessage",
                    json={"chat_id": tg_id, "text": full_tg_text, "parse_mode": "HTML", "disable_web_page_preview": True},
                    timeout=10
                )
            except Exception as e:
                logger.error(f"TG send error: {e}")

    logger.info(f"Cron finished. Sent notifications for {created_count} order events across {len(user_notifications)} users.")
    return f"Processed {created_count} reminders"