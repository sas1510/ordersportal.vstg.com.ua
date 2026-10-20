from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('payments', '0002_manager_notifications')]
    operations = [
        migrations.AddField(model_name='fundstransfersubmission', name='transfer_date', field=models.DateField(null=True, blank=True)),
        migrations.AddField(model_name='fundstransfersubmission', name='routing_guid', field=models.UUIDField(null=True, blank=True)),
        migrations.AddField(model_name='fundstransfersubmission', name='routing_number', field=models.CharField(max_length=100, blank=True, default='')),
        migrations.AddField(model_name='fundstransfersubmission', name='routing_orders', field=models.JSONField(default=list, blank=True)),
    ]
