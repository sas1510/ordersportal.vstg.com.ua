"""Read-only fallback for a removed optional 1C index; never alters procedures."""
import logging
import re
from django.core.cache import cache
from django.db import ProgrammingError

logger = logging.getLogger(__name__)
OPTIONAL_INDEX = "NonClusteredIndex_20260525_164829"
STANDARD_INDEX = "_InfoRg30529_ByDims30626_RTRR"
PARAMETERS = {
    "GetOrdersMonthWithCalculations8": "@RequesterUserID int=%s, @DateFrom date=%s, @DateTo date=%s, @DealerGroup nvarchar(20)=%s",
    "GetOrdersMonthWithCalculations9": "@RequesterUserID int=%s, @DateFrom date=%s, @DateTo date=%s, @DealerGroup nvarchar(20)=%s",
    "GetCalculationsWithOrdersByYearAndContractor7": "@DateFrom date=%s, @DateTo date=%s, @Contractor_ID binary(16)=%s",
    "GetCalculationsWithOrdersByYearAndContractor8": "@DateFrom date=%s, @DateTo date=%s, @Contractor_ID binary(16)=%s",
}


def build_compatible_sql(name, definition):
    if name not in PARAMETERS:
        raise ValueError("Unsupported order procedure")
    parts = re.split(r"^\s*AS\s*$", definition, maxsplit=1, flags=re.I | re.M)
    if len(parts) != 2 or OPTIONAL_INDEX not in parts[1]:
        raise ValueError("Order procedure does not contain the expected optional index")
    body = parts[1].replace(OPTIONAL_INDEX, STANDARD_INDEX)
    # mssql-django rewrites uppercase GROUP BY parameters and literal percent signs.
    body = re.sub(r"\bGROUP\s+BY\b", "group by", body, flags=re.I)
    return "DECLARE " + PARAMETERS[name] + ";\n" + body.replace("%", "%%")


def execute_orders_sql(cursor, sql, params):
    match = re.search(r"\bEXEC\s+\[dbo\]\.\[([A-Za-z0-9_]+)\]", sql, re.I)
    name = match.group(1) if match else None
    if name not in PARAMETERS:
        return cursor.execute(sql, params)
    # Never apply a date-range signature to the legacy @Year query.
    if len(params) != PARAMETERS[name].count("%s"):
        return cursor.execute(sql, params)
    key = "orders:optional-index-fallback:" + name
    compatible = cache.get(key)
    if compatible:
        return cursor.execute(compatible, params)
    try:
        return cursor.execute(sql, params)
    except ProgrammingError as exc:
        message = str(exc)
        if OPTIONAL_INDEX not in message or "308" not in message:
            raise
        cursor.execute("SELECT OBJECT_DEFINITION(OBJECT_ID(%s))", ["dbo." + name])
        row = cursor.fetchone()
        if not row or not row[0]:
            raise
        compatible = build_compatible_sql(name, row[0])
        result = cursor.execute(compatible, params)
        cache.set(key, compatible, timeout=300)
        logger.warning("Orders query recovered using the standard 1C index; procedure=%s", name)
        return result
