from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import payments.models

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name='FundsTransferSubmission', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('contractor_guid', models.UUIDField(db_index=True)),
        ('amount', models.DecimalField(max_digits=14, decimal_places=2)),
        ('currency', models.CharField(default='UAH', max_length=3)),
        ('comment', models.TextField(blank=True)),
        ('photo', models.FileField(storage=payments.models.private_transfer_storage, upload_to=payments.models.transfer_photo_path)),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('author', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
    ], options={'ordering': ['-created_at', '-pk']})]
