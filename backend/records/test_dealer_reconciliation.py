from datetime import date,datetime
from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from django.core.cache.backends.locmem import LocMemCache
from rest_framework.test import APIRequestFactory,force_authenticate
from .dealer_reconciliation import assemble_report,filter_report,parse_period,seed_data,three_months_before,query_parts,STATE,application_states
from .dealer_reconciliation_views import dealer_reconciliation

class DealerConstructionsTests(SimpleTestCase):
    def seed(self):
        return {'calls':{'D1':{'aliases':['Інша назва']}},'additional_dealers':['D3'],'registered':[],'old_accounts':[],'sources':{},'reviewed_at':'2026-10-28'}
    def report(self):
        dealers=[{'DealerGUID':g,'DealerName':g,'ReportGroup':region,'FolderPath':'ДИЛЕРА / '+region,'NewAccounts':1} for g,region in [('D1','Область А'),('D2','Область Б'),('D3','Область Б')]]
        orders=[{'OrderGUID':g,'DealerGUID':d,'OrderNumber':g,'OrderDate':datetime(2026,10,10),'Constructions':q,'StateGUID':STATE,'StateName':'Подтверждено','Posted':b'\x01'} for g,d,q in [('O1','D1',3),('O2','D1',2),('O3','D2',7)]]
        apps=[{'ApplicationGUID':g,'DealerGUID':d,'ApplicationNumber':g,'ApplicationDate':datetime(2026,10,5),'Constructions':q,'AuthorGUID':d,'AuthorType':bytes.fromhex('0000007a'),'StateGUID':'0XA8AE1CFA97BAD3774296494E88BE7F1A','Posted':b'\x01'} for g,d,q in [('A1','D1',5),('A2','D1',4),('A3','D2',8),('A4','D2',6)]]
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
        self.assertEqual(r['rows'][0]['applicationDetails'][0]['orderCount'],2)
        self.assertEqual(sum(state['constructions'] for state in r['rows'][0]['applicationDetails'][0]['orderStatuses']),5)
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
        self.assertIn('OS.Ссылка=Z.БВ_СостояниеЗаказа',cte)
        self.assertNotIn('Z.БВ_СостояниеЗаказа=%s',cte)
        self.assertIn('Z.ПометкаУдаления=0x00',cte)
        self.assertNotIn('Z.Проведен=0x01',cte)
        self.assertNotIn('ГруппаДоступа',cte)
        self.assertEqual(len(bytes.fromhex(STATE[2:])),16)

    def test_all_document_states_and_confirmed_subset_remain_separate(self):
        seed={**self.seed(),'additional_dealers':[]}
        dealer=[{'DealerGUID':'D1','DealerName':'D','ReportGroup':'R','FolderPath':'P'}]
        orders=[{'OrderGUID':guid,'DealerGUID':'D1','OrderNumber':guid,'OrderDate':datetime(2026,10,10),
            'Constructions':quantity,'StateGUID':state,'StateName':name,'Posted':posted}
            for guid,quantity,state,name,posted in [('O1',3,STATE,'Подтверждено',b'\x01'),
                ('O2',2,'WAIT','Ждем оплати',b'\x00'),('O3',7,'REFUSED','Отказ',b'\x01')]]
        apps=[{'ApplicationGUID':guid,'DealerGUID':'D1','ApplicationNumber':guid,'ApplicationDate':datetime(2026,10,5),
            'Constructions':quantity,'AuthorGUID':'D1','AuthorType':bytes.fromhex('0000007a'),'StateGUID':state,'Posted':b'\x00'}
            for guid,quantity,state in [('A1',5,'0XA267AAA90D55301D4E455425612DA59E'),
                ('A2',4,'0X91618BA8D8C91242425CCC244564E77B'),('A3',6,'0XA8AE1CFA97BAD3774296494E88BE7F1A')]]
        links=[{'ApplicationGUID':a,'OrderGUID':o} for a,o in [('A1','O1'),('A1','O2'),('A2','O1'),('A2','O3')]]
        report=assemble_report(dealer,orders,links,apps,seed,date(2026,10,1),date(2026,10,28),date(2026,7,28))
        totals=report['totals']
        self.assertEqual((totals['applications'],totals['applicationConstructions']),(3,15))
        self.assertEqual((totals['linkedOrders'],totals['linkedConstructions']),(3,12))
        self.assertEqual((totals['confirmedLinkedOrders'],totals['confirmedLinkedConstructions']),(1,3))
        self.assertEqual((totals['convertedApplications'],totals['withoutOrders']),(2,1))
        self.assertEqual(sum(row['documents'] for row in totals['applicationStatuses']),3)
        self.assertEqual(sum(row['constructions'] for row in totals['orderStatuses']),12)
        self.assertEqual({row['name'] for row in totals['orderStatuses']},{'Подтверждено','Ждем оплати','Отказ'})
        self.assertEqual({row['name'] for row in totals['applicationStatuses']},{'В обработке','Отказ','Новый просчет'})
        self.assertFalse(report['rows'][0]['applicationDetails'][0]['posted'])
        self.assertEqual(len(application_states()),9)

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
            for role in (None,'customer','dealer','manager','region_manager','regionalManager','branch_manager','branches_director','director','operator','complaint_manager'):
                for export in ('json','pdf','csv'):
                    self.assertIn(self.call({'export':export},role=role).status_code,(401,403))
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
            self.assertIn('Статус',csv.content.decode('utf-8-sig').splitlines()[0])
            self.assertNotIn('Статус дилера',csv.content.decode('utf-8-sig').splitlines()[0])
            self.assertNotIn('A3',csv.content.decode('utf-8-sig'))
            application_csv=self.call({'snapshot':token,'export':'csv','dataset':'applications','search':'інша'})
            self.assertEqual(application_csv.status_code,200)
            import csv as csv_module
            from io import StringIO
            application_rows=list(csv_module.DictReader(StringIO(application_csv.content.decode('utf-8-sig')),delimiter=';'))
            self.assertEqual(len(application_rows),2)
            self.assertEqual(application_rows[0]['Кількість замовлень'],'2')
            self.assertIn('Подтверждено: 2 / 5',application_rows[0]['Замовлення за статусами (кількість / конструкцій)'])
            self.assertEqual(self.call({'snapshot':token},pk=12).status_code,410)
            build.assert_called_once()
    def test_bad_dates_or_export_without_snapshot_do_not_query(self):
        with patch('records.dealer_reconciliation_views.build_report') as build:
            self.assertEqual(self.call({'date_from':'bad'}).status_code,400)
            self.assertEqual(self.call({'export':'pdf'}).status_code,400)
            self.assertEqual(self.call({'status':'bad'}).status_code,400)
            build.assert_not_called()

class DealerGroupReportFilterTests(SimpleTestCase):
    def test_group_and_dealer_filters_recompute_export_totals(self):
        report = DealerConstructionsTests().report()
        for row in report['rows']:
            row['dealerGroup'] = 'Дилера' if row['guid']=='D1' else 'Філіали'
        filtered = filter_report(report, dealer_group='Дилера', contractor='D1')
        self.assertEqual(filtered['totals']['dealers'], 1)
        self.assertEqual(filtered['totals']['linkedConstructions'], 5)
        self.assertEqual(filter_report(report, dealer_group='Філіали', contractor='D1')['totals']['dealers'], 0)
