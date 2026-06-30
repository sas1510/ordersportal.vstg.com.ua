import requests
from django.conf import settings


def get_bot_token():
    return (
        getattr(settings, "BOT_TOKEN", None)
        or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    )


def parse_telegram_response(response):
    if response.status_code == 413:
        return {
            "ok": False,
            "error": "Файл завеликий для відправки в Telegram",
            "status_code": 413,
        }

    if not response.ok:
        return {
            "ok": False,
            "error": response.text,
            "status_code": response.status_code,
        }

    return response.json()


def send_telegram_message(
    telegram_chat_id: int,
    text: str,
    reply_markup=None,
    reply_to_message_id=None,
):
    url = f"https://api.telegram.org/bot{get_bot_token()}/sendMessage"
    payload = {
        "chat_id": telegram_chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    if reply_markup:
        payload["reply_markup"] = reply_markup

    if reply_to_message_id:
        payload["reply_to_message_id"] = reply_to_message_id

    response = requests.post(
        url,
        json=payload,
        timeout=30,
    )

    return parse_telegram_response(response)


def send_telegram_file(telegram_chat_id: int, file_obj, caption: str = ""):
    content_type = file_obj.content_type or "application/octet-stream"

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

    url = f"https://api.telegram.org/bot{get_bot_token()}/{method}"

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
        timeout=60,
    )

    return parse_telegram_response(response)


def get_telegram_file_info(file_id: str):
    url = f"https://api.telegram.org/bot{get_bot_token()}/getFile"

    response = requests.get(
        url,
        params={"file_id": file_id},
        timeout=30,
    )

    data = parse_telegram_response(response)

    if not data.get("ok"):
        return data

    return data["result"]


def download_telegram_file(file_id: str):
    file_info = get_telegram_file_info(file_id)

    if not isinstance(file_info, dict) or not file_info.get("file_path"):
        return {
            "ok": False,
            "error": "Не вдалося отримати файл з Telegram",
            "file_info": file_info,
        }

    file_path = file_info["file_path"]

    url = f"https://api.telegram.org/file/bot{get_bot_token()}/{file_path}"

    response = requests.get(url, timeout=60)

    if response.status_code == 413:
        return {
            "ok": False,
            "error": "Файл завеликий для завантаження з Telegram",
            "status_code": 413,
        }

    if not response.ok:
        return {
            "ok": False,
            "error": response.text,
            "status_code": response.status_code,
        }

    return {
        "ok": True,
        "bytes": response.content,
        "file_path": file_path,
        "file_size": file_info.get("file_size"),
    }
