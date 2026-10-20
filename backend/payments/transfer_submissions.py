from decimal import Decimal
from uuid import UUID
from pathlib import Path
from django.http import FileResponse
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from .transfer_notifications import queue_transfer_notification
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from utils.contractor import resolve_contractor, get_accessible_dealer_rows
from utils.BinToGuid1C import bin_to_guid_1c
from .models import FundsTransferSubmission
from django.core import signing
from .transfer_routes import find_transfer_routes, route_snapshot, confirm_transfer_route, SALT

class TransferInput(serializers.Serializer):
    transfer_date = serializers.DateField()
    route_confirmation = serializers.CharField(max_length=16000)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal('0.01'))
    currency = serializers.ChoiceField(choices=['UAH', 'EUR', 'USD'], default='UAH')
    comment = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='')
    photo = serializers.ImageField()

    def validate_photo(self, photo):
        if photo.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Фото має бути не більше 10 МБ.')
        if photo.image.format not in {'JPEG', 'PNG', 'WEBP'} or photo.image.width * photo.image.height > 20_000_000:
            raise serializers.ValidationError('Дозволені JPG, PNG, WebP до 20 мегапікселів.')
        photo.name = 'photo.' + {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}[photo.image.format]
        return photo

def contractor_scope(request):
    role = getattr(request.user, 'role', '')
    if role not in {'customer', 'dealer', 'admin', 'manager', 'region_manager', 'branch_manager', 'branches_director'}:
        raise PermissionDenied('Немає доступу до фінансових подань.')
    if role in {'customer', 'dealer'} and not getattr(request.user, 'permit_finance_info', False):
        raise PermissionDenied('Доступ до фінансової інформації вимкнено.')
    try:
        _, guid = resolve_contractor(request, elevated_roles=('admin', 'manager', 'region_manager', 'branch_manager', 'branches_director'))
        return UUID(str(guid))
    except PermissionError as exc:
        raise PermissionDenied(str(exc)) from exc
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc

def history_queryset(request):
    names = {}
    role = getattr(request.user, 'role', '')
    selected = request.GET.get('contractor', '')
    if getattr(request.user, 'role', '') in {'admin', 'manager', 'region_manager', 'branch_manager', 'branches_director'}:
        for row in get_accessible_dealer_rows(request.user):
            value = row.get('ContractorID')
            if not value:
                continue
            guid = UUID(str(bin_to_guid_1c(bytes(value)) if isinstance(value, (bytes, bytearray, memoryview)) else value))
            names[guid] = str(row.get('ContractorName') or '')
        if selected and selected != '__ALL__':
            try:
                guid = UUID(selected)
            except ValueError:
                raise ValidationError('Некоректний дилер.')
            if role != 'admin' and guid not in names:
                raise PermissionDenied('У вас немає доступу до цього дилера.')
            names = {guid: names.get(guid, '')}
        if role == 'admin':
            # Include historical/inactive dealers absent from today's directory.
            query = FundsTransferSubmission.objects.filter(contractor_guid=guid) if selected and selected != '__ALL__' else FundsTransferSubmission.objects.all()
        else:
            query = FundsTransferSubmission.objects.filter(contractor_guid__in=list(names))
    else:
        guid = contractor_scope(request)
        names[guid] = request.user.full_name or request.user.username
        query = FundsTransferSubmission.objects.filter(contractor_guid=guid)
    ordering = ['created_at', 'pk'] if request.GET.get('sort') == 'oldest' else ['-created_at', '-pk']
    return query.select_related('author').order_by(*ordering), names

def serialize_submission(item, names=None):
    return {'funds_status': item.funds_status, 'funds_status_label': item.get_funds_status_display(), 'received_amount': str(item.received_amount) if item.received_amount is not None else None, 'funds_checked_at': item.funds_checked_at.isoformat() if item.funds_checked_at else None, 'cash_receipts': item.cash_receipts, 'transfer_date': item.transfer_date.isoformat() if item.transfer_date else None, 'routing_number': item.routing_number, 'routing_orders': item.routing_orders, 'id': item.pk, 'contractor_guid': str(item.contractor_guid), 'dealer': (names or {}).get(item.contractor_guid) or item.author.full_name or item.author.username, 'amount': str(item.amount), 'currency': item.currency, 'comment': item.comment, 'created_at': item.created_at.isoformat(), 'author': item.author.full_name or item.author.username}

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def transfer_submissions(request):
    if request.method == 'POST' and getattr(request.user, 'role', '') not in {'customer', 'dealer'}:
        raise PermissionDenied('Додавати інформацію про передані кошти може лише дилер.')
    if request.method == 'POST':
        contractor = contractor_scope(request)
        data = TransferInput(data=request.data)
        data.is_valid(raise_exception=True)
        values = dict(data.validated_data)
        route = confirm_transfer_route(contractor, values['transfer_date'], values.pop('route_confirmation'))
        item = FundsTransferSubmission.objects.create(
            contractor_guid=contractor, author=request.user,
            routing_guid=route['guid'], routing_number=route['number'], routing_orders=route['orders'], **values,
        )
        transaction.on_commit(lambda: queue_transfer_notification(item.pk))
        return Response(serialize_submission(item), status=201)
    paginator = PageNumberPagination()
    paginator.page_size = 20
    queryset, names = history_queryset(request)
    page = paginator.paginate_queryset(queryset, request)
    return paginator.get_paginated_response([serialize_submission(item, names) for item in page])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transfer_routes(request):
    contractor = contractor_scope(request)
    data = serializers.DateField().run_validation(request.query_params.get('transfer_date'))
    routes = find_transfer_routes(contractor, data)
    return Response({'routes': [{**route, 'confirmation': signing.dumps(route_snapshot(contractor, data, route), salt=SALT, compress=True)} for route in routes]})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transfer_photo(request, pk):
    queryset, _ = history_queryset(request)
    item = get_object_or_404(queryset, pk=pk)
    try:
        response = FileResponse(item.photo.open('rb'), as_attachment=True, filename=f'funds-transfer-{pk}{Path(item.photo.name).suffix}')
    except FileNotFoundError:
        return Response({'detail': 'Фото не знайдено.'}, status=404)
    response['Cache-Control'] = 'private, no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transfer_history_pdf(request):
    queryset, names = history_queryset(request)
    items = list(queryset[:1001])
    if len(items) > 1000:
        return Response({'detail': 'Для одного PDF дозволено не більше 1000 подань.'}, status=400)
    rows = [{'date': timezone.localtime(item.created_at).strftime('%d.%m.%Y %H:%M'), 'dealer': names.get(item.contractor_guid) or item.author.full_name or item.author.username, 'amount': item.amount, 'currency': item.currency, 'comment': item.comment, 'author': item.author.full_name or item.author.username} for item in items]
    from records.deliveries_pdf import deliveries_font_path, PdfFontError
    from .transfer_pdf import build_transfer_history_pdf
    try:
        data = build_transfer_history_pdf(rows, deliveries_font_path(), next(iter(names.values())) if len(names) == 1 else 'Усі доступні дилери')
    except PdfFontError:
        return Response({'detail': 'Шрифт для PDF недоступний.'}, status=503)
    response = HttpResponse(data, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="funds-transfers.pdf"'
    response['Cache-Control'] = 'private, no-store'
    return response
