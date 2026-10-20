from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('payments', '0003_transfer_route')]
    operations = [
        migrations.AddField(model_name='fundstransfersubmission', name='funds_status', field=models.CharField(max_length=12, choices=[('pending', 'Очікує надходження'), ('partial', 'Частково отримано'), ('received', 'Отримано'), ('mismatch', 'Розбіжність')], default='pending', db_index=True, editable=False)),
        migrations.AddField(model_name='fundstransfersubmission', name='received_amount', field=models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, editable=False)),
        migrations.AddField(model_name='fundstransfersubmission', name='funds_checked_at', field=models.DateTimeField(null=True, blank=True, editable=False)),
        migrations.AddField(model_name='fundstransfersubmission', name='cash_receipts', field=models.JSONField(default=list, blank=True, editable=False)),
    ]
