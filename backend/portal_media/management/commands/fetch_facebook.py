import os
import facebook_scraper
from django.core.management.base import BaseCommand
from portal_media.models import MediaResource, MediaCategory
from django.utils.timezone import make_aware
from django.conf import settings

class Command(BaseCommand):
    help = 'Стягує останні пости з Facebook через mbasic інтерфейс'

    def handle(self, *args, **options):
        # Використовуємо мобільну версію для стабільності
        PAGE_ID = "viknastyletraiding"
        PAGES_TO_SCRAPE = 10
        
        # Шлях до файлу кук у корені backend
        cookies_path = os.path.join(settings.BASE_DIR, "facebook_cookies.txt")

        self.stdout.write(f"Починаю стягувати пости з {PAGE_ID}...")

        # 1. Спробуємо знайти/створити категорію
        category, _ = MediaCategory.objects.get_or_create(name="Facebook")

        try:
            # 2. Імітуємо iPhone, щоб отримати легку верстку
            facebook_scraper.set_user_agent(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            )

            # 3. Налаштування скрапера
            scraper_kwargs = {
                "pages": PAGES_TO_SCRAPE,
                "options": {
                    "allow_extra_requests": False,
                    "posts_per_page": 10,
                    "mbasic": True  # ВИКОРИСТОВУВАТИ НАЙПРОСТІШУ ВЕРСІЮ
                }
            }

            if os.path.exists(cookies_path):
                scraper_kwargs["cookies"] = cookies_path
                self.stdout.write("✅ Використовую файл cookies.")
            else:
                self.stdout.write(self.style.WARNING("⚠️ Працюю без cookies (можлива помилка 400)."))

            # 4. Запуск циклу
            count = 0
            for post in facebook_scraper.get_posts(PAGE_ID, **scraper_kwargs):
                
                # Обробка дати
                post_time = post.get('time')
                if post_time and not post_time.tzinfo:
                    post_time = make_aware(post_time)

                # 5. Збереження в базу
                obj, created = MediaResource.objects.update_or_create(
                    external_id=str(post['post_id']),
                    defaults={
                        'title': (post['text'][:97] + "...") if post['text'] and len(post['text']) > 100 else (post['text'] or "Новина Facebook"),
                        'description': post['text'] or "",
                        'url': post['post_url'],
                        'image_url': post.get('image'),
                        'resource_type': MediaResource.ResourceType.FB,
                        'category': category,
                        'created_at': post_time,
                    }
                )
                
                count += 1
                status = "Додано" if created else "Оновлено"
                self.stdout.write(f"[{status}] Пост ID: {post['post_id']}")

            self.stdout.write(self.style.SUCCESS(f'Готово! Оброблено постів: {count}'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Помилка: {e}"))
            self.stdout.write("Порада: Якщо знову 400, спробуйте оновити контент файлу facebook_cookies.txt")