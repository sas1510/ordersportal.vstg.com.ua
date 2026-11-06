from unittest.mock import MagicMock
from django.test import SimpleTestCase
from django.core.cache import cache
from django.db import ProgrammingError
from records.order_sql_compat import execute_orders_sql, OPTIONAL_INDEX, STANDARD_INDEX

class OrdersSqlCompatibilityTests(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.sql = "EXEC [dbo].[GetOrdersMonthWithCalculations8] @RequesterUserID=%s,@DateFrom=%s,@DateTo=%s,@DealerGroup=%s"
        self.params = [1, "2026-11-01", "2026-11-30", None]

    def test_only_removed_index_error_is_retried_without_ddl(self):
        cursor = MagicMock()
        cursor.execute.side_effect = [ProgrammingError("42000", OPTIONAL_INDEX + " (308)"), cursor, cursor]
        cursor.fetchone.return_value = ["CREATE PROCEDURE dbo.Example\nAS\nBEGIN SELECT * FROM X WITH(INDEX("+OPTIONAL_INDEX+"), FORCESEEK) WHERE Name LIKE N'45-%' GROUP BY ID END"]
        execute_orders_sql(cursor, self.sql, self.params)
        fallback, params = cursor.execute.call_args.args
        self.assertIn(STANDARD_INDEX, fallback)
        self.assertNotIn(OPTIONAL_INDEX, fallback)
        self.assertNotIn("CREATE PROCEDURE", fallback)
        self.assertNotIn("ALTER PROCEDURE", fallback)
        self.assertIn("N'45-%%'", fallback)
        self.assertNotIn("GROUP BY", fallback)
        self.assertEqual(params, self.params)
        cursor.execute.reset_mock(side_effect=True)
        execute_orders_sql(cursor, self.sql, self.params)
        cursor.execute.assert_called_once_with(fallback,self.params)

    def test_unrelated_database_failure_is_not_hidden(self):
        cursor=MagicMock();cursor.execute.side_effect=ProgrammingError("Missing column")
        with self.assertRaises(ProgrammingError):execute_orders_sql(cursor,self.sql,self.params)
        self.assertEqual(cursor.execute.call_count,1)

    def test_other_statements_are_passed_through(self):
        cursor=MagicMock();execute_orders_sql(cursor,"SELECT %s",[1])
        cursor.execute.assert_called_once_with("SELECT %s",[1])
