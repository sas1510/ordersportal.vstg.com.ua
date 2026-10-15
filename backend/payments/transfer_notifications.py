import logging
from urllib.parse import urlencode
import requests
from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from utils.GuidToBin1C import guid_to_1c_bin
from .models import FundsTransferSubmission

logger = logging.getLogger(__name__)

def queue_transfer_notification(submission_id):
    try:
        from .tasks import notify_manager_of_funds_transfer
        notify_manager_of_funds_transfer.apply_async(args=[submission_id], retry=False)
    except Exception as exc:
        # Keep pending so Beat can enqueue it later. Never fail a saved form.
        logger.warning('Funds transfer notification queue unavailable', extra={'tags': {'component': 'funds_transfer_notification', 'status': 'pending'}, 'submission_id': submission_id, 'error_type': type(exc).__name__})

def manager_telegram_id(contractor_guid):
    with connection.cursor() as cursor:
        cursor.execute('EXEC dbo.GetManagerByContractor @ContractorId=%s', [guid_to_1c_bin(str(contractor_guid))])
        manager = cursor.fetchone()
        if not manager or not manager[0]:
            return None
        cursor.execute('EXEC dbo.GetTelegramID @UserGUID=%s', [manager[0]])
        recipient = cursor.fetchone()
        value = recipient[1] if recipient and len(recipient) > 1 else recipient[0] if recipient else None
        return int(value) if value else None

def notification_text(item):
    currency = 'грн' if item.currency == 'UAH' else item.currency
    amount = f'{item.amount:,.2f}'.replace(',', ' ').replace('.', ',')
    dealer = item.author.full_name or item.author.username
    lines = ['💰 Дилер подав інформацію про передані кошти', f'Дилер: {dealer}', f'Сума: {amount} {currency}', f'Подано: {timezone.localtime(item.created_at):%d.%m.%Y %H:%M}', f'Подання № {item.pk}']
    if item.comment:
        lines.append(f'Коментар: {item.comment[:2000]}')
    return '\n'.join(lines)

def send_transfer_notification(submission_id):
    # Lock this submission to prevent duplicate sends by concurrent workers.
    with transaction.atomic():
        item = FundsTransferSubmission.objects.select_for_update().select_related('author').filter(pk=submission_id).first()
        if not item or item.manager_notification_status != 'pending':
            return 'already_processed'
        chat_id = manager_telegram_id(item.contractor_guid)
        copy_value = getattr(settings, 'FUNDS_TRANSFER_TELEGRAM_COPY_CHAT_ID', '')
        try:
            copy_chat_id = int(copy_value) if copy_value else None
        except (TypeError, ValueError):
            copy_chat_id = None
            logger.warning('Invalid funds transfer Telegram copy configuration')
        recipients = list(dict.fromkeys(value for value in [chat_id, copy_chat_id] if value))
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or getattr(settings, 'BOT_TOKEN', '')
        state = 'skipped'
        sent_to = []
        if recipients and token:
            payload = {'text': notification_text(item), 'disable_web_page_preview': True}
            base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
            if base.startswith('https://'):
                url = base + '/finance/funds-transfer-history?' + urlencode({'contractor': str(item.contractor_guid)})
                payload['reply_markup'] = {'inline_keyboard': [[{'text': 'Переглянути подання та фото', 'url': url}]]}
            for recipient in recipients:
                delivered = False
                try:
                    response = requests.post(f'https://api.telegram.org/bot{token}/sendMessage', json={**payload, 'chat_id': recipient}, timeout=10)
                    delivered = response.status_code == 200 and response.json().get('ok') is True
                except (requests.RequestException, ValueError):
                    # Delivery after a timeout is ambiguous; do not resend blindly.
                    pass
                if delivered:
                    sent_to.append(recipient)
                logger.info('Funds transfer Telegram recipient processed', extra={'tags': {'component': 'funds_transfer_notification', 'status': 'sent' if delivered else 'failed'}, 'submission_id': item.pk, 'recipient_chat_id': recipient})
            state = 'sent' if len(sent_to) == len(recipients) else 'partial' if sent_to else 'failed'
        item.manager_notification_status = state
        if chat_id in sent_to:
            item.manager_notified_at = timezone.now()
        item.save(update_fields=['manager_notification_status', 'manager_notified_at'])
        logger.info('Funds transfer manager notification processed', extra={'tags': {'component': 'funds_transfer_notification', 'status': state}, 'submission_id': item.pk, 'recipient_found': bool(chat_id), 'token_configured': bool(token)})
        return state
