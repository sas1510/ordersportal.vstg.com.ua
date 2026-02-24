import base64
import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError


def send_to_1c(
    *,
    payload: dict | list,
    query: str,
    url: str | None = None,
    method: str = "POST",
    headers: dict | None = None,
    timeout: int = 30,
) -> dict:
    """
    Універсальна відправка в 1С

    :param payload: dict | list — тіло запиту
    :param query: значення заголовка Query (CreateCalculation, CreateInvoice, etc.)
    :param url: URL 1С (якщо None — береться з settings.ONE_C_URL)
    :param method: HTTP метод
    :param headers: додаткові headers
    :param timeout: timeout у секундах
    """

    try:
        auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
        auth_b64 = base64.b64encode(
            auth_raw.encode("utf-8")
        ).decode("ascii")

        base_headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Authorization": f"Basic {auth_b64}",
            "Query": query,
        }

        if headers:
            base_headers.update(headers)

        response = requests.request(
            method=method,
            url=url or settings.ONE_C_URL,
            json=payload,
            headers=base_headers,
            timeout=timeout,
            verify=settings.ONE_C_VERIFY_SSL,
        )

        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        raise ValidationError({
            "detail": "Помилка зʼєднання з 1С",
            "error": str(e),
            "query": query,
            "payload_sent_to_1c": payload,
        })

    try:
        return response.json()

    except ValueError:
        raise ValidationError({
            "detail": "1С повернула не JSON",
            "query": query,
            "response_text": response.text,
            "payload_sent_to_1c": payload,
        })






def fetch_file_from_1c(
    *,
    payload: dict,
    query: str,
    timeout: int = 60,
) -> str:
    """
    Спеціалізована функція для отримання файлів у форматі base64
    """
    auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
    auth_b64 = base64.b64encode(auth_raw.encode("utf-8")).decode("ascii")

    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Authorization": f"Basic {auth_b64}",
        "Query": query,
    }

    try:
        response = requests.post(
            url=settings.ONE_C_URL,
            json=payload,
            headers=headers,
            timeout=timeout,
            verify=settings.ONE_C_VERIFY_SSL,
        )
        response.raise_for_status()
        
        # Повертаємо чистий текст (base64 рядок)
        return response.text.strip().replace('"', '') 
    
    except requests.exceptions.RequestException as e:
        raise ValidationError({"detail": "Помилка зв'язку з 1С при отриманні файлу", "error": str(e)})