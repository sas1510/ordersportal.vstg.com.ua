import unittest
from decimal import Decimal
from records.debt_amounts import use_full_underadvance_debt


class UnderadvanceDebtTests(unittest.TestCase):
    def test_full_debt_and_summary(self):
        orders = [{"ZakazSumma": 10000, "PaidAmount": 2000, "NedoAvans": 3000},
                  {"ZakazSumma": 6000, "PaidAmount": 1000, "NedoAvans": 2000},
                  {"ZakazSumma": 10000, "PaidAmount": 7000, "NedoAvans": None, "InWorkDebt": 3000}]
        summary = {"NedoAvans": 5000, "InWorkDebt": 3000}
        use_full_underadvance_debt(orders, summary)
        self.assertEqual(orders[0]["NedoAvans"], Decimal("8000"))
        self.assertEqual(summary["NedoAvans"], Decimal("13000"))
        self.assertEqual(summary["InWorkDebt"], 3000)
        self.assertIsNone(orders[2]["NedoAvans"])

    def test_new_procedure_amount_not_added_twice(self):
        orders = [{"ZakazSumma": "10000.50", "PaidAmount": "2000.25", "NedoAvans": "8000.25"}]
        summary = {}
        use_full_underadvance_debt(orders, summary)
        self.assertEqual(summary["NedoAvans"], Decimal("8000.25"))
