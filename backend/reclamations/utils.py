import time
import hmac
import hashlib
import base64
from django.conf import settings

SECRET = settings.SECRET_KEY.encode()

def generate_media_token(file_guid: str, ttl_seconds: int = 180) -> str:
    exp = int(time.time()) + ttl_seconds
    payload_raw = f"{file_guid}|{exp}".encode()
    
    # 1. Кодуємо payload окремо
    payload_b64 = base64.urlsafe_b64encode(payload_raw).decode().rstrip("=")

    # 2. Робимо підпис на основі закодованого payload
    signature = hmac.new(
        SECRET,
        payload_b64.encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    # 3. Склеюємо через крапку: b64_payload.b64_signature
    return f"{payload_b64}.{sig_b64}"


from urllib.parse import unquote
import time
import hmac
import hashlib
import base64

def verify_media_token(token: str) -> str | None:
    try:
        if "." not in token:
            return None
            
        payload_b64, sig_b64 = token.split(".", 1)

        # Функція для відновлення Base64
        def decode_b64(data):
            missing_padding = len(data) % 4
            if missing_padding:
                data += '=' * (4 - missing_padding)
            return base64.urlsafe_b64decode(data)

        # 1. Перевіряємо підпис
        expected_sig = hmac.new(
            SECRET,
            payload_b64.encode(),
            hashlib.sha256
        ).digest()
        actual_sig = decode_b64(sig_b64)

        if not hmac.compare_digest(actual_sig, expected_sig):
            return None

        # 2. Декодуємо дані
        decoded_payload = decode_b64(payload_b64).decode()
        file_guid, exp = decoded_payload.split("|", 1)

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