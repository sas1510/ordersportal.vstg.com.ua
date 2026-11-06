from unittest.mock import patch
from django.test import SimpleTestCase
from utils.GuidToBin1C import guid_to_1c_bin
from .calculation_metadata import attach_calculation_metadata


class CalculationMetadataTests(SimpleTestCase):
    guid='760bbe0f-d69b-11f1-9cfb-4cd98f08e56d'

    @patch('records.calculation_metadata.connection')
    def test_internal_number_is_separate_and_measurement_link_uses_saved_identity(self,connection):
        cursor=connection.cursor.return_value.__enter__.return_value
        cursor.fetchall.side_effect=[[(guid_to_1c_bin(self.guid),'000112900  ')],[(self.guid.replace('-',''),'zamir-16','119')]]
        result=attach_calculation_metadata([{'id':self.guid,'number':'Dealer-100'}])[0]
        self.assertEqual(result['number'],'Dealer-100')
        self.assertEqual(result['oneCNumber'],'000112900')
        self.assertTrue(result['fromMeasurement'])
        self.assertEqual(result['measurementUrl'],'/zamir?request_id=16&dealer_id=119')
        self.assertEqual(result['measurementDealerId'],119)
        self.assertEqual(result['measurementNumber'],'zamir-16')
        self.assertNotIn('ResponseBody',result)

    @patch('records.calculation_metadata.connection')
    def test_unverified_source_or_number_never_generates_external_link(self,connection):
        cursor=connection.cursor.return_value.__enter__.return_value
        cursor.fetchall.side_effect=[[],[(self.guid,'https://untrusted.invalid/','119')]]
        result=attach_calculation_metadata([{'id':self.guid}])[0]
        self.assertIsNone(result['measurementUrl'])
        self.assertIsNone(result['oneCNumber'])

    @patch('records.calculation_metadata.connection')
    def test_portal_calculation_has_number_without_measurement_link(self,connection):
        cursor=connection.cursor.return_value.__enter__.return_value
        cursor.fetchall.side_effect=[[(guid_to_1c_bin(self.guid),'000012345')],[]]
        result=attach_calculation_metadata([{'id':self.guid}])[0]
        self.assertFalse(result['fromMeasurement'])
        self.assertIsNone(result['measurementUrl'])
        self.assertEqual(result['oneCNumber'],'000012345')

    @patch('records.calculation_metadata.connection')
    def test_empty_or_synthetic_ids_do_not_query_database(self,connection):
        self.assertEqual(attach_calculation_metadata([]),[])
        self.assertIsNone(attach_calculation_metadata([{'id':'default'}])[0]['oneCNumber'])
        connection.cursor.assert_not_called()
