from datetime import date
from unittest.mock import patch
from uuid import UUID
from django.core import signing
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from .transfer_routes import SALT, confirm_transfer_route, route_snapshot, find_transfer_routes


class TransferRouteTests(SimpleTestCase):
    contractor = UUID('9056e09d-a7a0-11ed-8142-74867ad9d525')
    day = date(2026, 10, 20)
    route = {'guid': '9056e09d-a7a0-11ed-8142-74867ad9d525', 'number': '0000123', 'orders': ['04-89314']}

    def token(self):
        return signing.dumps(route_snapshot(self.contractor, self.day, self.route), salt=SALT)

    def test_confirmation_rechecks_current_dealer_routes(self):
        with patch('payments.transfer_routes.find_transfer_routes', return_value=[self.route]) as lookup:
            self.assertEqual(confirm_transfer_route(self.contractor, self.day, self.token()), self.route)
        lookup.assert_called_once_with(self.contractor, self.day)

    def test_confirmation_for_another_dealer_or_day_is_rejected(self):
        for contractor, day in [(UUID(int=1), self.day), (self.contractor, date(2026, 10, 21))]:
            with self.subTest(contractor=contractor, day=day), patch('payments.transfer_routes.find_transfer_routes') as lookup:
                with self.assertRaises(ValidationError):
                    confirm_transfer_route(contractor, day, self.token())
                lookup.assert_not_called()

    def test_changed_order_list_requires_new_confirmation(self):
        changed = {**self.route, 'orders': ['04-89314', '04-89315']}
        with patch('payments.transfer_routes.find_transfer_routes', return_value=[changed]):
            with self.assertRaises(ValidationError):
                confirm_transfer_route(self.contractor, self.day, self.token())

    def test_tampered_and_expired_confirmations_rejected(self):
        for error in (signing.BadSignature(), signing.SignatureExpired()):
            with patch('payments.transfer_routes.signing.loads', side_effect=error):
                with self.assertRaises(ValidationError):
                    confirm_transfer_route(self.contractor, self.day, 'invalid')

    def test_lookup_is_dealer_scoped_and_groups_orders_per_route(self):
        with patch('payments.transfer_routes.connection') as connection:
            cursor = connection.cursor.return_value.__enter__.return_value
            cursor.fetchall.return_value = [(bytes(16), '001', '04-89314'), (bytes(16), '001', '04-89315')]
            routes = find_transfer_routes(self.contractor, self.day)
        self.assertEqual(len(routes), 1)
        self.assertEqual(routes[0]['orders'], ['04-89314', '04-89315'])
        sql, params = cursor.execute.call_args.args
        self.assertIn('Z.Контрагент = %s', sql)
        self.assertEqual(params[0], params[1])
        self.assertEqual(params[2], self.day)
        self.assertIn('DATEADD(DAY, D.DeliveryDayOffset, D.FirstUnloadDate) = %s', sql)
        self.assertNotIn('ДатаЗагрузкиМаршрута', sql)
        self.assertIn('FROM RouteRows AS RR', sql)
