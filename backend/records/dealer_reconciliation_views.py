import csv
import logging
from io import StringIO
from uuid import uuid4
from django.core.cache.backends.redis import RedisCache
from django.db import DatabaseError
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .dealer_reconciliation import build_report, filter_report, parse_period, status_breakdown

logger=logging.getLogger(__name__)
# Shared by all Gunicorn workers. The portal already runs Redis for Celery/channels.
cache=RedisCache('redis://127.0.0.1:6379/4',{'TIMEOUT':1800,'KEY_PREFIX':'dealer-management-v3'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dealer_reconciliation(request):
    if str(getattr(request.user,'role','')).strip()!='admin':
        return Response({'detail':'Звіт усіх дилерів доступний лише адміністратору.'},status=403)
    format_=request.GET.get('export','json')
    if format_ not in ('json','pdf','csv'):
        return Response({'detail':'Невідомий формат звіту.'},status=400)
    dataset=request.GET.get('dataset','documents')
    if dataset not in ('documents','applications'):
        return Response({'detail':'Невідомий склад CSV.'},status=400)
    if request.GET.get('status'):
        return Response({'detail':'Фільтр статусу дилера більше не використовується. Оновіть сторінку.'},status=400)
    token=request.GET.get('snapshot','')
    if len(token)>64:
        return Response({'detail':'Некоректний знімок звіту.'},status=400)
    try:
        if token:
            report=cache.get(f'{request.user.pk}:{token}')
            if report is None:
                return Response({'detail':'Термін зберігання звіту минув. Натисніть «Сформувати».'},status=410)
        else:
            if format_!='json':
                return Response({'detail':'Спочатку сформуйте звіт.'},status=400)
            start,end,activity=parse_period(request.GET,timezone.localdate())
            report=build_report(start,end,activity)
            token=uuid4().hex
            cache.set(f'{request.user.pk}:{token}',report,timeout=1800)
        region=request.GET.get('region','')
        if region and region not in {r['name'] for r in report['regions']}:
            return Response({'detail':'Область відсутня у сформованому звіті.'},status=400)
        report=filter_report(report,region,request.GET.get('search','').strip(),request.GET.get('group',''),request.GET.get('contractor',''))
        if format_=='json':
            response=Response({**report,'snapshot':token})
        elif format_=='pdf':
            from .dealer_reconciliation_pdf import build_reconciliation_pdf
            response=HttpResponse(build_reconciliation_pdf(report),content_type='application/pdf')
            response['Content-Disposition']='attachment; filename="new-portal-constructions.pdf"'
        else:
            buf=StringIO(newline=''); writer=csv.writer(buf,delimiter=';')
            safe=lambda value: "'"+value if value[:1] in ('=','+','-','@','\t','\r') else value
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
            response=HttpResponse('\ufeff'+buf.getvalue(),content_type='text/csv; charset=utf-8')
            response['Content-Disposition']='attachment; filename="portal-applications.csv"'
        response['Cache-Control']='private, no-store'
        return response
    except ValueError as exc:
        return Response({'detail':str(exc)},status=400)
    except DatabaseError:
        logger.exception('Dealer constructions database query failed')
        return Response({'detail':'Не вдалося отримати дані 1С. Повторіть формування пізніше.'},status=503)
    except Exception:
        logger.exception('Dealer constructions report failed')
        return Response({'detail':'Не вдалося сформувати звіт. Спробуйте ще раз.'},status=503)
