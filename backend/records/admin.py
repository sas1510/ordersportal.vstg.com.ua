from django.contrib import admin
import binascii  # Для конвертації BinaryField у читабельний вигляд

from .models import (
    TransactionType, FileType, TransactionFile, ChatMessage
)


def get_hex_from_binary(binary_data):
    if binary_data:
        try:
            return f"0x{binascii.hexlify(binary_data).decode('utf-8').upper()}"
        except:
            return str(binary_data)
    return "-"

@admin.register(TransactionType)
class TransactionTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'type_name', 'description')
    search_fields = ('type_name',)

@admin.register(FileType)
class FileTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'type_name', 'extensions')
    search_fields = ('type_name', 'extensions')

@admin.register(TransactionFile)
class TransactionFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_name', 'file_type', 'transaction_type', 'get_base_id')
    list_filter = ('transaction_type', 'file_type')
    search_fields = ('file_name',)
    
    def get_base_id(self, obj):
        return get_hex_from_binary(obj.base_transaction_id)
    get_base_id.short_description = "Base Transaction ID"

# @admin.register(Message)
# class MessageAdmin(admin.ModelAdmin):
#     list_display = ('id', 'transaction_type', 'get_author_id', 'message_excerpt', 'is_read', 'created_at')
#     list_filter = ('transaction_type', 'is_read', 'is_send')
#     search_fields = ('message',)
#     readonly_fields = ('created_at',)

#     def message_excerpt(self, obj):
#         return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
#     message_excerpt.short_description = "Текст повідомлення"

#     def get_author_id(self, obj):
#         return get_hex_from_binary(obj.writer_id)
#     get_author_id.short_description = "Writer ID (HEX)"



# @admin.register(Notification)
# class NotificationAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'event_type', 'get_base_id', 'is_read', 'created_at')
#     list_filter = ('event_type', 'is_read', 'transaction_type')
#     search_fields = ('message', 'user__username')
    
#     def get_base_id(self, obj):
#         return get_hex_from_binary(obj.base_transaction_id)
#     get_base_id.short_description = "Base ID"

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_id', 'get_author', 'get_recipient', 'text_excerpt', 'is_read', 'timestamp')
    list_filter = ('transaction_type', 'is_read', 'is_sent_vtg', 'is_notification')
    search_fields = ('chat_id', 'text')
    readonly_fields = ('timestamp',)

    def text_excerpt(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_excerpt.short_description = "Текст"

    def get_author(self, obj):
        return get_hex_from_binary(obj.author)
    get_author.short_description = "Author ID"

    def get_recipient(self, obj):
        return get_hex_from_binary(obj.recipient)
    get_recipient.short_description = "Recipient ID"