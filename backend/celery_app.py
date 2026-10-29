import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.beat_schedule = {
    **app.conf.beat_schedule,
    'pending-measurement-order-notifications': {
        'task': 'enqueue_pending_measurement_order_notifications',
        'schedule': 60.0,
    },
}
# у celery.py додайте цей рядок ПЕРЕД autodiscover_tasks
app.conf.imports = ('utils.tasks', 'records.notification_cleanup', 'records.measurement_notifications')

# Цей рядок критично важливий!
app.autodiscover_tasks()
