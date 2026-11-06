"""Minimal personal alerts: event, time and random correlation ID only."""
import logging
import uuid
from django.conf import settings
from django.utils import timezone
from utils.portal_error_alerts import enqueue_alert

logger=logging.getLogger(__name__)


def _enabled():
    return bool(getattr(settings,'PORTAL_ERROR_TELEGRAM_BOT_TOKEN','') and getattr(settings,'PORTAL_ERROR_TELEGRAM_CHAT_ID',''))


def _context(request):
    return ['Спроба: '+request._measurement_attempt_id,
        'Час: '+timezone.localtime().strftime('%d.%m.%Y %H:%M:%S')]


def report_measurement_attempt(request):
    if request.method!='POST' or not _enabled() or getattr(request,'_measurement_attempt_id',None):
        return
    request._measurement_attempt_id=uuid.uuid4().hex[:8].upper()
    logger.info('Measurement attempt started: attempt_id=%s',request._measurement_attempt_id)
    enqueue_alert('\n'.join(['📐 Спроба створення заявки із замірника',*_context(request)]))


def report_measurement_success(request,response):
    data=getattr(response,'data',{})
    if not _enabled() or not getattr(request,'_measurement_attempt_id',None):
        return
    if response.status_code not in (200,201) or not isinstance(data,dict) or data.get('success') is not True:
        return
    logger.info('Measurement attempt succeeded: attempt_id=%s http_status=%s',request._measurement_attempt_id,response.status_code)
    enqueue_alert('\n'.join(['✅ Заявка із замірника: успіх',*_context(request),
        'HTTP: '+str(response.status_code),
        'Повторна спроба може підтверджувати вже створену заявку.']))
