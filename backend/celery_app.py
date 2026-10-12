import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
# у celery.py додайте цей рядок ПЕРЕД autodiscover_tasks
app.conf.imports = ('utils.tasks', 'records.notification_cleanup')

# Цей рядок критично важливий!
app.autodiscover_tasks()
