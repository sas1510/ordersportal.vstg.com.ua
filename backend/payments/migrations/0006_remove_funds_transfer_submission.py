from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [('payments', '0005_funds_reconciliation_note')]
    operations = [migrations.DeleteModel(name='FundsTransferSubmission')]
