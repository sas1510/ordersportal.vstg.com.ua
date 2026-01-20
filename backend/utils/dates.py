# backend/utils/dates.py
from datetime import datetime

BAD_PREFIXES = ("0001-01-01", "2001-01-01", "1753-01-01")

def clean_date(value):
    if not value:
        return None
    s = str(value)
    return None if s.startswith(BAD_PREFIXES) else value


def parse_date(value, name):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"invalid {name} format, expected YYYY-MM-DD")
