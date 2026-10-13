import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
import django
django.setup()
from django.db import connection, transaction

original = (root / "database/procedures/backups/GetOrdersMonthWithCalculations8_before_sales_filter_20261012.sql").read_text(encoding="utf-8").strip()
updated = (root / "database/procedures/GetOrdersMonthWithCalculations8.sql").read_text(encoding="utf-8")
with transaction.atomic():
    with connection.cursor() as cursor:
        cursor.execute("SELECT definition, uses_ansi_nulls, uses_quoted_identifier FROM sys.sql_modules WHERE object_id=OBJECT_ID(N'dbo.GetOrdersMonthWithCalculations8')")
        definition, ansi, quoted = cursor.fetchone()
        if definition.replace("\r\n", "\n").strip() != original:
            raise RuntimeError("Procedure changed since backup. Nothing applied.")
        cursor.execute("SET ANSI_NULLS " + ("ON" if ansi else "OFF"))
        cursor.execute("SET QUOTED_IDENTIFIER " + ("ON" if quoted else "OFF"))
        cursor.execute(updated)
        cursor.execute("EXEC dbo.GetOrdersMonthWithCalculations8 @RequesterUserID=%s, @DateFrom=%s, @DateTo=%s, @DealerGroup=NULL", [2, "2026-08-20", "2026-08-20"])
        columns = [item[0] for item in cursor.description]
        matches = [dict(zip(columns, row)) for row in cursor.fetchall() if str(row[columns.index("OrderNumber")] or "").strip() == "04-87501"]
        if not matches or any(row.get("OrderStage") != "Відвантажений" or not row.get("SaleDate") for row in matches):
            raise RuntimeError("Verification failed; procedure change will roll back.")
        for row in matches:
            print({key: row.get(key) for key in ["OrderNumber", "OrderStage", "SaleDate", "SoldQuantity", "ConstructionsCount"]})
print("Applied and verified. Previous definition saved in database/procedures/backups.")
