from pathlib import Path
p=Path('backend/records/dealer_reconciliation_views.py');s=p.read_text(encoding='utf-8-sig').replace('dealer-constructions-v2','dealer-management-v3')
a=s.index('            writer.writerow(');b=s.index("            response=HttpResponse('\\ufeff'",a)
s=s[:a]+'''            writer.writerow(['Тип документа','Номер','Дата','Статус','Конструкцій','Проведено','Дилер','Область / філіал','Пов’язані документи','GUID документа','GUID дилера'])
            safe=lambda value: "'"+value if value[:1] in ('=','+','-','@','\\t','\\r') else value
            for row in report['rows']:
                reverse={}
                for app in row['applicationDetails']:
                    for order in app['orders']:
                        reverse.setdefault(order['guid'],set()).add(app['number'])
                documents=[('Заявка / прорахунок',app,', '.join(order['number'] for order in app['orders'])) for app in row['applicationDetails']]
                documents += [('Замовлення',order,', '.join(sorted(reverse.get(order['guid'],set())))) for order in row['cohortOrders']]
                for kind,doc,related in documents:
                    writer.writerow([safe(str(value)) for value in [kind,doc['number'],doc['date'],doc['state'],doc['constructions'],'Так' if doc['posted'] else 'Ні',row['name'],row['region'],related,doc['guid'],row['guid']]])
''' + s[b:]
p.write_text(s,encoding='utf-8')
