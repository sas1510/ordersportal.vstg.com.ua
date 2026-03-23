# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from records.models import ChatMessage
# from backend.utils.GuidToBin1C import guid_to_1c_bin
# from backend.utils.contractor_ws import resolve_contractor_ws
# # Імпортуємо оновлені утиліти, що працюють через процедури
# from backend.utils.db_1c_lookups import get_author_name_from_db, get_document_number_by_guid, get_document_year_by_guid
# from channels.db import database_sync_to_async



# class ChatConsumer(AsyncWebsocketConsumer):

#     async def connect(self):
#         self.user = self.scope.get("user")

#         if not self.user or self.user.is_anonymous:
#             await self.close(code=4001)
#             return

#         try:
#             self.contractor_bin, self.contractor_guid = resolve_contractor_ws(self.scope)
#         except Exception:
#             await self.close(code=4003)
#             return

#         self.chat_id = self.scope['url_route']['kwargs']['chat_id']
#         self.room_group_name = f'chat_{self.chat_id}'

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         if hasattr(self, 'room_group_name'):
#             await self.channel_layer.group_discard(self.room_group_name, self.channel_name)




#     # Оберни існуючі функції (або виклик у коді)
#     @database_sync_to_async
#     def sync_get_doc_number(guid, t_type):
#         return get_document_number_by_guid(guid, t_type)

#     @database_sync_to_async
#     def sync_get_doc_year(guid, t_type):
#         return get_document_year_by_guid(guid, t_type)

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#         except json.JSONDecodeError:
#             await self.send_error("Некоректний формат JSON")
#             return

#         message_text = data.get('message')
#         base_transaction_guid = data.get('base_transaction_guid')
#         recipient_id_1c = data.get('recipient_id_1c')
#         transaction_type = data.get('transaction_type_id')

#         if not base_transaction_guid:
#             await self.send_error("Відсутній GUID")
#             return

#         try:
#             base_guid = guid_to_1c_bin(base_transaction_guid)
#             recipient_bin = guid_to_1c_bin(recipient_id_1c) if recipient_id_1c else None
#         except Exception:
#             await self.send_error("Некоректний GUID")
#             return

#         if not message_text or not message_text.strip():
#             await self.send_error("Порожнє повідомлення")
#             return

#         # 🔥 ЗБЕРЕЖЕННЯ (повертає об'єкт повідомлення та сформований текст сповіщення)
#         saved_msg, notify_text = await self.save_message(
#             message_text,
#             base_guid,
#             recipient_bin
#         )

#         if not saved_msg:
#             await self.send_error("Помилка збереження")
#             return
        
#         types_map = {
#             "1": "Прорахунок",
#             "2": "Рекламація",
#             "3": "Доп. замовлення"
#         }

#         type_name = types_map.get(str(transaction_type), "Об'єкт")

#         # guid_bin = guid_to_1c_bin(base_transaction_guid)

   
#         doc_number = get_document_number_by_guid(base_guid, transaction_type)
#         doc_year = get_document_year_by_guid(base_guid, transaction_type)


#         if recipient_id_1c:
#             notification_group = f"notify_{recipient_id_1c.lower()}"
#             await self.channel_layer.group_send(
#                 notification_group,
#                 {
#                     "type": "notification_message",
#                     "data": {
#                         "type": "NEW_CHAT_MESSAGE",
#                         "chat_id": self.chat_id,
#                         "text": notify_text, 
#                         "author_name": notify_text.split(" від ")[-1], 
#                         "timestamp": saved_msg.timestamp.isoformat(),
#                         'transactionType': type_name,
#                         'doc_number' : doc_number,
#                         'docYear' : doc_year
#                     }
#                 }
#             )

#         # 🔥 BROADCAST (Chat group)
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': message_text,
#                 'author': self.user.full_name or self.user.username,
#                 'author_id_1c': str(self.contractor_guid),  
#                 'timestamp': saved_msg.timestamp.isoformat()

#             }
#         )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps(event))

#     async def send_error(self, message):
#         await self.send(text_data=json.dumps({'type': 'error', 'message': message}))

#     @database_sync_to_async
#     def save_message(self, text, base_guid, recipient_bin):
#         try:
#             # 1. Визначаємо тип
#             transaction_type_id = self.chat_id.split("_")[0]
            
#             types_map = {
#                 "1": "прорахунку",
#                 "2": "рекламації",
#                 "3": "дозамовленні"
#             }
#             type_name = types_map.get(str(transaction_type_id), "чаті")

#             # 2. Викликаємо процедури для отримання даних з 1С
#             author_name = get_author_name_from_db(self.contractor_bin)
#             doc_number = get_document_number_by_guid(base_guid, transaction_type_id)

#             # 3. Формуємо фінальний текст сповіщення
#             notification_text = f"Нове повідомлення у {type_name} №{doc_number} від {author_name}"

#             # 4. Створюємо запис для історії чату
#             chat_msg = ChatMessage.objects.create(
#                 chat_id=self.chat_id,
#                 author=self.contractor_bin,
#                 recipient=recipient_bin,
#                 text=text,
#                 related_object_id=base_guid,
#                 transaction_type_id=transaction_type_id,
#                 is_notification=False,
#                 is_read=False
#             )

#             # 5. Створюємо запис для "дзвіночка"
#             if recipient_bin:
#                 ChatMessage.objects.create(
#                     chat_id=self.chat_id,
#                     author=self.contractor_bin,
#                     recipient=recipient_bin,
#                     text=notification_text,
#                     related_object_id=base_guid,
#                     transaction_type_id=transaction_type_id,
#                     is_notification=True,
#                     event_type="NEW_CHAT_MESSAGE",
#                     is_read=False
#                 )

#             return chat_msg, notification_text
#         except Exception:
#             import traceback
#             traceback.print_exc()
#             return None, None



import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from records.models import ChatMessage
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c

from backend.utils.contractor_ws import resolve_contractor_ws
from backend.utils.db_1c_lookups import get_author_name_from_db, get_document_number_by_guid, get_document_year_by_guid
from backend.utils.tasks import send_webpush_notification

from celery import current_app


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get("user")
        
       
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

      
        try:

            from backend.utils.contractor_ws import resolve_contractor_ws 
            self.contractor_bin, self.contractor_guid = resolve_contractor_ws(self.scope)
        except Exception as e:

            self.contractor_bin = None
            self.contractor_guid = getattr(self.user, 'user_id_1C', None)
            print(f"WS Connect: Користувач {self.user} не має повної прив'язки 1С: {e}")

        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # --- Асинхронні обгортки для SQL ---
    @database_sync_to_async
    def sync_get_doc_number(self, guid, t_type):
        return get_document_number_by_guid(guid, t_type)

    @database_sync_to_async
    def sync_get_doc_year(self, guid, t_type):
        return get_document_year_by_guid(guid, t_type)

    @database_sync_to_async
    def sync_get_author_name(self, bin_id):
        return get_author_name_from_db(bin_id)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Некоректний формат JSON")
            return

        message_text = data.get('message')
        # base_transaction_guid = data.get('base_transaction_guid')
        recipient_id_1c = data.get('recipient_guid')
        try:
            chat_parts = self.chat_id.split("_")
            raw_type = chat_parts[0]
            base_transaction_guid = chat_parts[1]
            
            t_type = int(raw_type)
            base_guid = guid_to_1c_bin(base_transaction_guid)
        except (IndexError, ValueError, Exception):
            await self.send_error("Некоректний формат chat_id в URL")
            return


        # author_bin = (self.contractor_bin) or guid_to_1c_bin(data.get('author_guid'))

        if self.contractor_bin:
    
            author_bin = self.contractor_bin
        elif data.get('author_guid'):
            
            author_bin = guid_to_1c_bin(data.get('author_guid'))
        else:
            
            author_bin = None


        # raw_type = data.get('transaction_type_id') or self.chat_id.split("_")[0]
        t_type = int(raw_type)

        if not base_transaction_guid:
            await self.send_error("Відсутній GUID")
            return

        try:
            base_guid = guid_to_1c_bin(base_transaction_guid)
            recipient_bin = guid_to_1c_bin(recipient_id_1c) if recipient_id_1c else None
            # author_bin = guid_to_1c_bin(author_guid_str) if author_guid_str else self.contractor_bin
        except Exception:
            await self.send_error("Некоректний GUID")
            return

        if not message_text or not message_text.strip():
            await self.send_error("Порожнє повідомлення")
            return

        doc_number = await self.sync_get_doc_number(base_guid, t_type)
        doc_year = await self.sync_get_doc_year(base_guid, t_type)
        author_name = await self.sync_get_author_name(author_bin)

        saved_msg, notify_text = await self.save_message(
            message_text,
            base_guid,
            recipient_bin,
            doc_number,
            author_name,
            author_bin
        )

        if not saved_msg:
            await self.send_error("Помилка збереження")
            return
        
        types_map = {"1": "Прорахунок", "2": "Рекламація", "3": "Доп. замовлення"}
        types_map_2 = {"1": "прорахунку", "2": "рекламації", "3": "дозамовленні"}

        type_name = types_map.get(str(t_type), "Об'єкт")
        type_name_2 = types_map_2.get(str(t_type), "Об'єкт")

   
        if recipient_id_1c:
            notification_group = f"notify_{recipient_id_1c.lower()}"
            await self.channel_layer.group_send(
                notification_group,
                {
                    "type": "notification_message",
                    "data": {
                        "type": "NEW_CHAT_MESSAGE",
                        "chat_id": self.chat_id,
                        "text": notify_text, 
                        "author_name": author_name, 
                        "timestamp": saved_msg.timestamp.isoformat(),
                        "transactionType": type_name,
                        "doc_number": doc_number,
                        "docYear": doc_year
                    }
                }
            )

            # current_app.send_task('send_webpush_notification', kwargs={
            #     'recipient_id_1c': str(recipient_id_1c),
            #     'title': f"Нове повідомлення: {type_name} №{doc_number}",
            #     'message': message_text[:100]
            # })




        if recipient_id_1c:

            from backend.utils.tasks import send_webpush_notification
            
            send_webpush_notification.delay(
                recipient_id_1c=guid_to_1c_bin(recipient_id_1c), 
                title=f"Нове повідомлення від {author_name} у {type_name_2} №{doc_number}",
                message=message_text[:100]
            )
                        

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'author': author_name,
                'author_id_1c': str(bin_to_guid_1c(author_bin)),  
                'timestamp': saved_msg.timestamp.isoformat()
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({'type': 'error', 'message': message}))

    @database_sync_to_async
    def save_message(self, text, base_guid, recipient_bin, doc_number, author_name, author_bin):
        try:
            transaction_type_id = self.chat_id.split("_")[0]
            types_map = {"1": "прорахунку", "2": "рекламації", "3": "дозамовленні"}
            type_name = types_map.get(str(transaction_type_id), "чаті")

            # Формуємо текст сповіщення
            notification_text = f"Нове повідомлення у {type_name} №{doc_number} від {author_name}"

            # Оригінальне повідомлення
            chat_msg = ChatMessage.objects.create(
                chat_id=self.chat_id,
                author=author_bin,
                recipient=recipient_bin,
                text=text,
                related_object_id=base_guid,
                transaction_type_id=transaction_type_id,
                is_notification=False
            )

            # Запис для сповіщення
            if recipient_bin:
                ChatMessage.objects.create(
                    chat_id=self.chat_id,
                    author=author_bin,
                    recipient=recipient_bin,
                    text=notification_text,
                    related_object_id=base_guid,
                    transaction_type_id=transaction_type_id,
                    is_notification=True,
                    event_type="NEW_CHAT_MESSAGE"
                )

            

            return chat_msg, notification_text
        except Exception:
            return None, None