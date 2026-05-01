from facebook_page_scraper import Facebook_scraper
from django.core.management.base import BaseCommand
from portal_media.models import MediaResource

class Command(BaseCommand):
    def handle(self, *args, **options):
        page_name = "viknastyletraiding"
        posts_count = 20  # ТУТ ТИ САМА СТАВИШ БУДЬ-ЯКУ КІЛЬКІСТЬ
        browser = "firefox" # або "chrome"
        proxy = None 

        timeout = 600 # секунд
        headless = True # щоб не відкривалося вікно браузера на сервері

        scraper = Facebook_scraper(
            page_name="viknastyletraiding", 
            posts_count=20, 
            browser="chrome", 
            headless=True  # ЦЕ ГОЛОВНЕ: каже браузеру не шукати монітор
        )
        
        # Отримуємо дані як список словників
        posts_data = scraper.get_posts()

        for post in posts_data:
            MediaResource.objects.update_or_create(
                external_id=post['post_id'],
                defaults={
                    'title': post['text'][:100] if post['text'] else "Без назви",
                    'description': post['text'],
                    'url': post['post_url'],
                    'image_url': post['image_lowquality'], # або post['images'] (масив)
                    'resource_type': 'facebook',
                    'created_at': post['time']
                }
            )
        self.stdout.write(f"Успішно імпортовано {len(posts_data)} постів!")