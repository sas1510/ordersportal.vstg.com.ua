from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BonusProduct',
            fields=[
                ('id', models.BigAutoField(db_column='ID', primary_key=True, serialize=False)),
                ('name', models.CharField(db_column='Name', max_length=255, verbose_name='Назва товару')),
                ('category', models.CharField(db_column='Category', max_length=255, verbose_name='Категорія')),
                ('price', models.PositiveIntegerField(db_column='Price', verbose_name='Вартість у балах')),
                ('image_data', models.BinaryField(blank=True, db_column='ImageData', null=True, verbose_name='Зображення')),
                ('image_extension', models.CharField(blank=True, db_column='ImageExtension', max_length=20, null=True, verbose_name='Розширення зображення')),
                ('is_active', models.BooleanField(db_column='IsActive', default=True, verbose_name='Активний')),
                ('display_order', models.PositiveIntegerField(db_column='DisplayOrder', default=0, verbose_name='Порядок сортування')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='CreatedAt', verbose_name='Створено')),
                ('updated_at', models.DateTimeField(auto_now=True, db_column='UpdatedAt', verbose_name='Оновлено')),
                ('author', models.ForeignKey(blank=True, db_column='AuthorID', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bonus_products', to=settings.AUTH_USER_MODEL, verbose_name='Автор')),
            ],
            options={
                'verbose_name': 'Бонусний товар',
                'verbose_name_plural': 'Бонусні товари',
                'db_table': 'BonusProduct',
                'ordering': ['display_order', 'name', '-created_at'],
            },
        ),
    ]
