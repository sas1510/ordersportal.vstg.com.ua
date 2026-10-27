from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('payments', '0004_funds_reconciliation')]
    operations = [migrations.AddField(model_name='fundstransfersubmission', name='reconciliation_note', field=models.CharField(max_length=1000, blank=True, default='', editable=False))]
