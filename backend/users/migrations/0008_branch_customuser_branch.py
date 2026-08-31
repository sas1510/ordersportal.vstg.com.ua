from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("users", "0007_customuser_is_branch")]

    operations = [
        migrations.CreateModel(
            name="Branch",
            fields=[
                ("id", models.BigAutoField(db_column="ID", primary_key=True, serialize=False)),
                ("name", models.CharField(db_column="Name", max_length=150, unique=True)),
                ("code", models.CharField(db_column="Code", max_length=32, unique=True)),
                ("folder_guid_1c", models.UUIDField(blank=True, db_column="FolderGuid1C", null=True, unique=True)),
                ("is_active", models.BooleanField(db_column="IsActive", default=True)),
            ],
            options={"db_table": "Branch", "ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="customuser",
            name="branch",
            field=models.ForeignKey(blank=True, db_column="BranchID", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="users.branch"),
        ),
    ]
