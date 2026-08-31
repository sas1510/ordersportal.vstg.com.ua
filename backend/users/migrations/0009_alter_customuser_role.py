from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0008_branch_customuser_branch")]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Адміністратор"),
                    ("manager", "Менеджер"),
                    ("operator", "Оператор"),
                    ("director", "Директор"),
                    ("region_manager", "Регіональний менеджер"),
                    ("branch_manager", "Менеджер філіалу"),
                    ("complaint_manager", "Менеджер скарг"),
                    ("customer", "Клієнт"),
                ],
                db_column="Role",
                default="customer",
                max_length=30,
            ),
        ),
    ]
