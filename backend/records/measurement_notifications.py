"""Telegram notifications only for the measurement integration's successful orders."""
import logging
import os
import requests
from celery import shared_task
from django.conf import settings
from django.db import transaction
from .models import CalculationIdempotencyRecord
from .services.manager_service import manager_telegram_id
from utils.BinToGuid1C import bin_to_guid_1c

logger = logging.getLogger(__name__)
COPY_CHAT_ID = 716230412


def queue_notification(notification_id):
    try:
        task = send_measurement_order_notification.apply_async(args=[notification_id], retry=False)
        logger.info('Measurement Telegram queued: notification=%s task=%s', notification_id, task.id)
    except Exception as exc:
        # The pending row remains available to Beat if Redis is unavailable.
        logger.warning('Measurement Telegram queue unavailable: notification=%s error_type=%s', notification_id, type(exc).__name__)


STATE_KEY = '_measurement_telegram'


def record_measurement_notification(request, calculation_guid, key):
    with transaction.atomic():
        item = CalculationIdempotencyRecord.objects.select_for_update().filter(
            idempotency_key=key, status='succeeded').first()
        if not item or str(item.calculation_guid) != str(calculation_guid):
            raise ValueError('Successful measurement idempotency record not found')
        body = dict(item.response_body or {})
        if STATE_KEY not in body:
            body[STATE_KEY] = {
                'status': 'pending', 'deliveries': {},
                'contractor_guid': bin_to_guid_1c(bytes(request.user.user_id_1C)),
                'payload': {
                    'user_id': request.user.pk,
                    'dealer': getattr(request.user, 'full_name', '') or getattr(request.user, 'username', ''),
                    'order_number': str(request.data.get('order_number') or '')[:100],
                    'items_count': int(request.data['items_count']),
                    'comment': str(request.data.get('comment') or '')[:1500],
                },
            }
            item.response_body = body
            item.save(update_fields=['response_body', 'updated_at'])
        pending = body[STATE_KEY]['status'] == 'pending'
    if pending:
        transaction.on_commit(lambda: queue_notification(item.pk))
    return item


def save_delivery_state(record_id, **updates):
    with transaction.atomic():
        item = CalculationIdempotencyRecord.objects.select_for_update().get(pk=record_id)
        body = dict(item.response_body)
        body[STATE_KEY] = {**body[STATE_KEY], **updates}
        item.response_body = body
        item.save(update_fields=['response_body', 'updated_at'])


def notification_text(item):
    data = item.response_body[STATE_KEY]['payload']
    lines = ['📐 Нова заявка із замірника',
             'Дилер: ' + (data.get('dealer') or str(data.get('user_id', ''))),
             'Номер заявки: ' + (data.get('order_number') or 'не вказано'),
             f"Кількість конструкцій: {data.get('items_count', '')}",
             f'GUID прорахунку 1С: {item.calculation_guid}']
    if data.get('comment'):
        lines.append('Коментар: ' + data['comment'])
    return '\n'.join(lines)[:3500]


@shared_task(name='send_measurement_order_notification')
def send_measurement_order_notification(notification_id):
    # Commit the claim before network I/O. Parallel tasks/replays cannot send
    # again; an interrupted/ambiguous send requires review rather than a blind retry.
    with transaction.atomic():
        item = CalculationIdempotencyRecord.objects.select_for_update().filter(pk=notification_id, status='succeeded').first()
        state = (item.response_body or {}).get(STATE_KEY, {}) if item else {}
        if not item or state.get('status') != 'pending':
            return 'already_processed'
        item.response_body[STATE_KEY] = {**state, 'status': 'sending'}
        item.save(update_fields=['response_body', 'updated_at'])
    manager = None
    try:
        manager = manager_telegram_id(state['contractor_guid'])
    except Exception as exc:
        logger.warning('Measurement Telegram manager lookup failed: notification=%s error_type=%s', item.pk, type(exc).__name__)
    recipients = list(dict.fromkeys(value for value in [manager, COPY_CHAT_ID] if value))
    token = (os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN')
             or getattr(settings, 'NOTIFICATION_TELEGRAM_BOT_TOKEN', '')
             or getattr(settings, 'BOT_TOKEN', '')
             or getattr(settings, 'TELEGRAM_BOT_TOKEN', ''))
    deliveries = {}
    for recipient in recipients:
        state = 'failed'
        if token:
            try:
                response = requests.post(f'https://api.telegram.org/bot{token}/sendMessage',
                    json={'chat_id': recipient, 'text': notification_text(item), 'disable_web_page_preview': True}, timeout=10)
                result = response.json()
                state = 'sent' if response.status_code == 200 and result.get('ok') is True else 'failed'
                if state != 'sent':
                    logger.warning('Measurement Telegram rejected: notification=%s recipient=%s http_status=%s error_code=%s', item.pk, recipient, response.status_code, result.get('error_code'))
            except (requests.RequestException, ValueError) as exc:
                state = 'uncertain'
                logger.warning('Measurement Telegram request uncertain: notification=%s recipient=%s error_type=%s', item.pk, recipient, type(exc).__name__)
        else:
            logger.warning('Measurement Telegram token missing: notification=%s', item.pk)
        deliveries[str(recipient)] = state
        # Persist each recipient separately so a later failure doesn't hide a sent copy.
        save_delivery_state(item.pk, deliveries=dict(deliveries))
        logger.info('Measurement Telegram recipient processed: notification=%s recipient=%s status=%s', item.pk, recipient, state)
    if not manager:
        deliveries['manager'] = 'not_found'
    states = list(deliveries.values())
    status = ('sent' if all(state == 'sent' for state in states) else
              'partial' if 'sent' in states else 'uncertain' if 'uncertain' in states else 'failed')
    save_delivery_state(item.pk, status=status, deliveries=deliveries)
    logger.info('Measurement Telegram completed: notification=%s calculation=%s status=%s manager_found=%s', item.pk, item.calculation_guid, status, bool(manager))
    return status


@shared_task(name='enqueue_pending_measurement_order_notifications')
def enqueue_pending_measurement_order_notifications():
    ids = list(CalculationIdempotencyRecord.objects.filter(status='succeeded').extra(
        where=["JSON_VALUE([ResponseBody], '$._measurement_telegram.status') = %s"],
        params=['pending']).order_by('pk').values_list('pk', flat=True)[:100])
    for notification_id in ids:
        queue_notification(notification_id)
    return len(ids)
