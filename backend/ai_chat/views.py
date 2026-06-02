import json
import logging
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from .services.agent import run_agent  
from .services.prompts import build_system_prompt
from backend.permissions import (
    IsAuthenticatedOr1CApiKey, 
    IsAdminJWTOr1CApiKey, 
    IsAdminJWT
)

from rest_framework.decorators import api_view, permission_classes

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(["POST"]) 
@permission_classes([IsAuthenticatedOr1CApiKey]) 
def chat_view(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'invalid json'}, status=400)

    user_text = body.get('message', '').strip()
    raw_messages = body.get('messages', [])

    if not user_text:
        return JsonResponse({'error': 'empty message'}, status=400)

    # 1. Санітайзер та очищення історії повідомлень від вкладених об'єктів
    cleaned_messages = []
    for msg in raw_messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')

        if isinstance(content, dict):
            # Безпечно витягуємо чистий текст відповіді, щоб ШІ не отримував об'єкти
            content = content.get('text_interpretation') or content.get('reply') or str(content)
        elif not isinstance(content, str):
            content = str(content)

        cleaned_messages.append({
            "role": role,
            "content": content
        })

    # 2. Перевірка та захист від дублювання ролей (alternating roles)
    last_user_msg = None
    for msg in reversed(cleaned_messages):
        if msg.get('role') == 'user':
            last_user_msg = msg
            break

    if not last_user_msg or last_user_msg.get('content') != user_text:
        cleaned_messages.append({
            "role": "user",
            "content": user_text
        })
    else:
        if cleaned_messages[-1].get('role') != 'user':
            cleaned_messages = [m for m in cleaned_messages if m.get('content') != user_text or m.get('role') != 'user']
            cleaned_messages.append({
                "role": "user",
                "content": user_text
            })

    system_prompt = build_system_prompt()

    try:
        # Виклик ядра ШІ-агента
        reply_data = run_agent(
            user=request.user,
            system_prompt=system_prompt,
            messages=cleaned_messages
        )

        return JsonResponse({
            'status': 'success',
            'reply': reply_data
        })

    except Exception as e:
        # Залишаємо логування в консоль бекенду
        logger.error(f"Error in AI Agent chat view: {str(e)}", exc_info=True)
        
        # Тимчасово віддаємо опис помилки ШІ на фронтенд, щоб ви бачили причину прямо на екрані
        return JsonResponse({
            'status': 'success',
            'reply': {
                'text_interpretation': f"⚠️ Внутрішня помилка ШІ: {str(e)}. Спробуйте надіслати повідомлення ще раз.",
                'has_chart': False,
                'chart_type': 'none',
                'chart_data': [],
                'order_numbers': [],
                'debtor_orders': []
            }
        })