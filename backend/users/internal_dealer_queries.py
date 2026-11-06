"""Read-only queries from the local internal-dealer procedure sources."""
from functools import lru_cache
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[2] / "database" / "procedures"


@lru_cache(maxsize=1)
def internal_dealer_balance_sql():
    source = (SOURCE_DIRECTORY / "GetInternalDealerAdvanceBalanceByCurrency.sql").read_text(encoding="utf-8")
    _, body = source.split("\nAS\n", 1)
    return "DECLARE @Контрагент binary(16) = %s;\n" + body.replace("%", "%%")


@lru_cache(maxsize=1)
def internal_dealer_orders_sql():
    source = (SOURCE_DIRECTORY / "GetInternalDealerOrdersByPeriod.sql").read_text(encoding="utf-8")
    _, body = source.split("\nAS\n", 1)
    return (
        "-- Local GetInternalDealerOrdersByPeriod\n"
        "DECLARE @DateFrom date = %s, @DateTo date = %s, @Contractor_ID binary(16) = %s;\n"
        + body.replace("%", "%%")
    )


@lru_cache(maxsize=1)
def internal_dealer_debts_sql():
    """Finance and header include the same order prefixes; no database DDL."""
    source = (SOURCE_DIRECTORY / "GetInternalDealerPartnerDebts.sql").read_text(encoding="utf-8")
    _, body = source.split("\nAS\n", 1)
    return "DECLARE @TargetPartnerID binary(16) = %s;\n" + body.replace("%", "%%")
