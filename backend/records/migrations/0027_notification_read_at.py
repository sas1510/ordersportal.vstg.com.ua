from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("records", "0026_remove_empty_delivery_receipts")]
    operations = [migrations.AddField(model_name="chatmessage", name="notification_read_at", field=models.DateTimeField(null=True, blank=True, db_column="NotificationReadAt"))]
