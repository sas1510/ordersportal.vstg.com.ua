from pathlib import Path
p=Path('backend/records/test_dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
needle="self.assertEqual(r['rows'][0]['applicationDetails'][0]['orderConstructions'],5)"
s=s.replace(needle,needle+"\n        self.assertEqual(r['rows'][0]['applicationDetails'][0]['orderCount'],2)\n        self.assertEqual(sum(state['constructions'] for state in r['rows'][0]['applicationDetails'][0]['orderStatuses']),5)",1)
needle="            self.assertEqual(self.call({'snapshot':token},pk=12).status_code,410)"
s=s.replace(needle,"""            application_csv=self.call({'snapshot':token,'export':'csv','dataset':'applications','search':'інша'})
            self.assertEqual(application_csv.status_code,200)
            import csv as csv_module
            from io import StringIO
            application_rows=list(csv_module.DictReader(StringIO(application_csv.content.decode('utf-8-sig')),delimiter=';'))
            self.assertEqual(len(application_rows),2)
            self.assertEqual(application_rows[0]['Кількість замовлень'],'2')
            self.assertIn('Подтверждено: 2 / 5',application_rows[0]['Замовлення за статусами (кількість / конструкцій)'])
"""+needle,1)
p.write_text(s,encoding='utf-8')
p=Path('backend/records/dealer_reconciliation_pdf.py');s=p.read_text(encoding='utf-8-sig')
needle='p(f"Заявок без замовлень: {totals[\'withoutOrders\']}. Конверсія заявок у підтверджені замовлення:'
s=s.replace(needle,'p(f"Із {totals[\'applications\']} заявок замовлення мають {totals[\'applicationsWithOrders\']}. До них прив’язано {totals[\'linkedOrders\']} замовлень. Заявок без замовлень: {totals[\'withoutOrders\']}. Конверсія заявок у підтверджені замовлення:',1)
p.write_text(s,encoding='utf-8')
