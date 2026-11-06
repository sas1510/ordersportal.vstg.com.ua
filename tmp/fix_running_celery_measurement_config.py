from pathlib import Path
root=Path('/var/www/html/ordersportal.vstg.com.ua')
p=root/'backend/backend/celery_app.py';s=p.read_text(encoding='utf-8-sig')
s=s.replace("app.conf.imports = ('utils.tasks',) # шлях до твого файлу (без .py)","app.conf.imports = ('utils.tasks', 'records.measurement_notifications')")
s=s.replace('app.autodiscover_tasks()', '''app.conf.beat_schedule = {
    **app.conf.beat_schedule,
    'pending-measurement-order-notifications': {
        'task': 'enqueue_pending_measurement_order_notifications',
        'schedule': 60.0,
    },
}

app.autodiscover_tasks()''')
p.write_text(s,encoding='utf-8')
p=root/'backend/records/services/manager_service.py';s=p.read_text(encoding='utf-8-sig').replace('from backend.utils.GuidToBin1C import guid_to_1c_bin','from utils.GuidToBin1C import guid_to_1c_bin');p.write_text(s,encoding='utf-8')
