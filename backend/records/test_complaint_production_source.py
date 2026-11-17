from django.test import SimpleTestCase
from records.management.commands.repair_complaint_production_source import BROKEN_SOURCE, RAW_SOURCE, repair_definition

class ComplaintProductionSourceTests(SimpleTestCase):
    def test_replaces_only_verified_fields(self):
        source = f'CREATE PROCEDURE dbo.GetComplaintsFull\nAS SELECT SUM(RP2.Количество) FROM {BROKEN_SOURCE} ON RP2.Заказ=X.ZPPLink JOIN Y ON Y.Ссылка=RP2.Ссылка'
        fixed = repair_definition(source)
        self.assertIn(RAW_SOURCE, fixed)
        self.assertIn('SUM(RP2._Fld10543)', fixed)
        self.assertIn('RP2._Fld10540_RRRef=X.ZPPLink', fixed)
        self.assertIn('Y.Ссылка=RP2._Document488_IDRRef', fixed)
        self.assertTrue(fixed.startswith('ALTER PROCEDURE'))

    def test_unknown_source_is_rejected(self):
        with self.assertRaises(ValueError):
            repair_definition('CREATE PROCEDURE dbo.Other AS SELECT 1')
