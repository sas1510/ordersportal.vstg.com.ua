from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('payments', '0001_initial')]
    operations = [
        # Existing submissions must not send historical notifications on deploy.
        migrations.AddField(model_name='fundstransfersubmission', name='manager_notification_status', field=models.CharField(max_length=12, default='skipped', db_index=True), preserve_default=False),
        migrations.AlterField(model_name='fundstransfersubmission', name='manager_notification_status', field=models.CharField(max_length=12, default='pending', db_index=True)),
        migrations.AddField(model_name='fundstransfersubmission', name='manager_notified_at', field=models.DateTimeField(null=True, blank=True)),
    ]
