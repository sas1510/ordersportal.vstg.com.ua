from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
p=r/'backend/records/order_chat_summary.py';s=p.read_text(encoding='utf-8-sig');a=s.index('def get_order_boundary_messages(')
s=s[:a]+'''def get_order_boundary_messages(calculation_ids):
    # Historical imports receive new IDs; boundaries follow message time, then ID.
    calculation_ids = list(dict.fromkeys(bytes(value) if isinstance(value, (bytearray, memoryview)) else value for value in calculation_ids))
    messages = []
    for start in range(0, len(calculation_ids), 800):
        chunk = calculation_ids[start:start + 800]
        placeholders = ','.join(['%s'] * len(chunk))
        sql = f"""SELECT id, RelatedObjectId, [Text], [Timestamp] FROM (
            SELECT id, RelatedObjectId, [Text], [Timestamp],
                ROW_NUMBER() OVER (PARTITION BY RelatedObjectId ORDER BY [Timestamp], id) AS first_row,
                ROW_NUMBER() OVER (PARTITION BY RelatedObjectId ORDER BY [Timestamp] DESC, id DESC) AS last_row
            FROM dbo.ChatMessage WHERE IsNotification=0 AND RelatedObjectId IN ({placeholders})
        ) AS boundaries WHERE first_row=1 OR last_row=1"""
        with connections[ChatMessage.objects.db].cursor() as cursor:
            cursor.execute(sql, chunk)
            messages.extend(dict(zip(('id', 'related_object_id', 'text', 'timestamp'), row)) for row in cursor.fetchall())
    return sorted(messages, key=lambda message: (message['timestamp'], message['id']), reverse=True)
''';s=s.replace('from django.db.models import Min, Max\n','');p.write_text(s,encoding='utf-8')
p=r/'backend/records/views.py';s=p.read_text(encoding='utf-8-sig');old='''                .order_by("-id")
                .values(
                    "related_object_id",
                    "text",
                )''';new=old.replace('.order_by("-id")','.order_by("-timestamp", "-id")');assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
