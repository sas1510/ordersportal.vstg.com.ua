# consumers/notifications.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from backend.utils.BinToGuid1C import bin_to_guid_1c
# consumers/notifications.py
from records.models import ChatMessage
from channels.db import database_sync_to_async

from backend.utils.db_1c_lookups import get_author_name_from_db, get_document_number_by_guid
from backend.utils.logging_setup import logger

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        user_info = f"User(id={self.user.id if self.user else 'Anon'})"
        

        user_guid_bin = getattr(self.user, 'user_id_1C', None)
        user_guid_str = None

        if user_guid_bin:
            user_guid_str = bin_to_guid_1c(user_guid_bin).lower()
            # logger.info(f"Notification socket: Found GUID in DB for {user_info}: {user_guid_str}")
        else:
        
            from urllib.parse import parse_qs
            query_string = self.scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            user_guid_str = query_params.get('user_guid', [None])[0]

            # if user_guid_str:
            #     logger.info(f"Notification socket: Using GUID from URL for {user_info}: {user_guid_str}")

        if user_guid_str:
            self.group_name = f"notify_{user_guid_str.lower()}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            # logger.info(f"Notification socket ACCEPTED. Group: {self.group_name} | Channel: {self.channel_name}")
        else:
            # logger.warning(f"Notification socket REJECTED: No GUID found for {user_info}. Closing connection.", extra={
            #         'tags': {
            #             'action': 'connect_notification_socket'
                    
            #         }
            #     })
            await self.close()


    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            # logger.info(f"Notification socket DISCONNECTED. Group: {self.group_name} | Code: {close_code}")


    async def notification_message(self, event):

        data = event.get("data", {})
        # logger.info(f"Pushing notification to UI. Group: {self.group_name} | Type: {data.get('type')}")
        
   
        await self.send(text_data=json.dumps(data))


    @database_sync_to_async
    def save_message(self, text, base_guid, recipient_bin):
        try:
            chat_id = getattr(self, 'chat_id', 'unknown')
 
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


            # logger.info(f"Notification/Message records created in DB. Chat: {chat_id}")
            return chat_msg
        except Exception as e:
            logger.error(f"Error in NotificationConsumer.save_message: {str(e)}", exc_info=True, extra={
                    'tags': {
                        'action': 'save_message_notification_socket'
                    
                    }
                })
            return None