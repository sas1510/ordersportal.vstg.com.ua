from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID
from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied, ValidationError
from utils.GuidToBin1C import guid_to_1c_bin
from .dealer_groups import requested_dealer_group, classify_dealer, filter_report_dealer_group


class DealerReportGroupTests(SimpleTestCase):
    def test_same_folder_ancestry_and_priority_as_order_report(self):
        cases = [
            (('Київ', 'Область', 'Дилера'), 'Дилера'),
            (('Польща', 'ЕКСПОРТ', ''), 'Експорт'),
            (('РУТА МАГАЗИН', 'Область', 'ЕКСПОРТ'), 'Дилера'),
            (('Львів', 'ФИЛИАЛЫ', 'Дилера'), 'Філіали'),
            (('Київ', 'Область', 'ТОВ "Наша фірма"'), 'ТОВ "Наша фірма"'),
            (('Інша папка', '', None), 'Інше'),
            ((' ЕКСПОРТ ', '', None), 'Експорт'),
        ]
        for args, expected in cases:
            with self.subTest(args=args):self.assertEqual(classify_dealer(*args), expected)

    def test_only_admin_can_select_valid_group(self):
        for role in ['dealer', 'manager', 'region_manager', 'director']:
            request=SimpleNamespace(GET={'dealer_group':'Експорт'},user=SimpleNamespace(role=role))
            with self.subTest(role=role),self.assertRaises(PermissionDenied):requested_dealer_group(request)
        request=SimpleNamespace(GET={'dealer_group':'Експорт'},user=SimpleNamespace(role='admin'))
        self.assertEqual(requested_dealer_group(request),'Експорт')
        request.GET['dealer_group']='invalid'
        with self.assertRaises(ValidationError):requested_dealer_group(request)

    def test_missing_filter_keeps_existing_scope(self):
        request=SimpleNamespace(GET={},user=SimpleNamespace(role='manager'))
        self.assertIsNone(requested_dealer_group(request))
        rows=[{'CustomerID':'anything'}]
        self.assertIs(filter_report_dealer_group(rows,None,'CustomerID'),rows)

    @patch('records.dealer_groups.connection')
    def test_filter_only_removes_rows_and_supports_both_report_id_fields(self, connection):
        first='11111111-2222-4333-8444-555555555555';second='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
        cursor=connection.cursor.return_value.__enter__.return_value
        cursor.fetchall.return_value=[(guid_to_1c_bin(first),'Папка','Область','Дилера'),
                                     (guid_to_1c_bin(second),'Польща','Експорт','')]
        for field in ['CustomerID','CustomerLink']:
            rows=[{field:memoryview(guid_to_1c_bin(first)),'number':1},
                  {field:UUID(second),'number':2}]
            filtered=filter_report_dealer_group(rows,'Експорт',field)
            self.assertEqual([r['number'] for r in filtered],[2])
            self.assertEqual(len(rows),2)
        self.assertNotIn(second,cursor.execute.call_args.args[0])

    @patch('records.dealer_groups.connection')
    def test_unclassified_contractors_go_only_to_other(self, connection):
        value='11111111-2222-4333-8444-555555555555'
        connection.cursor.return_value.__enter__.return_value.fetchall.return_value=[]
        rows=[{'CustomerID':value}]
        self.assertEqual(filter_report_dealer_group(rows,'Інше','CustomerID'),rows)
        self.assertEqual(filter_report_dealer_group(rows,'Дилера','CustomerID'),[])

class DealerReportGroupEndpointTests(SimpleTestCase):
    def request(self, role='admin'):
        from rest_framework.test import APIRequestFactory, force_authenticate
        request=APIRequestFactory().get('/api/report/', {'year':'2026','month':'10','dealer_group':'Експорт'})
        force_authenticate(request,user=SimpleNamespace(id=1,pk=1,username='admin',role=role,is_authenticated=True,is_active=True))
        return request

    def test_both_monthly_reports_apply_group_before_formatting_and_counts(self):
        from .views import complaints_view_all_by_month, get_additional_orders_info_all
        first=guid_to_1c_bin('11111111-2222-4333-8444-555555555555')
        second=guid_to_1c_bin('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
        for view, field, number_field in [(complaints_view_all_by_month,'CustomerLink','ComplaintNumber'),
                                          (get_additional_orders_info_all,'CustomerID','AdditionalOrderNumber')]:
            rows=[{field:first,number_field:'first','Customer':'Dealer'},
                  {field:second,number_field:'export','Customer':'Export'}]
            for row in rows: row['AdditionalOrderDate']=__import__('datetime').datetime(2026,10,12)
            columns=list(rows[0])
            with self.subTest(view=view.__name__), \
                 patch('records.views.get_maintenance_json_response',return_value=None), \
                 patch('records.views.get_dealer_scope_requester_ids',return_value=[1]), \
                 patch('records.views.connection') as connection, \
                 patch('records.views.filter_report_dealer_group',return_value=[rows[1]]) as filter_group:
                cursor=connection.cursor.return_value.__enter__.return_value
                cursor.description=[(key,) for key in columns]
                cursor.fetchall.return_value=[tuple(r[key] for key in columns) for r in rows]
                response=view(self.request())
                self.assertEqual(response.status_code,200)
                filter_group.assert_called_once_with(rows,'Експорт',field)
                payload=response.data if hasattr(response,'data') else __import__('json').loads(response.content)
                result=payload['data']
                if isinstance(result,dict):result=result['calculation']
                self.assertEqual(len(result),1)

    def test_group_filter_cannot_be_used_by_manager(self):
        from .views import get_additional_orders_info_all
        with patch('records.views.get_maintenance_json_response',return_value=None):
            response=get_additional_orders_info_all(self.request(role='manager'))
        self.assertEqual(response.status_code,403)

class DealerRegionGroupingTests(SimpleTestCase):
    @patch('records.views.dealer_folder_regions')
    @patch('records.views.connection')
    @patch('records.views.get_dealer_scope_requester_ids', return_value=[1])
    def test_dealers_use_folder_regions_for_regional_totals(self, scope, db, regions):
        from records.views import _filter_accessible_dealer_report_by_group
        guid='11111111-2222-4333-8444-555555555555'
        cursor=db.cursor.return_value.__enter__.return_value
        columns=['ContractorID','OrderNumber','Customer','DealerRegion','ConstructionsCount','OrderSum']
        cursor.description=[(name,) for name in columns]
        cursor.fetchall.return_value=[(guid,'01-1','Дилер','Неправильна папка',2,150)]
        regions.return_value={guid:'Львівська область'}
        result=_filter_accessible_dealer_report_by_group(
            {'dealers':[],'totals':{}},SimpleNamespace(id=1),'2026-10-01','2026-10-29','Дилера')
        self.assertEqual(result['dealers'][0]['region_name'],'Львівська область')
        self.assertEqual(result['regions'][0]['region_name'],'Львівська область')
        self.assertEqual(result['regions'][0]['total_turnover'],150)
        self.assertEqual(result['regions'][0]['orders_count'],1)
