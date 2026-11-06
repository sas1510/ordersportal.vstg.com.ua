from pathlib import Path
root=Path('/var/www/html/ordersportal.vstg.com.ua')
p=root/'backend/records/measurement_notifications.py';s=p.read_text(encoding='utf-8-sig');s=s.replace('from .models import CalculationIdempotencyRecord','from .models import CalculationIdempotencyRecord\nfrom .measurement_links import measurement_portal_path')
s=s.replace("    if data.get('comment'):\n        lines.append('Коментар: ' + data['comment'])",'''    source_path = measurement_portal_path(data.get('order_number'), data.get('user_id'))
    if source_path:
        lines.extend(['', 'Відкрити замір: ' + settings.FRONTEND_URL.rstrip('/') + source_path])
    if data.get('comment'):
        lines.append('Коментар: ' + data['comment'])''')
p.write_text(s,encoding='utf-8')
p=root/'backend/records/calculation_metadata.py';s=p.read_text(encoding='utf-8-sig');s=s.replace('import re\nfrom urllib.parse import urlencode\n','');s=s.replace('from uuid import UUID','from uuid import UUID\nfrom .measurement_links import measurement_portal_path')
a=s.index("            match=re.fullmatch(");s=s[:a]+"            calc['measurementUrl']=measurement_portal_path(number,calc['measurementDealerId'])\n    return calculations\n";p.write_text(s,encoding='utf-8')
