# consumers/notifications.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from backend.utils.BinToGuid1C import bin_to_guid_1c
# consumers/notifications.py
from records.models import ChatMessage
from channels.db import database_sync_to_async

from backend.utils.db_1c_lookups import get_author_name_from_db, get_document_number_by_guid


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # 1. Спробуємо взяти GUID з бази
        user_guid_bin = getattr(self.user, 'user_id_1C', None)
        user_guid_str = None

        if user_guid_bin:
            user_guid_str = bin_to_guid_1c(user_guid_bin).lower()
        else:
            # 2. Якщо в базі порожньо, спробуємо взяти з URL ?user_guid=...
            from urllib.parse import parse_qs
            query_string = self.scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            user_guid_str = query_params.get('user_guid', [None])[0]

        if user_guid_str:
            self.group_name = f"notify_{user_guid_str.lower()}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            print(f"DEBUG: Notification socket accepted for group {self.group_name}")
        else:
            print("DEBUG: No user_id_1C found in DB or URL params. Closing.")
            await self.close()

    async def notification_message(self, event):
   
        await self.send(text_data=json.dumps(event.get("data", {})))


    @database_sync_to_async
    def save_message(self, text, base_guid, recipient_bin):
        try:
 
            transaction_type_id = self.chat_id.split("_")[0]

            chat_msg = ChatMessage.objects.create(
                chat_id=self.chat_id,
                author=self.contractor_bin,
                recipient=recipient_bin,
                text=text,
                related_object_id=base_guid,
                transaction_type_id_id=transaction_type_id, 
                is_notification=False,
                is_read=False
            )

            if recipient_bin:
                ChatMessage.objects.create(
                    chat_id=self.chat_id,
                    author=self.contractor_bin,
                    recipient=recipient_bin,
                    text=f"Нове повідомлення: {text[:50]}",
                    related_object_id=base_guid,
                    transaction_type_id_id=transaction_type_id,
                    is_notification=True,
                    event_type="NEW_CHAT_MESSAGE",
                    is_read=False
                )

            return chat_msg
        except Exception as e:
            print(f"Error saving message/notification: {e}")
            return None