"""Local read-only finance SQL; database procedures remain unchanged."""
from functools import lru_cache
from pathlib import Path

@lru_cache(maxsize=2)
def finance_order_sql(source_name, parameter):
    source = (Path(__file__).resolve().parents[2] / "database" / "procedures" / source_name).read_text(encoding="utf-8")
    _, body = source.split("\nAS\n", 1)
    return f"DECLARE @{parameter} binary(16) = %s;\n" + body.replace("%", "%%")
