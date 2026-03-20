import os
import django
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandObject, Command
from django.db import connection
from asgiref.sync import sync_to_async  # Додай цей імпорт

# 1. Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from utils.GuidToBin1C import guid_to_1c_bin

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