"""Match routed dealer cash submissions to posted 1C cash receipts."""
import logging
from collections import defaultdict
from datetime import date
from decimal import Decimal
from pathlib import Path

from django.db import connection, transaction
from django.utils import timezone
from utils.GuidToBin1C import guid_to_1c_bin
from utils.BinToGuid1C import bin_to_guid_1c
from .models import FundsTransferSubmission

logger = logging.getLogger(__name__)
ZERO = Decimal('0.00')
CENT = Decimal('0.01')


def normalize_currency(code, name=''):
    codes = {'980': 'UAH', '978': 'EUR', '840': 'USD', 'UAH': 'UAH', 'EUR': 'EUR', 'USD': 'USD'}
    value = str(code or '').strip().upper()
    if value in codes:
        return codes[value]
    return {'ГРН': 'UAH', 'ГРИВНЯ': 'UAH', 'ЄВРО': 'EUR', 'ЕВРО': 'EUR', 'ДОЛАР США': 'USD', 'ДОЛЛАР США': 'USD'}.get(str(name or '').strip().upper(), '')


def load_route_receipts(contractor_guid, routing_guid):
    query = Path(__file__).with_suffix('.sql').read_text(encoding='utf-8')
    with connection.cursor() as cursor:
        cursor.execute(query, [guid_to_1c_bin(str(routing_guid)), guid_to_1c_bin(str(contractor_guid))])
        rows = cursor.fetchall()
    receipts = {}
    for guid, number, raw_date, amount, code, name, route, route_number in rows:
        guid = bin_to_guid_1c(bytes(guid))
        actual_date = raw_date.replace(year=raw_date.year - 2000) if raw_date.year >= 4000 else raw_date
        row = {'guid': guid, 'number': str(number).strip(), 'date': actual_date.date().isoformat(),
            'amount': str(Decimal(amount).quantize(CENT)), 'currency': normalize_currency(code, name),
            'currency_source': str(code or name or '').strip(),
            'routing_guid': bin_to_guid_1c(bytes(route)), 'routing_number': str(route_number).strip()}
        if guid in receipts and receipts[guid] != row:
            raise ValueError('Inconsistent duplicate cash receipt in source')
        receipts[guid] = row
    return list(receipts.values())


def allocate_receipts(submissions, receipts):
    """Allocate each receipt only once, by submission date then creation/id.

    The caller passes exactly one (contractor, route) group. Currency and date
    eligibility are checked here. Surplus is reported on the last eligible row.
    """
    items = sorted(submissions, key=lambda row: (row.transfer_date or date.min, row.created_at, row.pk))
    result = {row.pk: {'amount': ZERO, 'receipts': [], 'note': ''} for row in items}
    currencies_seen = defaultdict(set)
    seen = set()
    for receipt in sorted(receipts, key=lambda row: (row['date'], row['guid'])):
        if receipt['guid'] in seen:
            continue
        seen.add(receipt['guid'])
        receipt_date = date.fromisoformat(receipt['date'])
        dated = [row for row in items if row.transfer_date and row.transfer_date <= receipt_date]
        for row in dated:
            currencies_seen[row.pk].add(receipt['currency'] or '?')
        eligible = [row for row in dated if row.currency == receipt['currency']]
        amount = Decimal(receipt['amount']).quantize(CENT)
        if amount <= ZERO:
            for row in eligible:
                result[row.pk]['note'] = 'Знайдено ПКО з недодатною сумою. Потрібна ручна перевірка.'
            continue
        remaining = amount
        for row in eligible:
            state = result[row.pk]
            available = max(ZERO, row.amount - state['amount'])
            allocated = min(available, remaining)
            if allocated:
                state['amount'] += allocated
                state['receipts'].append({**receipt, 'allocated_amount': str(allocated)})
                remaining -= allocated
            if remaining == ZERO:
                break
        if remaining and eligible:
            state = result[eligible[-1].pk]
            state['amount'] += remaining
            existing = next((row for row in state['receipts'] if row['guid'] == receipt['guid']), None)
            if existing:
                existing['allocated_amount'] = str(Decimal(existing['allocated_amount']) + remaining)
            else:
                state['receipts'].append({**receipt, 'allocated_amount': str(remaining)})
    for row in items:
        state = result[row.pk]
        received = state['amount']
        if state['note']:
            state['status'] = 'mismatch'
        elif received > row.amount:
            state['status'], state['note'] = 'mismatch', 'Сума ПКО перевищує суму подань за цим маршрутом.'
        elif received == row.amount:
            state['status'] = 'received'
        elif received > ZERO:
            state['status'] = 'partial'
        else:
            state['status'] = 'pending'
        if not row.transfer_date:
            state.update(status='pending', note='Не вказано дату передачі. Потрібна ручна перевірка.')
        elif received == ZERO and currencies_seen[row.pk] and row.currency not in currencies_seen[row.pk]:
            state.update(status='mismatch', note='ПКО знайдено в іншій валюті; його суму не зараховано.')
        elif not state['note'] and not state['receipts']:
            state['note'] = 'Проведених ПКО за цим маршрутом, дилером, валютою та датою не зараховано.'
        if len(items) > 1 and state['receipts'] and not state['note']:
            state['note'] = 'Суми ПКО розподілено між поданнями цього маршруту за датою передачі та часом подання.'
    return result


def reconcile_submissions(queryset, max_groups=50):
    # Include received rows again: an unposted/deleted/corrected receipt must
    # revoke its prior confirmation on the next successful source read.
    candidates = list(queryset.order_by('funds_checked_at', 'pk')[:1001])
    groups = {}
    summary = {'checked': 0, 'received': 0, 'partial': 0, 'pending': 0, 'mismatch': 0, 'errors': 0, 'has_more': False}
    summary['has_more'] = len(candidates) > 1000
    for item in candidates[:1000]:
        if not item.routing_guid:
            if len(groups) >= max_groups:
                summary['has_more'] = True
                continue
            key = ('missing', item.pk)
        else:
            key = (item.contractor_guid, item.routing_guid)
        groups.setdefault(key, item)
    if len(groups) > max_groups:
        summary['has_more'] = True
    for item in list(groups.values())[:max_groups]:
        try:
            # A complete group is locked/recalculated together so the same PКО
            # cannot be counted fully for several submissions or parallel runs.
            with transaction.atomic():
                query = FundsTransferSubmission.objects.filter(contractor_guid=item.contractor_guid, routing_guid=item.routing_guid) if item.routing_guid else FundsTransferSubmission.objects.filter(pk=item.pk)
                locked = list(query.select_for_update().order_by('pk'))
                if not locked:
                    continue
                now = timezone.now()
                if item.routing_guid:
                    receipts = load_route_receipts(item.contractor_guid, item.routing_guid)
                    states = allocate_receipts(locked, receipts)
                else:
                    states = {row.pk: {'status': 'pending', 'amount': None, 'receipts': [], 'note': 'Не збережено маршрутизацію. Автоматична звірка неможлива.'} for row in locked}
                for row in locked:
                    state = states[row.pk]
                    row.funds_status = state['status']
                    row.received_amount = state['amount']
                    row.cash_receipts = state['receipts']
                    row.funds_checked_at = now
                    row.reconciliation_note = state['note']
                    row.save(update_fields=['funds_status', 'received_amount', 'cash_receipts', 'funds_checked_at', 'reconciliation_note'])
            for state in states.values():
                summary['checked'] += 1
                summary[state['status']] += 1
            logger.info('Funds transfer reconciliation completed: contractor=%s route=%s submissions=%s receipts=%s', str(item.contractor_guid), str(item.routing_guid), len(locked), len(receipts) if item.routing_guid else 0)
        except Exception:
            # Source failure must not overwrite a previous successful snapshot.
            summary['errors'] += 1
            logger.exception('Funds transfer reconciliation failed: contractor=%s route=%s', str(item.contractor_guid), str(item.routing_guid))
    return summary
