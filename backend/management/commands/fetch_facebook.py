from facebook_scraper import get_posts
from django.core.management.base import BaseCommand
from portal_media.models import MediaResource  # Заміни на свою модель
from django.utils.dateparse import parse_datetime

class Command(BaseCommand):
    help = 'Стягує останні пости з публічної сторінки Facebook'

    def handle(self, *args, **options):
        # Назва сторінки з URL (наприклад, viknastyletraiding)
        PAGE_ID = "viknastyletraiding"
        
        # Кількість сторінок для скролінгу (1 сторінка ≈ 4-10 постів)
        # Оскільки ти хочеш > 5 постів, поставимо 4 сторінки
        PAGES_TO_SCRAPE = 4

        self.stdout.write(f"Починаю стягувати пости з {PAGE_ID}...")

        try:
            # get_posts працює без API-ключів та браузера
            for post in get_posts(PAGE_ID, pages=PAGES_TO_SCRAPE):
                
                # Створюємо або оновлюємо запис у базі
                obj, created = MediaResource.objects.update_or_create(
                    external_id=post['post_id'],
                    defaults={
                        'title': post['text'][:100] if post['text'] else "Новина з Facebook",
                        'description': post['text'],
                        'url': post['post_url'],
                        'image_url': post['image'], # Пряме посилання на картинку
                        'resource_type': 'facebook',
                        # 'created_at': post['time'] # Якщо поле в моделі є
                    }
                )
                
                status = "Додано" if created else "Оновлено"
                self.stdout.write(f"[{status}] Пост ID: {post['post_id']}")

            self.stdout.write(self.style.SUCCESS('Готово! Всі пости синхронізовано.'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Помилка: {e}"))