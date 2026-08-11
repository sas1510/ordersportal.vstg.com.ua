from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal_media", "0010_mediaresource_is_popular"),
    ]

    operations = [
        migrations.AddField(
            model_name="mediaresource",
            name="duration",
            field=models.CharField(
                blank=True,
                db_column="Duration",
                max_length=20,
                null=True,
                verbose_name="Тривалість відео",
            ),
        ),
    ]
