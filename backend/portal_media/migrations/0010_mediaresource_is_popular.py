from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal_media", "0009_mediacategory_icon_name_mediacategory_sort_order_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="mediaresource",
            name="is_popular",
            field=models.BooleanField(
                db_column="IsPopular",
                default=False,
                verbose_name="Популярне питання",
            ),
        ),
    ]
