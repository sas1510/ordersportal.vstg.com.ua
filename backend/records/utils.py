from django.db import connections
from backend.utils.BinToGuid1C import bin_to_guid_1c

def get_author_from_1c(writer_id_bin):
    """
    Повертає автора з 1С через процедуру GetAuthorByWriterID
    або None
    """
    if not writer_id_bin:
        return None

    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetAuthorByWriterID @WriterID = %s",
            [writer_id_bin],
        )
        row = cursor.fetchone()

    if not row:
        return None

    writer_id, author_type, author_name, extra_info = row

    return {
        "id_1c": bin_to_guid_1c(writer_id),
        "type": author_type,
        "full_name": author_name,
        "extra": extra_info,
    }




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

import zlib
import zlib

def trim_pdf(data: bytes) -> bytes:
    eof = data.rfind(b"%%EOF")
    if eof != -1:
        return data[:eof + 5]
    return data


def extract_1c_binary(raw_blob):
    if not raw_blob:
        return None

    raw_blob = bytes(raw_blob)

    # PDF ставимо ПЕРШИМ
    signatures = [
        b"%PDF",
        b"PK\x03\x04",
        b"\x89PNG\r\n\x1a\n",
        b"\xff\xd8\xff",
        b"GIF8",
        b"RIFF",
    ]

    # 1. Спочатку шукаємо готовий файл у raw_blob
    for sig in signatures:
        pos = raw_blob.find(sig)
        if pos != -1:
            data = raw_blob[pos:]
            if sig == b"%PDF":
                data = trim_pdf(data)
            return data

    # 2. Якщо не знайшли — пробуємо zlib
    for offset in range(0, 256):
        for wbits in (zlib.MAX_WBITS, -15):
            try:
                decoded = zlib.decompress(raw_blob[offset:], wbits)
            except zlib.error:
                continue

            for sig in signatures:
                pos = decoded.find(sig)
                if pos != -1:
                    data = decoded[pos:]
                    if sig == b"%PDF":
                        data = trim_pdf(data)
                    return data

    return None



def guess_extension_from_bytes(file_bytes):
    """Визначає розширення за першими байтами файлу (сигнатурами)"""
    if file_bytes.startswith(b'\xff\xd8\xff'):
        return '.jpg'
    if file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        return '.png'
    if file_bytes.startswith(b'%PDF'):
        return '.pdf'
    if file_bytes.startswith(b'RIFF') and file_bytes[8:12] == b'WEBP':
        return '.webp'
    return ''