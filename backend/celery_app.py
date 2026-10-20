import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.beat_schedule = {
    **app.conf.beat_schedule,
    'pending-funds-transfer-notifications': {
        'task': 'enqueue_pending_funds_transfer_notifications',
        'schedule': 60.0,
    },
}
# у celery.py додайте цей рядок ПЕРЕД autodiscover_tasks
app.conf.imports = ('utils.tasks', 'records.notification_cleanup')

# Цей рядок критично важливий!
app.autodiscover_tasks()
