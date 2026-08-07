from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("records", "0021_telegrambotapikey")]

    operations = [
        migrations.CreateModel(
            name="CalculationIdempotencyRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("idempotency_key", models.UUIDField(db_column="IdempotencyKey", unique=True)),
                ("payload_hash", models.CharField(db_column="PayloadHash", max_length=64)),
                ("status", models.CharField(db_column="Status", default="sending", max_length=30)),
                ("calculation_guid", models.UUIDField(blank=True, db_column="CalculationGuid", null=True)),
                ("response_body", models.JSONField(blank=True, db_column="ResponseBody", null=True)),
                ("last_error", models.TextField(blank=True, db_column="LastError", null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="CreatedAt")),
                ("updated_at", models.DateTimeField(auto_now=True, db_column="UpdatedAt")),
            ],
            options={"db_table": "CalculationIdempotencyRecords"},
        ),
    ]
