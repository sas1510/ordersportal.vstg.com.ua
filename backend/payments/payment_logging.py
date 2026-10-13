import json
import logging

logger = logging.getLogger('payments.views')

def log_payment_refusal(*, user, contract, payments, amount, reason, response=None):
    """Searchable payment refusal record; never log credentials or HTTP headers."""
    record = {
        'event': 'payment_1c_rejected',
        'user_id': getattr(user, 'id', None),
        'username': getattr(user, 'username', ''),
        'contract': str(contract),
        'amount': str(amount),
        'payments': [{'order_id': str(item.get('order_id', '')), 'amount': str(item.get('amount', ''))} for item in payments],
        'reason': str(reason or '')[:2000],
        'response_1c': json.dumps(response, ensure_ascii=False, default=str)[:4000] if response is not None else None,
    }
    logger.warning(json.dumps(record, ensure_ascii=False), extra={'tags': {'component': 'payment_audit', 'action': 'advance_payment', 'status': 'rejected'}})
