from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0009_alter_customuser_role")]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="load_all_contractor_addresses",
            field=models.BooleanField(
                db_column="LoadAllContractorAddresses",
                default=False,
            ),
        ),
    ]
