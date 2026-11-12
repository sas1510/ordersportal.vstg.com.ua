from datetime import date
from django.test import SimpleTestCase
from .daily_portal_movements import refusal_documents, movement_summary
from .dealer_reconciliation import filter_report


class DailyMovementTests(SimpleTestCase):
    def test_refusals_deduplicate_many_to_many_links_and_repeated_events(self):
        base = dict(OrderGUID='O1', OrderNumber='01-1', DealerGUID='D1', DealerName='Дилер',
                    Constructions=3, EventDate='2026-11-11 09:00:00', Reason='', Manager='Менеджер',
                    ApplicationGUID='A1', ApplicationNumber='1', ApplicationConstructions=4, ApplicationDate='2026-10-01')
        documents = refusal_documents([base, base, {**base, 'ApplicationGUID':'A2', 'ApplicationNumber':'2'}])
        self.assertEqual(len(documents), 1)
        self.assertEqual(len(documents[0]['events']), 1)
        self.assertEqual(len(documents[0]['applications']), 2)
        totals = movement_summary({'autoRefusedOrders':documents})['autoRefused']
        self.assertEqual((totals['orders'], totals['orderConstructions'], totals['applications']), (1,3,2))

    def test_overnight_orders_count_once_when_linked_to_multiple_applications(self):
        order = {'guid':'O1', 'constructions':3}
        result = movement_summary({'overnightApplications':[
            {'guid':'A1','constructions':4,'orders':[order]}, {'guid':'A2','constructions':5,'orders':[order]}]})
        self.assertEqual(result['overnight'], {'applications':2,'applicationConstructions':9,'orders':1,'orderConstructions':3})

    def test_previous_day_pending_and_overnight_use_creation_event_date(self):
        from .dealer_reconciliation import assemble_report, STATE
        from datetime import datetime
        seed={'calls':{},'additional_dealers':[],'registered':[],'old_accounts':[],'sources':{},'reviewed_at':'test'}
        dealers=[{'DealerGUID':d,'DealerName':d,'ReportGroup':'R','FolderPath':'R'} for d in ['D1','D2']]
        apps=[{'ApplicationGUID':a,'DealerGUID':d,'ApplicationNumber':a,'ApplicationDate':datetime(2026,11,10,16),
            'Constructions':4,'AuthorGUID':d,'AuthorType':bytes.fromhex('0000007a')} for a,d in [('A1','D1'),('A2','D2')]]
        orders=[{'OrderGUID':'O1','DealerGUID':'D1','OrderNumber':'O1','OrderDate':datetime(2026,11,10),
            'FirstStatusDate':datetime(2026,11,11,9),'Constructions':3,'StateGUID':STATE}]
        result=assemble_report(dealers,orders,[{'ApplicationGUID':'A1','OrderGUID':'O1'}],apps,seed,
            date(2026,11,11),date(2026,11,11),date(2026,8,11),daily=True)
        self.assertEqual([a['guid'] for a in result['overnightApplications']],['A1'])
        self.assertEqual([a['guid'] for a in result['previousDayPendingApplications']],['A2'])
        self.assertIn('D2',[row['guid'] for row in result['rows']])
        result['rows'][0]['dealerGroup']='Дилера'
        filtered=filter_report(result, contractor='D1')
        self.assertEqual(filtered['dailyMovements']['previousDayPending']['applications'],0)
        self.assertEqual(filtered['dailyMovements']['overnight']['orders'],1)
