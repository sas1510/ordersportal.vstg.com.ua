from pathlib import Path
p=Path('backend/records/dealer_reconciliation.py');s=p.read_text(encoding='utf-8-sig')
needle="app_details.append({**_document(a,'application',labels),'orders':related,"
assert needle in s
s=s.replace(needle,needle+"\n                'orderCount':len(related),'orderStatuses':status_breakdown(related),",1);p.write_text(s,encoding='utf-8')
p=Path('backend/records/dealer_reconciliation_views.py');s=p.read_text(encoding='utf-8-sig').replace('parse_period\n','parse_period, status_breakdown\n',1)
needle="    if request.GET.get('status'):"
s=s.replace(needle,"    dataset=request.GET.get('dataset','documents')\n    if dataset not in ('documents','applications'):\n        return Response({'detail':'Невідомий склад CSV.'},status=400)\n"+needle,1)
a=s.index("            writer.writerow(");b=s.index("            response=HttpResponse('\\ufeff'",a)
s=s[:a]+'''            safe=lambda value: "'"+value if value[:1] in ('=','+','-','@','\\t','\\r') else value
            def write(values): writer.writerow([safe(str(value)) for value in values])
            if dataset=='applications':
                write(['Заявка','Дата','Статус заявки','Дилер','Область / філіал','Конструкцій у заявці','Кількість замовлень','Конструкцій у замовленнях','Підтверджених замовлень','Підтверджених конструкцій','Замовлення за статусами (кількість / конструкцій)','Номери замовлень','GUID заявки'])
                for row in report['rows']:
                    for app in row['applicationDetails']:
                        states=app.get('orderStatuses') or status_breakdown(app['orders'])
                        state_text='; '.join(f"{state['name']}: {state['documents']} / {state['constructions']:g}" for state in states)
                        write([app['number'],app['date'],app['state'],row['name'],row['region'],app['constructions'],len(app['orders']),app['orderConstructions'],sum(order['confirmed'] for order in app['orders']),app['confirmedOrderConstructions'],state_text,', '.join(order['number'] for order in app['orders']),app['guid']])
            else:
                write(['Тип документа','Номер','Дата','Статус','Конструкцій','Проведено','Дилер','Область / філіал','Пов’язані документи','GUID документа','GUID дилера'])
                for row in report['rows']:
                    reverse={}
                    for app in row['applicationDetails']:
                        for order in app['orders']:
                            reverse.setdefault(order['guid'],set()).add(app['number'])
                    documents=[('Заявка / прорахунок',app,', '.join(order['number'] for order in app['orders'])) for app in row['applicationDetails']]
                    documents += [('Замовлення',order,', '.join(sorted(reverse.get(order['guid'],set())))) for order in row['cohortOrders']]
                    for kind,doc,related in documents:
                        write([kind,doc['number'],doc['date'],doc['state'],doc['constructions'],'Так' if doc['posted'] else 'Ні',row['name'],row['region'],related,doc['guid'],row['guid']])
''' + s[b:]
p.write_text(s,encoding='utf-8')
print('Per-application order counts, construction quantities, status breakdown and application CSV added.')
