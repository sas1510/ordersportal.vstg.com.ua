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
from .dealer_reconciliation import build_report, filter_report, parse_period

logger=logging.getLogger(__name__)
# Shared by all Gunicorn workers. The portal already runs Redis for Celery/channels.
cache=RedisCache('redis://127.0.0.1:6379/4',{'TIMEOUT':1800,'KEY_PREFIX':'dealer-constructions-v2'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dealer_reconciliation(request):
    if str(getattr(request.user,'role','')).strip()!='admin':
        return Response({'detail':'Звіт усіх дилерів доступний лише адміністратору.'},status=403)
    format_=request.GET.get('export','json')
    if format_ not in ('json','pdf','csv'):
        return Response({'detail':'Невідомий формат звіту.'},status=400)
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
        report=filter_report(report,region,request.GET.get('search','').strip())
        if format_=='json':
            response=Response({**report,'snapshot':token})
        elif format_=='pdf':
            from .dealer_reconciliation_pdf import build_reconciliation_pdf
            response=HttpResponse(build_reconciliation_pdf(report),content_type='application/pdf')
            response['Content-Disposition']='attachment; filename="new-portal-constructions.pdf"'
        else:
            buf=StringIO(newline=''); writer=csv.writer(buf,delimiter=';')
            writer.writerow(['Дилер','Область / філіал','Номер заявки','Дата заявки','Конструкцій у заявці','Підтверджені замовлення','Конструкцій у замовленнях','Різниця','GUID заявки','GUID дилера'])
            safe=lambda v: "'"+v if v[:1] in ('=','+','-','@','\t','\r') else v
            for row in report['rows']:
                for app in row['applicationDetails']:
                    writer.writerow([safe(str(v)) for v in [row['name'],row['region'],app['number'],app['date'],app['constructions'],', '.join(o['number'] for o in app['orders']),app['orderConstructions'],app['constructions']-app['orderConstructions'],app['guid'],row['guid']]])
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
