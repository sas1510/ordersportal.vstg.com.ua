import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.beat_schedule = {
    **app.conf.beat_schedule,
    'reconcile-funds-transfer-cash-receipts': {
        'task': 'reconcile_funds_transfers',
        'schedule': crontab(minute=0, hour='9-18'),
    },
    'pending-measurement-order-notifications': {
        'task': 'enqueue_pending_measurement_order_notifications',
        'schedule': 60.0,
    },
    'pending-funds-transfer-notifications': {
        'task': 'enqueue_pending_funds_transfer_notifications',
        'schedule': 60.0,
    },
}
# у celery.py додайте цей рядок ПЕРЕД autodiscover_tasks
app.conf.imports = ('utils.tasks', 'records.notification_cleanup', 'records.measurement_notifications')

# Цей рядок критично важливий!
app.autodiscover_tasks()
