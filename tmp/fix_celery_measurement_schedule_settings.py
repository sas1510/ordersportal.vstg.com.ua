from pathlib import Path
root=Path('/var/www/html/ordersportal.vstg.com.ua')
for name in ['backend/settings.py','backend/backend/settings.py']:
 p=root/name;s=p.read_text(encoding='utf-8-sig')
 anchor='CELERY_BEAT_SCHEDULE = {'
 assert s.count(anchor)==1
 if "'pending-measurement-order-notifications'" not in s:
  s=s.replace(anchor,anchor+'''
    'pending-measurement-order-notifications': {
        'task': 'enqueue_pending_measurement_order_notifications',
        'schedule': 60.0,
    },''',1)
 p.write_text(s,encoding='utf-8')
