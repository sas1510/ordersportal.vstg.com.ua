"""Canonical portal deep link to the original measurement request."""
import re
from urllib.parse import urlencode


def measurement_portal_path(order_number, dealer_id):
    number=str(order_number or '').strip()
    dealer=str(dealer_id or '').strip()
    match=re.fullmatch(r'zamir-([1-9]\d*)',number,re.IGNORECASE)
    if not match or not re.fullmatch(r'[1-9]\d*',dealer):
        return None
    return '/zamir?'+urlencode({'request_id':int(match.group(1)),'dealer_id':int(dealer)})
