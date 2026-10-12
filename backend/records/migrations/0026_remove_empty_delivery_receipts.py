from django.db import migrations


def remove_empty_receipts(apps, schema_editor):
    Receipt = apps.get_model("records", "DeliveryNotificationReceipt")
    Receipt.objects.using(schema_editor.connection.alias).filter(delivery_key="").delete()


class Migration(migrations.Migration):
    dependencies = [("records", "0025_delivery_notification_shown")]
    operations = [migrations.RunPython(remove_empty_receipts, migrations.RunPython.noop)]
