import os
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django
django.setup()

from django.db import connection
from django.utils import timezone
from records.models import TelegramPortalLink

user = TelegramPortalLink.objects.select_related("user").get(
    telegram_chat_id=716230412,
).user
today = timezone.localdate()
with connection.cursor() as cursor:
    cursor.execute(
        "EXEC [dbo].[GetShippedOrdersAnalytics] @DateFrom=%s, @DateTo=%s, @ContractorID=%s",
        [today - timedelta(days=6), today, user.user_id_1C],
    )
    columns = [item[0] for item in cursor.description]
    row = cursor.fetchone()
print({"columns": columns, "has_row": bool(row), "json_chars": len(str(row[0])) if row else 0})
