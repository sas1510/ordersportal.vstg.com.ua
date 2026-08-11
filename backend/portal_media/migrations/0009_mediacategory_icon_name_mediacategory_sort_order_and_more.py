from django.db import migrations, models


def seed_faq_categories(apps, schema_editor):
    MediaCategory = apps.get_model("portal_media", "MediaCategory")

    categories = [
        {"name": "Продажі", "icon_name": "allOrdersPayment", "sort_order": 10},
        {"name": "Монтаж", "icon_name": "windows", "sort_order": 20},
        {"name": "Оплата", "icon_name": "pay", "sort_order": 30},
        {"name": "Гарантія", "icon_name": "file", "sort_order": 40},
    ]

    for item in categories:
        category, created = MediaCategory.objects.get_or_create(
            name=item["name"],
            defaults={
                "description": "",
                "icon_name": item["icon_name"],
                "usage_scope": "faq",
                "sort_order": item["sort_order"],
            },
        )
        if not created:
            category.icon_name = category.icon_name or item["icon_name"]
            category.usage_scope = "faq"
            if not category.sort_order:
                category.sort_order = item["sort_order"]
            category.save(update_fields=["icon_name", "usage_scope", "sort_order"])


def unseed_faq_categories(apps, schema_editor):
    MediaCategory = apps.get_model("portal_media", "MediaCategory")
    MediaCategory.objects.filter(
        name__in=["Продажі", "Монтаж", "Оплата", "Гарантія"],
        usage_scope="faq",
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("portal_media", "0008_alter_mediaresource_resource_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="mediacategory",
            name="icon_name",
            field=models.CharField(
                blank=True,
                db_column="IconName",
                max_length=100,
                null=True,
                verbose_name="Іконка",
            ),
        ),
        migrations.AddField(
            model_name="mediacategory",
            name="sort_order",
            field=models.PositiveIntegerField(
                db_column="SortOrder",
                default=0,
                verbose_name="Порядок сортування",
            ),
        ),
        migrations.AddField(
            model_name="mediacategory",
            name="usage_scope",
            field=models.CharField(
                choices=[
                    ("general", "Загальна"),
                    ("video", "Відео"),
                    ("faq", "FAQ"),
                ],
                db_column="UsageScope",
                default="general",
                max_length=20,
                verbose_name="Сфера використання",
            ),
        ),
        migrations.RunPython(seed_faq_categories, unseed_faq_categories),
    ]
