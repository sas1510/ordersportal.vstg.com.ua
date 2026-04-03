import os
import logging
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.conf import settings
from email.mime.image import MIMEImage

logger = logging.getLogger(__name__)
def send_registration_success_email(user, tg_link=None):
    subject = "Реєстрацію завершено — Portal ViknaStyle"  # Тема листа
    from_email = settings.EMAIL_HOST_USER
    user_email = user.email

    # Налаштування кольорів (можна легко змінити тут)
    bg_color = "#ffffff"       # Фон всього листа
    card_bg = "#424242"       # Фон картки
    primary_color = "#5e83bf" # Основний синій (кнопка, лінія)
    text_main = "#5e83bf"     # Колір заголовків
    text_secondary = "#ccc" # Колір звичайного тексту
    accent_bg = "#5e83bf55"     # Фон блоку з логіном

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: {bg_color}; font-family: 'Segoe UI', Arial, sans-serif;">
        <table align="center" width="100%" style="max-width: 600px; margin: 30px auto; background-color: {card_bg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);  border: 2px solid {primary_color};">
            <tr>
                <td style="padding: 35px; text-align: center; background-color: {card_bg}; border-bottom: 4px solid {primary_color};">
                    <img src="cid:logo_vstg" alt="ViknaStyle Logo" width="160" style="display: block; margin: 0 auto;">
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 35px; text-align: center;">
                    <h2 style="color: {text_main}; font-size: 24px; margin-bottom: 15px; font-weight: 700;">
                        Вітаємо, {user.full_name or "Користувач"}!
                    </h2>
                    <p style="color: {text_secondary}; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                        Ви успішно зареєструвалися на порталі.<br>
                        Ваш акаунт активовано та повністю готовий до роботи.
                    </p>
                    
                    <div style="background-color: {accent_bg}; border: 2px solid #bee3f8; padding: 20px; margin: 30px 0; border-radius: 10px;">
                        <p style="margin: 0; color: #b9b9b9; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Ваш логін для входу:</p>
                        <p style="margin: 8px 0 0 0; color: #fff; font-size: 22px; font-weight: 800;">{user.username}</p>
                    </div>

                    <p style="color: {text_secondary}; font-size: 15px; margin-bottom: 30px;">
                        Рекомендуємо підключити наш Telegram-бот, щоб миттєво отримувати сповіщення про замовлення:
                    </p>
                    
                    <a href="{tg_link or '#'}" style="background-color: {primary_color}; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; transition: background 0.3s ease;">
                        ПІДКЛЮЧИТИ TELEGRAM
                    </a>
                </td>
            </tr>
            <tr>
                <td style="padding: 25px; text-align: center; font-size: 12px; color: #ccc; border-top: 4px solid {primary_color};">
                    <p style="margin: 0 0 5px 0;">&copy; 2026 ViknaStyle. Всі права захищені.</p>
                    <p style="margin: 0;">Це автоматичне повідомлення, будь ласка, не відповідайте на нього.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    text_content = strip_tags(html_content)

    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, [user_email])
        msg.attach_alternative(html_content, "text/html")
        msg.mixed_subtype = 'related'

        path_to_logo = "/var/www/html/ordersportal.vstg.com.ua/backend/static/images/logo.png"
        
        if os.path.exists(path_to_logo):
            with open(path_to_logo, 'rb') as f:
                img = MIMEImage(f.read())
                img.add_header('Content-ID', '<logo_vstg>')
                img.add_header('Content-Disposition', 'inline', filename='logo.png')
                msg.attach(img)

        msg.send(fail_silently=False)
        logger.info(f"Email sent to {user_email}")

    except Exception as e:
        logger.error(f"MAIL ERROR: {str(e)}")