import time
import hmac
import hashlib
import base64
from django.conf import settings

SECRET = settings.SECRET_KEY.encode()

def generate_media_token(file_guid: str, ttl_seconds: int = 180) -> str:
    exp = int(time.time()) + ttl_seconds
    payload = f"{file_guid}|{exp}".encode()

    signature = hmac.new(
        SECRET,
        payload,
        hashlib.sha256
    ).digest()

    # 🔐 без "=" → ідеально для URL
    token = base64.urlsafe_b64encode(
        payload + b"." + signature
    ).decode().rstrip("=")

    return token


from urllib.parse import unquote
import time
import hmac
import hashlib
import base64

def verify_media_token(token: str) -> str | None:
    try:
        # 🔓 якщо прийшов quoted
        token = unquote(token)

        # 🔁 повертаємо padding
        padding = "=" * (-len(token) % 4)
        raw = base64.urlsafe_b64decode(token + padding)

        # 🔍 чітка валідація формату
        if b"." not in raw:
            return None

        payload, signature = raw.rsplit(b".", 1)

        expected_sig = hmac.new(
            SECRET,
            payload,
            hashlib.sha256
        ).digest()

        if not hmac.compare_digest(signature, expected_sig):
            return None

        decoded = payload.decode(errors="strict")
        if "|" not in decoded:
            return None

        file_guid, exp = decoded.split("|", 1)

        if int(exp) < int(time.time()):
            return None

        return file_guid

    except Exception:
        return None



from django.db import connection
from backend.utils.GuidToBin1C import guid_to_1c_bin

import zlib
import struct
from django.db import connection
import zlib
import struct
from django.db import connection

def load_file_from_db(file_guid: str) -> bytes | None:
    """
    Завантажує бінарний файл з бази 1С та розпаковує його, 
    якщо він стиснутий (стандартна поведінка Хранилища 1С).
    """
    file_guid_bin = guid_to_1c_bin(file_guid)

    with connection.cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetBinaryFile @FileLink = %s",
            [file_guid_bin]
        )
        row = cursor.fetchone()

        if not row or not row[0]:
            return None

        file_content = row[0]  # Це VARBINARY з бази

        # 1С зберігає дані з префіксом (зазвичай 16 байт заголовка)
        # Якщо файл стиснутий, він починається з певних маркерів.
        # Спробуємо розпакувати дані, пропускаючи заголовок 1С.
        
        try:
            # Більшість файлів у Хранилищі 1С стиснуті Zlib.
            # Спроба розпакувати, пропускаючи перші 16 байт (стандартний заголовок 1С)
            # Якщо заголовок іншого розміру, можливо знадобиться відступ 2, 4 або 8 байт.
            return zlib.decompress(file_content[16:])
        except (zlib.error, IndexError):
            try:
                # Якщо не вдалося з 16, пробуємо з 2 байт (іноді заголовок мінімальний)
                return zlib.decompress(file_content[2:])
            except zlib.error:
                # Якщо взагалі не розпаковується — повертаємо як є (можливо файл не стиснутий)
                return bytes(file_content)
            


import zlib


def extract_1c_binary(raw_blob):
    """Декодування внутрішнього формату 1С"""
    if not raw_blob: return None
    decoded = None
    for offset in range(0, 128):
        try:
            decoded = zlib.decompress(raw_blob[offset:], wbits=-15)
            break
        except zlib.error: continue
    
    if not decoded: return None
    
    signatures = [b'\xff\xd8\xff', b'\x89PNG\r\n\x1a\n', b'%PDF', b'PK\x03\x04', b'GIF8']
    for sig in signatures:
        pos = decoded.find(sig)
        if pos != -1: return decoded[pos:]
    return decoded