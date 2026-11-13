"""Read-only Visicom geocoding for local order forms and the isolated playground."""
import math
import requests
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

class VisicomTestThrottle(UserRateThrottle):
    rate = '60/min'
    scope = 'visicom_test'

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([VisicomTestThrottle])
def visicom_test_geocode(request):
    if str(getattr(request.user, 'role', '')).strip().lower() != 'admin':
        return Response({'error': 'Тест доступний лише адміністратору.'}, status=403)
    return _geocode(request.data, str(request.data.get('key') or '').strip())


def _geocode(data, key):
    if not key or len(key) > 512:
        return Response({'error': 'Введіть API-ключ Visicom.'}, status=400)
    lang = data.get('lang') if data.get('lang') in ('uk', 'en', 'ru') else 'uk'
    params = {'key': key, 'limit': 5}
    if lang != 'en':
        params['country'] = 'ua'
    if data.get('mode') == 'reverse':
        try:
            lat, lng = (float(str(data[name]).replace(',', '.')) for name in ('lat', 'lng'))
            if not (math.isfinite(lat) and math.isfinite(lng) and -90 <= lat <= 90 and -180 <= lng <= 180):
                raise ValueError()
        except (KeyError, ValueError, TypeError):
            return Response({'error': 'Некоректні координати.'}, status=400)
        params.update(near=f'{lng},{lat}', categories='adr_address', radius=200, order='distance', limit=1)
    else:
        text = str(data.get('text') or '').strip()
        if not 3 <= len(text) <= 300:
            return Response({'error': 'Введіть адресу від 3 до 300 символів.'}, status=400)
        params.update(text=text, categories='adr_address,adr_street,adm_settlement')
    try:
        response = requests.get(f'https://api.visicom.ua/data-api/5.0/{lang}/geocode.json', params=params, timeout=(5, 15), allow_redirects=False)
        if response.status_code == 404:
            return Response({'features': []})
        if response.status_code != 200:
            return Response({'error': 'Visicom не виконав запит. Перевірте ключ і ліміти.', 'provider_status': response.status_code}, status=502)
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError()
        features = [data] if data.get('type') == 'Feature' else data.get('features', [])
        return Response({'features': features if isinstance(features, list) else []}, headers={'Cache-Control': 'no-store'})
    except (requests.RequestException, ValueError):
        # Do not log exception URLs, which can contain the API key.
        return Response({'error': 'Не вдалося отримати відповідь Visicom.'}, status=502)


ORDER_ROLES = {'admin', 'director', 'manager', 'region_manager', 'branch_manager', 'branches_director', 'dealer', 'internal_dealer', 'customer'}


def _order_role_allowed(request):
    return str(getattr(request.user, 'role', '')).strip().lower() in ORDER_ROLES


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visicom_order_config(request):
    import os
    if not _order_role_allowed(request):
        return Response({'error': 'Немає доступу до адрес замовлень.'}, status=403)
    # Tile keys are necessarily used by the browser. Keep geocoding credentials server-side.
    tile_key = os.getenv('VISICOM_TILES_KEY') or os.getenv('VISICOM_API_KEY') or ''
    return Response({'tile_key': tile_key, 'geocode_configured': bool(os.getenv('VISICOM_API_KEY'))}, headers={'Cache-Control':'no-store'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([VisicomTestThrottle])
def visicom_order_geocode(request):
    import os
    if not _order_role_allowed(request):
        return Response({'error': 'Немає доступу до адрес замовлень.'}, status=403)
    key = os.getenv('VISICOM_API_KEY') or str(request.data.get('key') or '').strip()
    return _geocode(request.data, key)
