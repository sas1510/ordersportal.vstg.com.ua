"""Dealer-scoped route lookup and expiring confirmation snapshots."""
from pathlib import Path
from django.core import signing
from django.db import connection
from rest_framework.exceptions import ValidationError
from utils.GuidToBin1C import guid_to_1c_bin
from utils.BinToGuid1C import bin_to_guid_1c

SALT = 'payments.transfer-route.v1'


def find_transfer_routes(contractor, transfer_date):
    with connection.cursor() as cursor:
        query = Path(__file__).with_suffix('.sql').read_text(encoding='utf-8')
        contractor_bin = guid_to_1c_bin(str(contractor))
        cursor.execute(query, [contractor_bin, contractor_bin, transfer_date])
        rows = cursor.fetchall()
    routes = {}
    for guid, number, order in rows:
        key = str(bin_to_guid_1c(bytes(guid)))
        route = routes.setdefault(key, {'guid': key, 'number': str(number).strip(), 'orders': []})
        value = str(order).strip()
        if value not in route['orders']:
            route['orders'].append(value)
    return list(routes.values())


def route_snapshot(contractor, transfer_date, route):
    return {'contractor': str(contractor), 'date': transfer_date.isoformat(), 'route': route}


def confirm_transfer_route(contractor, transfer_date, token):
    try:
        snapshot = signing.loads(token, salt=SALT, max_age=1800)
    except signing.BadSignature:
        raise ValidationError('Підтвердження маршруту застаріло. Оберіть дату та підтвердьте замовлення ще раз.')
    if not isinstance(snapshot, dict) or snapshot.get('contractor') != str(contractor) or snapshot.get('date') != transfer_date.isoformat():
        raise ValidationError('Підтвердження не відповідає дилеру або даті передачі.')
    routes = find_transfer_routes(contractor, transfer_date)
    if snapshot.get('route') not in routes:
        raise ValidationError('Маршрутизація змінилася. Оновіть список і підтвердьте замовлення ще раз.')
    return snapshot['route']
