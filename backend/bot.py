import os
import django
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandObject, Command
from django.db import connection
from asgiref.sync import sync_to_async
from dotenv import load_dotenv
from utils.BinToGuid1C import bin_to_guid_1c
from utils.GuidToBin1C import guid_to_1c_bin

# 1. Завантажуємо .env з тієї ж папки, де лежить скрипт
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '.env')

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
    print(f"✅ Файл .env знайдено в папці backend: {dotenv_path}")
else:
    print(f"❌ ПОМИЛКА: Файл .env НЕ знайдено у {current_dir}")
    # Виведемо список файлів у папці для діагностики
    print(f"Вміст папки: {os.listdir(current_dir)}")

# 2. Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# 3. Отримуємо токен
API_TOKEN = os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN') 

if not API_TOKEN:
    print("❌ Токен все ще None. Перевір, чи в .env точно є рядок: NOTIFICATION_TELEGRAM_BOT_TOKEN=...")
    exit()

bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Обгортаємо синхронну функцію для роботи в асинхронному середовищі
@sync_to_async
def get_author_name_from_procedure(guid_str):
    """Синхронний виклик процедури через Django connection"""
    try:
        binary_guid = guid_to_1c_bin(guid_str)
        with connection.cursor() as cursor:
            # Використовуємо f-строку або параметри залежно від драйвера
            # Для MSSQL краще передавати параметри окремо
            cursor.execute("EXEC [dbo].[GetAuthorByWriterID] @WriterID=%s", [binary_guid])
            row = cursor.fetchone()
            
            if row:
                # row[2] - AuthorName згідно з твоєю процедурою
                author_name = row[2]
                author_type = row[1]
                if author_type == 'Unknown':
                    return None
                return author_name
        return None
    except Exception as e:
        print(f"SQL Error in procedure: {e}")
        return None

@dp.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    guid_str = command.args
    
    if not guid_str:
        await message.answer("👋 Привіт! Будь ласка, скористайтеся посиланням із порталу.")
        return

    # ТЕПЕР викликаємо через await, бо функція обгорнута в sync_to_async
    author_name = await get_author_name_from_procedure(guid_str)

    if author_name:
        await message.answer(
            f"Привіт, <b>{author_name}</b>! 👋\n\n"
            f"Ваш Telegram ідентифіковано через базу 1С.",
            parse_mode="HTML"
        )
        print(f"Успіх! Знайдено: {author_name}")
    else:
        await message.answer("❌ Користувача з таким GUID не знайдено.")

async def main():
    print("Бот запущений. SQL-контекст виправлено.")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())