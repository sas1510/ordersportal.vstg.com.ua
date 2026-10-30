from types import SimpleNamespace
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .settlement_views import directory_data, delivery_settlements


class DeliverySettlementDirectoryTests(SimpleTestCase):
    def test_snapshot_is_ukraine_only_and_ids_are_unique(self):
        data=directory_data()
        self.assertEqual(data['country'],'UA')
        self.assertEqual(len(data['regions']),25)
        ids={region['id'] for region in data['regions']}
        self.assertEqual(len({item['id'] for item in data['settlements']}),len(data['settlements']))
        self.assertTrue(all(item['regionId'] in ids for item in data['settlements']))
        self.assertTrue(any(region['name']=='АР Крим' for region in data['regions']))

    def test_endpoint_requires_login_and_is_available_to_customers(self):
        request=APIRequestFactory().get('/api/delivery-settlements/')
        self.assertIn(delivery_settlements(request).status_code,(401,403))
        request=APIRequestFactory().get('/api/delivery-settlements/')
        force_authenticate(request,user=SimpleNamespace(is_authenticated=True,role='customer'))
        response=delivery_settlements(request)
        self.assertEqual(response.status_code,200)
        self.assertGreater(len(response.data['settlements']),2000)
