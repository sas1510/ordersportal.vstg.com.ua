import requests
from django.conf import settings

TELEGRAM_BOT_FILE_LIMIT_BYTES = 50 * 1024 * 1024


def send_telegram_message(telegram_chat_id: int, text: str):
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"

    response = requests.post(url, json={
        "chat_id": telegram_chat_id,
        "text": text,
        "parse_mode": "HTML",
    })

    response.raise_for_status()
    return response.json()


def send_telegram_file(telegram_chat_id: int, file_obj, caption: str = ""):
    content_type = file_obj.content_type or "application/octet-stream"
    file_size = getattr(file_obj, "size", None)

    if file_size and file_size > TELEGRAM_BOT_FILE_LIMIT_BYTES:
        raise ValueError("Telegram file is too large for bot upload")

    if content_type.startswith("image/"):
        method = "sendPhoto"
        field_name = "photo"
    elif content_type.startswith("video/"):
        method = "sendVideo"
        field_name = "video"
    elif content_type.startswith("audio/"):
        method = "sendAudio"
        field_name = "audio"
    else:
        method = "sendDocument"
        field_name = "document"

    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/{method}"

    file_obj.seek(0)

    response = requests.post(
        url,
        data={
            "chat_id": telegram_chat_id,
            "caption": caption,
            "parse_mode": "HTML",
        },
        files={
            field_name: (
                file_obj.name,
                file_obj.read(),
                content_type,
            )
        },
    )

    response.raise_for_status()
    return response.json()


def get_telegram_file_info(file_id: str):
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getFile"

    response = requests.get(url, params={
        "file_id": file_id
    })

    response.raise_for_status()
    return response.json()["result"]


def download_telegram_file(file_id: str):
    file_info = get_telegram_file_info(file_id)
    file_path = file_info["file_path"]

    url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}"

    response = requests.get(url)
    response.raise_for_status()

    return {
        "bytes": response.content,
        "file_path": file_path,
        "file_size": file_info.get("file_size"),
    }
