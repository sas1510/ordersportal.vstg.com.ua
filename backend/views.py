import uuid
import logging
from django.http import JsonResponse
from django.shortcuts import render

logger = logging.getLogger(__name__)

def custom_error_500(request):
    error_id = str(uuid.uuid4())[:8].upper()
    logger.error(f"SERVER ERROR ID: {error_id} | Path: {request.path}")

    # Перевіряємо, чи це запит до API (чи він починається з /api/)
    if request.path.startswith('/api/'):
        return JsonResponse({
            'error': 'Вибачте, сталася внутрішня помилка сервера.',
            'error_id': error_id
        }, status=500)

    # Якщо це звичайний запит через браузер (наприклад, в адмінку)
    return render(request, '500.html', {'error_id': error_id}, status=500)