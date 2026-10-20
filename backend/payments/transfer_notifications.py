import logging
import os
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
        task = notify_manager_of_funds_transfer.apply_async(args=[submission_id], retry=False)
        logger.info('Funds transfer notification queued: submission_id=%s task_id=%s', submission_id, task.id)
    except Exception as exc:
        # Keep pending so Beat can enqueue it later. Never fail a saved form.
        logger.warning('Funds transfer notification queue unavailable: submission_id=%s error_type=%s', submission_id, type(exc).__name__, extra={'tags': {'component': 'funds_transfer_notification', 'status': 'pending'}, 'submission_id': submission_id, 'error_type': type(exc).__name__})

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
    if getattr(item, 'transfer_date', None):
        lines.append(f'Дата передачі: {item.transfer_date:%d.%m.%Y}')
    if getattr(item, 'routing_number', ''):
        lines.append(f'Маршрутизація: {item.routing_number}')
        lines.append('Замовлення: ' + ', '.join(item.routing_orders))
    return '\n'.join(lines)[:4000]

def send_transfer_notification(submission_id):
    logger.info('Funds transfer notification started: submission_id=%s', submission_id)
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
        token = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN', '')
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
                    result = response.json()
                    delivered = response.status_code == 200 and result.get('ok') is True
                    if not delivered:
                        logger.warning('Funds transfer Telegram rejected: submission_id=%s recipient=%s http_status=%s error_code=%s description=%s', item.pk, recipient, response.status_code, result.get('error_code'), result.get('description'))
                except (requests.RequestException, ValueError) as exc:
                    # Delivery after a timeout is ambiguous; do not resend blindly.
                    logger.warning('Funds transfer Telegram request failed: submission_id=%s recipient=%s error_type=%s', item.pk, recipient, type(exc).__name__)
                if delivered:
                    sent_to.append(recipient)
                logger.info('Funds transfer Telegram recipient processed: submission_id=%s recipient=%s status=%s', item.pk, recipient, 'sent' if delivered else 'failed', extra={'tags': {'component': 'funds_transfer_notification', 'status': 'sent' if delivered else 'failed'}, 'submission_id': item.pk, 'recipient_chat_id': recipient})
            state = 'sent' if len(sent_to) == len(recipients) else 'partial' if sent_to else 'failed'
        if not recipients or not token:
            logger.warning('Funds transfer Telegram skipped: submission_id=%s recipient_found=%s token_configured=%s', item.pk, bool(recipients), bool(token))
        item.manager_notification_status = state
        if chat_id in sent_to:
            item.manager_notified_at = timezone.now()
        item.save(update_fields=['manager_notification_status', 'manager_notified_at'])
        logger.info('Funds transfer manager notification processed: submission_id=%s status=%s recipient_found=%s token_configured=%s', item.pk, state, bool(chat_id), bool(token), extra={'tags': {'component': 'funds_transfer_notification', 'status': state}, 'submission_id': item.pk, 'recipient_found': bool(chat_id), 'token_configured': bool(token)})
        return state
