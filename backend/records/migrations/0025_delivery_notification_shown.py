from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("records", "0024_delivery_notifications")]
    operations = [
        migrations.RenameField(model_name="deliverynotificationreceipt", old_name="shown_at", new_name="observed_at"),
        migrations.AddField(model_name="deliverynotificationreceipt", name="shown_at", field=models.DateTimeField(null=True, blank=True)),
        migrations.AddField(model_name="deliverynotificationreceipt", name="notify", field=models.BooleanField(default=False)),
    ]
