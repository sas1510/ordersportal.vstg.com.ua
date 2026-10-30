from django.test import SimpleTestCase
from .serializers import CalculationCreateSerializer, CalculationUpdateSerializer


class DeliveryAddressRequiredFieldsTests(SimpleTestCase):
    address = dict(region='Чернівецька', district='Чернівецький', city='Чернівці', street='Головна', house='12-А')

    def test_each_address_field_is_required_on_create_and_update(self):
        for serializer in (CalculationCreateSerializer, CalculationUpdateSerializer):
            for field in self.address:
                for value in ('', '   ', None):
                    with self.subTest(serializer=serializer.__name__, field=field, value=value):
                        obj = serializer(data={'client_address': {**self.address, field: value}})
                        self.assertFalse(obj.is_valid())
                        self.assertIn(field, obj.errors['client_address'])
                obj = serializer(data={'client_address': {k:v for k,v in self.address.items() if k!=field}})
                self.assertFalse(obj.is_valid())
                self.assertIn(field, obj.errors['client_address'])

    def test_complete_address_keeps_alphanumeric_house_and_optional_apartment(self):
        obj = CalculationUpdateSerializer(data={'client_address': {**self.address, 'house': ' 12-А ', 'apartment': ''}})
        self.assertTrue(obj.is_valid(), obj.errors)
        self.assertEqual(obj.validated_data['client_address']['house'], '12-А')

    def test_pickup_saved_address_and_unrelated_updates_are_not_blocked(self):
        for payload in ({'comment':'Test'}, {'delivery_is_pickup':True}, {'client_address':None}, {'client_address':{}}):
            obj = CalculationUpdateSerializer(data=payload)
            self.assertTrue(obj.is_valid(), obj.errors)
