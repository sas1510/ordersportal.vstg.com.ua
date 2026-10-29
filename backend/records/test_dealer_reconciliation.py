from datetime import date,datetime
from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from django.core.cache.backends.locmem import LocMemCache
from rest_framework.test import APIRequestFactory,force_authenticate
from .dealer_reconciliation import assemble_report,filter_report,parse_period,seed_data,three_months_before,query_parts,STATE
from .dealer_reconciliation_views import dealer_reconciliation

class DealerConstructionsTests(SimpleTestCase):
    def seed(self):
        return {'calls':{'D1':{'aliases':['Інша назва']}},'additional_dealers':['D3'],'registered':[],'old_accounts':[],'sources':{},'reviewed_at':'2026-10-28'}
    def report(self):
        dealers=[{'DealerGUID':g,'DealerName':g,'ReportGroup':region,'FolderPath':'ДИЛЕРА / '+region,'NewAccounts':1} for g,region in [('D1','Область А'),('D2','Область Б'),('D3','Область Б')]]
        orders=[{'OrderGUID':g,'DealerGUID':d,'OrderNumber':g,'OrderDate':datetime(2026,10,10),'Constructions':q} for g,d,q in [('O1','D1',3),('O2','D1',2),('O3','D2',7)]]
        apps=[{'ApplicationGUID':g,'DealerGUID':d,'ApplicationNumber':g,'ApplicationDate':datetime(2026,10,5),'Constructions':q,'AuthorGUID':d,'AuthorType':bytes.fromhex('0000007a')} for g,d,q in [('A1','D1',5),('A2','D1',4),('A3','D2',8),('A4','D2',6)]]
        links=[{'ApplicationGUID':a,'OrderGUID':o} for a,o in [('A1','O1'),('A1','O1'),('A1','O2'),('A2','O1'),('A3','O3')]]
        # A cross-contractor link must not transfer constructions between dealers.
        links.append({'ApplicationGUID':'A1','OrderGUID':'O3'})
        return assemble_report(dealers,orders+[orders[0]],links,apps,self.seed(),date(2026,10,1),date(2026,10,28),date(2026,7,28))
    def test_unique_orders_and_many_to_many_application_conversion(self):
        r=self.report();t=r['totals']
        self.assertEqual((t['applications'],t['applicationConstructions']),(4,23))
        self.assertEqual((t['linkedOrders'],t['linkedConstructions']),(3,12))
        self.assertEqual((t['convertedApplications'],t['conversion']),(3,75))
        self.assertNotIn('independentApplicationConstructions',t)
        self.assertTrue(all('status' not in row and 'statusLabel' not in row for row in r['rows']))
        self.assertEqual(t['difference'],11)
        self.assertEqual(t['dealers'],3) # The supplementary dealer stays in scope even without orders.
        self.assertEqual(r['rows'][0]['applicationDetails'][0]['orderConstructions'],5)
    def test_call_list_retained_even_without_orders(self):
        r=assemble_report([{'DealerGUID':'D1','DealerName':'Call','ReportGroup':'Region','FolderPath':'Path'}],[],[],[],{**self.seed(),'additional_dealers':[]},date(2026,10,1),date(2026,10,28),date(2026,7,28))
        self.assertEqual((r['totals']['dealers'],r['totals']['applications']),(1,0))
    def test_missing_call_guid_fails_instead_of_silently_dropping_it(self):
        with self.assertRaises(ValueError):
            assemble_report([],[],[],[],self.seed(),date(2026,10,1),date(2026,10,28),date(2026,7,28))
    def test_filter_recomputes_same_metrics_for_pdf_and_screen(self):
        r=filter_report(self.report(),search='інша')
        self.assertEqual((r['totals']['applications'],r['totals']['linkedConstructions']),(2,5))
        self.assertEqual(len(r['regions']),1)
    def test_only_portal_author_or_reviewed_new_order_establishes_portal_application(self):
        seed=self.seed();seed['calls']={};seed['additional_dealers']=[]
        directory=[{'DealerGUID':'D1','DealerName':'D','ReportGroup':'R','FolderPath':'P'}]
        orders=[{'OrderGUID':'O','DealerGUID':'D1','OrderNumber':'1','OrderDate':datetime(2026,10,2),'Constructions':2}]
        apps=[{'ApplicationGUID':'A','DealerGUID':'D1','ApplicationNumber':'A','ApplicationDate':datetime(2026,10,1),'Constructions':3,'AuthorGUID':None,'AuthorType':bytes(4)}]
        links=[{'ApplicationGUID':'A','OrderGUID':'O'}]
        args=[directory,orders,links,apps,seed,date(2026,10,1),date(2026,10,28),date(2026,7,28)]
        self.assertEqual(assemble_report(*args)['totals']['applications'],0)
        seed['sources']['O']={'dealer':'D1','source':'new'}
        self.assertEqual(assemble_report(*args)['totals']['applications'],1)
    def test_seed_preserves_all_call_list_and_additional_dealer_guids(self):
        seed=seed_data()
        self.assertEqual(len(seed['calls']),74)
        self.assertEqual(len(set(seed['calls'])|set(seed['additional_dealers'])),75)
    def test_date_validation_and_calendar_months(self):
        self.assertEqual(three_months_before(date(2026,5,31)),date(2026,2,28))
        for params in ({'date_from':'bad'},{'date_from':'2026-10-29','date_to':'2026-10-01'},{'date_to':'2026-10-30'}):
            with self.assertRaises(ValueError): parse_period(params,date(2026,10,29))
    def test_sql_uses_confirmed_state_and_actual_parent_hierarchy(self):
        cte,*_=query_parts(seed_data())
        self.assertIn('C.Родитель=T.GUID',cte)
        self.assertIn('Z.БВ_СостояниеЗаказа=%s',cte)
        self.assertIn('Z.Проведен=0x01 AND Z.ПометкаУдаления=0x00',cte)
        self.assertNotIn('ГруппаДоступа',cte)
        self.assertEqual(len(bytes.fromhex(STATE[2:])),16)

class DealerConstructionsApiTests(SimpleTestCase):
    seed=DealerConstructionsTests.seed
    report=DealerConstructionsTests.report
    def call(self,params=None,role='admin',pk=11):
        request=APIRequestFactory().get('/api/dealer-reconciliation/',params or {})
        if role is not None:
            force_authenticate(request,user=SimpleNamespace(pk=pk,id=pk,is_authenticated=True,role=role))
        return dealer_reconciliation(request)
    def test_access_denied_before_queries(self):
        with patch('records.dealer_reconciliation_views.build_report') as build:
            for role in (None,'customer','manager','branch_manager','director'):
                self.assertIn(self.call(role=role).status_code,(401,403))
            build.assert_not_called()
    def test_snapshot_export_uses_same_data_and_is_bound_to_user(self):
        cache=LocMemCache('dealer-reconciliation-tests',{})
        r=self.report();r['generatedAt']='2026-10-29T10:00:00+00:00'
        with patch('records.dealer_reconciliation_views.cache',cache),patch('records.dealer_reconciliation_views.build_report',return_value=r) as build:
            response=self.call({'date_from':'2026-10-01','date_to':'2026-10-28'})
            self.assertEqual(response.status_code,200)
            token=response.data['snapshot']
            csv=self.call({'snapshot':token,'export':'csv','search':'інша'})
            self.assertEqual(csv.status_code,200)
            self.assertIn('A1',csv.content.decode('utf-8-sig'))
            self.assertNotIn('Статус',csv.content.decode('utf-8-sig').splitlines()[0])
            self.assertNotIn('A3',csv.content.decode('utf-8-sig'))
            self.assertEqual(self.call({'snapshot':token},pk=12).status_code,410)
            build.assert_called_once()
    def test_bad_dates_or_export_without_snapshot_do_not_query(self):
        with patch('records.dealer_reconciliation_views.build_report') as build:
            self.assertEqual(self.call({'date_from':'bad'}).status_code,400)
            self.assertEqual(self.call({'export':'pdf'}).status_code,400)
            self.assertEqual(self.call({'status':'bad'}).status_code,400)
            build.assert_not_called()
