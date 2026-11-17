from django.test import SimpleTestCase
from records.order_sql_compat import PRODUCTION_INDEX, PRODUCTION_STANDARD_INDEX, build_compatible_sql
from records.management.commands.repair_production_index_hints import alter_definition


class ProductionIndexRepairTests(SimpleTestCase):
    def test_only_index_and_declaration_change(self):
        original = f'CREATE PROCEDURE dbo.Example\nAS\nSELECT * FROM X WITH (INDEX({PRODUCTION_INDEX}), FORCESEEK) WHERE Deleted=0'
        repaired = alter_definition(original)
        self.assertEqual(repaired, original.replace('CREATE PROCEDURE', 'ALTER PROCEDURE').replace(PRODUCTION_INDEX, PRODUCTION_STANDARD_INDEX))

    def test_rejects_unexpected_definition(self):
        with self.assertRaises(ValueError):
            alter_definition('SELECT ' + PRODUCTION_INDEX)

    def test_runtime_fallback_handles_both_removed_indexes(self):
        original = f'CREATE PROCEDURE dbo.Example\nAS\nSELECT * FROM X WITH (INDEX({PRODUCTION_INDEX}), FORCESEEK)'
        repaired = build_compatible_sql('GetOrdersMonthWithCalculations9', original)
        self.assertIn(PRODUCTION_STANDARD_INDEX, repaired)
        self.assertNotIn(PRODUCTION_INDEX, repaired)
