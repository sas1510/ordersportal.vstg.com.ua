import base64
import requests
import logging
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

def send_to_1c(query_name: str, payload: dict, timeout: int = 30) -> dict:
    """
    Універсальна утиліта для відправки запитів до 1С.
    :param query_name: Назва операції (заголовок "Query")
    :param payload: Тіло запиту (dict)
    :param timeout: Тайм-аут запиту
    """
    auth_raw = f"{settings.ONE_C_USER}:{settings.ONE_C_PASSWORD}"
    auth_b64 = base64.b64encode(auth_raw.encode()).decode()

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Query": query_name,
    }

    try:
        response = requests.post(
            settings.ONE_C_URL,
            json=payload,
            headers=headers,
            timeout=timeout,
            verify=settings.ONE_C_VERIFY_SSL,
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        logger.error(f"1C Connection Error ({query_name}): {str(e)}")
        raise ValidationError({
            "detail": "Помилка зʼєднання з 1С",
            "query": query_name,
            "error": str(e)
        })
    except ValueError:
        logger.error(f"1C Invalid Response ({query_name}): {response.text}")
        raise ValidationError({
            "detail": "1С повернула некоректний формат даних (не JSON)",
            "query": query_name
        })