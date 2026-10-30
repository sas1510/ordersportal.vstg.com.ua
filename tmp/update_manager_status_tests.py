from pathlib import Path
p=Path('backend/records/test_dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace('query_parts,STATE','query_parts,STATE,application_states')
s=s.replace("'Constructions':q} for g,d,q", "'Constructions':q,'StateGUID':STATE,'StateName':'Подтверждено','Posted':b'\\x01'} for g,d,q")
s=s.replace("'AuthorType':bytes.fromhex('0000007a')} for g,d,q", "'AuthorType':bytes.fromhex('0000007a'),'StateGUID':'0XA8AE1CFA97BAD3774296494E88BE7F1A','Posted':b'\\x01'} for g,d,q")
s=s.replace("self.assertIn('Z.БВ_СостояниеЗаказа=%s',cte)","self.assertIn('OS.Ссылка=Z.БВ_СостояниеЗаказа',cte)\n        self.assertNotIn('Z.БВ_СостояниеЗаказа=%s',cte)")
s=s.replace("self.assertIn('Z.Проведен=0x01 AND Z.ПометкаУдаления=0x00',cte)","self.assertIn('Z.ПометкаУдаления=0x00',cte)\n        self.assertNotIn('Z.Проведен=0x01',cte)")
s=s.replace("self.assertNotIn('Статус',csv.content.decode('utf-8-sig').splitlines()[0])", "self.assertIn('Статус',csv.content.decode('utf-8-sig').splitlines()[0])\n            self.assertNotIn('Статус дилера',csv.content.decode('utf-8-sig').splitlines()[0])")
position=s.index('\nclass DealerConstructionsApiTests')
s=s[:position]+'''
    def test_all_document_states_and_confirmed_subset_remain_separate(self):
        seed={**self.seed(),'additional_dealers':[]}
        dealer=[{'DealerGUID':'D1','DealerName':'D','ReportGroup':'R','FolderPath':'P'}]
        orders=[{'OrderGUID':guid,'DealerGUID':'D1','OrderNumber':guid,'OrderDate':datetime(2026,10,10),
            'Constructions':quantity,'StateGUID':state,'StateName':name,'Posted':posted}
            for guid,quantity,state,name,posted in [('O1',3,STATE,'Подтверждено',b'\\x01'),
                ('O2',2,'WAIT','Ждем оплати',b'\\x00'),('O3',7,'REFUSED','Отказ',b'\\x01')]]
        apps=[{'ApplicationGUID':guid,'DealerGUID':'D1','ApplicationNumber':guid,'ApplicationDate':datetime(2026,10,5),
            'Constructions':quantity,'AuthorGUID':'D1','AuthorType':bytes.fromhex('0000007a'),'StateGUID':state,'Posted':b'\\x00'}
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
''' + s[position:]
p.write_text(s,encoding='utf-8')
p=Path('frontend/src/utils/dealerReconciliation.test.mjs');s=p.read_text(encoding='utf-8-sig').replace('summarizeReconciliation }','summarizeReconciliation, statusBreakdown }')
s += '''\nconst docs = [{ guid: 'A', stateGuid: 'P', state: 'Подтверждено', constructions: 3 }, { guid: 'B', stateGuid: 'W', state: 'Ждем оплати', constructions: 2 }];
assert.equal(statusBreakdown([...docs, docs[0]]).reduce((sum, row) => sum + row.constructions, 0), 5);
const actual = summarizeReconciliation([{ ...rows[0], applicationDetails: [docs[0]], cohortOrders: docs, orders: docs, applicationsWithOrders: 1, confirmedLinkedOrders: 1, confirmedLinkedConstructions: 3 }]);
assert.equal(actual.confirmedLinkedConstructions, 3);
assert.equal(actual.orderStatuses.reduce((sum, row) => sum + row.documents, 0), 2);
console.log('Document status quantities and unique GUID status totals passed');
'''
p.write_text(s,encoding='utf-8')
