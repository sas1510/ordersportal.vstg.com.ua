import json
import traceback
from django.http import JsonResponse
from webpush.models import PushInformation, SubscriptionInfo

def custom_save_webpush(request):
    try:
        # Отримуємо дані (підтримуємо DRF та звичайний Django)
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        
        subscription_data = data.get('subscription')
        if not subscription_data:
            return JsonResponse({"error": "No subscription data"}, status=400)

        endpoint = subscription_data.get('endpoint')
        keys = subscription_data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')
        browser = data.get('browser', 'chrome')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # 1. Зберігаємо технічні дані в SubscriptionInfo 
        # (саме тут у тебе в БД лежать ці колонки)
        sub_info, _ = SubscriptionInfo.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'p256dh': p256dh,
                'auth': auth,
                'browser': browser,
                'user_agent': user_agent
            }
        )

        # 2. Прив'язуємо підписку до користувача в PushInformation
        # Тут зазвичай лише два поля: user та subscription
        push_info, created = PushInformation.objects.update_or_create(
            user=request.user,
            subscription=sub_info,
            defaults={}
        )

        print(f"DEBUG: Push registration SUCCESS for user {request.user.username}")
        return JsonResponse({"status": "success", "created": created}, status=201)

    except Exception as e:
        print("--- ERROR IN WEBPUSH SAVE ---")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)