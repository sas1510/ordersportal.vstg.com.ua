"""Safe portal-bot alerts for rejected/failed measurement API requests."""
import hashlib
import logging
import uuid
from collections.abc import Mapping
from django.conf import settings
from django.core.cache import cache
from utils.portal_error_alerts import enqueue_alert

logger = logging.getLogger(__name__)
KNOWN_REASONS = {
    'Недійсний ключ інтеграції замірника.': 'Недійсний або відсутній ключ інтеграції.',
    'Ви не дилер. Створення заявки недоступне.': 'Ви не дилер. Створення заявки недоступне.',
    'Потрібен користувач дилера з прив’язкою UserId1C.': 'У дилера немає прив’язки до контрагента 1С (UserId1C).',
    'Користувач недоступний для створення замовлення.': 'Користувача не знайдено або він неактивний.',
    'Термін доступу користувача завершився.': 'Термін доступу користувача завершився.',
}


def report_measurement_failure(request, response):
    if getattr(request, 'method', '') != 'POST' or getattr(request, '_measurement_failure_alerted', False):
        return
    status = response.status_code
    data = getattr(response, 'data', {})
    failed = status >= 400 or (isinstance(data, Mapping) and data.get('success') is False)
    if not failed:
        return
    request._measurement_failure_alerted = True
    if not getattr(settings, 'PORTAL_ERROR_TELEGRAM_BOT_TOKEN', '') or not getattr(settings, 'PORTAL_ERROR_TELEGRAM_CHAT_ID', ''):
        return
    reason = KNOWN_REASONS.get(str(data.get('detail', ''))) if isinstance(data, Mapping) else None
    if reason is None:
        if isinstance(data, Mapping) and 'user_id' in data:
            reason = 'Не передано коректний ID користувача дилера.'
        elif status == 400:
            reason = 'Некоректні дані заявки або вкладення.'
        elif status == 409:
            reason = 'Конфлікт повторного запиту або результат попередньої спроби ще не визначено.'
        elif status == 503:
            reason = 'Інтеграція або сервер тимчасово недоступні чи не налаштовані.'
        elif status >= 500 or status < 400:
            reason = 'Створення заявки в 1С не підтверджено. Див. серверний журнал.'
        elif status == 401:
            reason = 'Не пройдено авторизацію інтеграції.'
        else:
            reason = 'Доступ до створення заявки відхилено.'
    # Read identifiers only after the integration key has been validated.
    user_id = None
    order_number = ''
    if getattr(request, '_measurement_key_valid', False):
        try:
            payload = request.data
            if isinstance(payload, Mapping):
                value = payload.get('user_id')
                if isinstance(value, int) and not isinstance(value, bool) and value > 0:
                    user_id = value
                value = payload.get('order_number')
                if isinstance(value, str):
                    order_number = ' '.join(value.split())[:100]
        except Exception:
            pass
    # Group identical failures for five minutes; do not retain request bodies or keys.
    fingerprint = hashlib.sha256(f'{status}|{reason}|{user_id}'.encode()).hexdigest()
    try:
        if not cache.add('measurement-failure:' + fingerprint, True, timeout=300):
            return
    except Exception:
        logger.warning('Measurement failure alert deduplication unavailable')
        return
    error_id = uuid.uuid4().hex[:8].upper()
    logger.warning('Measurement API failed: error_id=%s http_status=%s user_id=%s', error_id, status, user_id)
    enqueue_alert('\n'.join(['🚨 Не вдалося створити заявку із замірника',
        'ID: ' + error_id,
        'POST /api/integrations/measurement/orders/',
        f'HTTP: {status}', f'Переданий ID користувача: {user_id or "не вказаний / не перевірений"}',
        'Заявка: ' + (order_number or 'не вказана'), 'Причина: ' + reason]))
