from types import SimpleNamespace
from unittest.mock import patch, Mock
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .visicom_test import visicom_test_geocode

class VisicomTestApiTests(SimpleTestCase):
    def call(self, payload, role='admin'):
        request=APIRequestFactory().post('/api/integrations/visicom-test/geocode/',payload,format='json')
        force_authenticate(request,user=SimpleNamespace(pk=77,is_authenticated=True,role=role))
        return visicom_test_geocode(request)

    @patch('records.visicom_test.requests.get')
    def test_other_roles_and_missing_key_do_not_call_provider(self,get):
        for role in ['dealer','internal_dealer','manager','director','branch_manager']:
            self.assertEqual(self.call({'key':'test-key','text':'Банилів'},role).status_code,403)
        self.assertEqual(self.call({'text':'Банилів'}).status_code,400)
        get.assert_not_called()

    @patch('records.visicom_test.requests.get')
    def test_single_feature_and_reverse_coordinate_order(self,get):
        feature={'type':'Feature','id':'ADR-example','geo_centroid':{'coordinates':[25.323917,48.350816]}}
        get.return_value=Mock(status_code=200,json=lambda:feature)
        response=self.call({'key':'test-key','mode':'reverse','lat':'48,350816','lng':'25,323917'})
        self.assertEqual(response.data['features'],[feature])
        self.assertEqual(get.call_args.kwargs['params']['near'],'25.323917,48.350816')
        self.assertFalse(get.call_args.kwargs['allow_redirects'])
        self.assertEqual(response['Cache-Control'],'no-store')

    @patch('records.visicom_test.requests.get')
    def test_search_collection_empty_and_provider_errors(self,get):
        get.return_value=Mock(status_code=200,json=lambda:{'type':'FeatureCollection','features':[]})
        self.assertEqual(self.call({'key':'test-key','text':'Банилів'}).data,{'features':[]})
        self.assertEqual(get.call_args.kwargs['params']['country'],'ua')
        for status in [401,403,429,500]:
            get.return_value=Mock(status_code=status)
            response=self.call({'key':'test-key','text':'Банилів'})
            self.assertEqual(response.status_code,502)
            self.assertNotIn('test-key',str(response.data))
        get.return_value=Mock(status_code=404)
        self.assertEqual(self.call({'key':'test-key','text':'Банилів'}).data,{'features':[]})

    @patch('records.visicom_test.requests.get')
    def test_invalid_coordinates_rejected_before_request(self,get):
        for lat,lng in [('NaN',25),(91,25),(48,181),('',25)]:
            self.assertEqual(self.call({'key':'test-key','mode':'reverse','lat':lat,'lng':lng}).status_code,400)
        get.assert_not_called()

class VisicomOrderApiTests(SimpleTestCase):
    def call(self, payload, role='dealer'):
        from .visicom_test import visicom_order_geocode
        request=APIRequestFactory().post('/api/integrations/visicom/orders/geocode/',payload,format='json')
        force_authenticate(request,user=SimpleNamespace(pk=78,is_authenticated=True,role=role))
        return visicom_order_geocode(request)

    @patch.dict('os.environ', {'VISICOM_API_KEY':'server-test-key'})
    @patch('records.visicom_test.requests.get')
    def test_order_roles_use_configured_key_and_language(self,get):
        get.return_value=Mock(status_code=200,json=lambda:{'type':'FeatureCollection','features':[]})
        for role in ['dealer','internal_dealer','admin','manager']:
            self.assertEqual(self.call({'text':'Банилів'},role).status_code,200)
        self.assertEqual(get.call_args.kwargs['params']['key'],'server-test-key')
        self.assertEqual(self.call({'text':'Rimini','lang':'en'}).status_code,200)
        self.assertNotIn('country',get.call_args.kwargs['params'])
        self.assertTrue(get.call_args.args[0].endswith('/en/geocode.json'))

    @patch('records.visicom_test.requests.get')
    def test_unrelated_role_denied_without_provider_request(self,get):
        self.assertEqual(self.call({'key':'test-key','text':'Банилів'},'installer').status_code,403)
        get.assert_not_called()
