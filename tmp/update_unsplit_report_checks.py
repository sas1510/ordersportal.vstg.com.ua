from pathlib import Path
p=Path('backend/records/test_dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig').replace("'independent':","'additional_dealers':").replace("seed['independent']","seed['additional_dealers']")
s=s.replace("        self.assertEqual(t['independentApplicationConstructions'],9)\n        self.assertEqual(t['independentLinkedConstructions'],5)\n", "        self.assertNotIn('independentApplicationConstructions',t)\n        self.assertTrue(all('status' not in row and 'statusLabel' not in row for row in r['rows']))\n")
s=s.replace("self.assertEqual(t['independent'],2) # The approved independent list is retained even with zero orders.","self.assertEqual(t['dealers'],3) # The supplementary dealer stays in scope even without orders.")
s=s.replace("(r['totals']['dealers'],r['totals']['independent']),(1,1)","(r['totals']['dealers'],r['totals']['applications']),(1,0)")
s=s.replace("status='independent',search='інша'","search='інша'")
s=s.replace('test_seed_contains_exactly_75_approved_independent_guids','test_seed_preserves_all_call_list_and_additional_dealer_guids')
s=s.replace("'export':'csv','status':'independent'","'export':'csv','search':'інша'")
s=s.replace("self.assertIn('A1',csv.content.decode('utf-8-sig'))", "self.assertIn('A1',csv.content.decode('utf-8-sig'))\n            self.assertNotIn('Статус',csv.content.decode('utf-8-sig').splitlines()[0])")
p.write_text(s,encoding='utf-8')
p=Path('frontend/src/utils/dealerReconciliation.test.mjs');s=p.read_text(encoding='utf-8-sig').replace("status: 'independent'","newAccount: true").replace("status: 'manager'","newAccount: true").replace("status: '', ",'')
s=s.replace("assert.equal(summarizeReconciliation(rows).independentApplicationConstructions, 9);", "assert.equal(summarizeReconciliation(rows).onPortal, 2);\nassert.equal('independentApplicationConstructions' in summarizeReconciliation(rows), false);")
s=s.replace('conversion and independent totals passed','conversion and unsplit totals passed')
p.write_text(s,encoding='utf-8')
p=Path('docs/DEALER_PORTAL_CONSTRUCTIONS_UA.md');s=p.read_text(encoding='utf-8-sig')
a=s.index('«Самостійно» визначається');b=s.index('Порівняння заявок:',a)
s=s[:a]+'''Поділу дилерів і конструкцій на «Самостійно» та «Менеджер» немає.
Усі показники загальні; доступні лише фільтри області / філіалу та пошук дилера.
Збережено погоджений склад вибірки, реєстрації та перенесення акаунтів.
«Рута Магазин» включено до Чернівецької області. Відповідності GUID зберігаються
у приватному `backend/records/data/dealer_reconciliation.json`, без телефонів
і підсумків. Додатковий контрагент Журавецький збережений у `additional_dealers`.

'''+s[b:]
s=s.replace('dealer-constructions-v1','dealer-constructions-v2').replace('`region`, `status`, `search`','`region`, `search`')
p.write_text(s,encoding='utf-8')
