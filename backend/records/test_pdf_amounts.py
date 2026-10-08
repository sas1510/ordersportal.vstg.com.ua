import unittest

from records.pdf_amounts import extract_total


class PdfAmountTests(unittest.TestCase):
    def test_address_delivery_extra_charge(self):
        result = extract_total("ЗАГАЛОМ 51477\nЦіни зазначені у грн\nАдресна доставка +500грн")
        self.assertEqual(result["amount"], "51977.00")
        self.assertEqual(result["delivery_amount"], "500.00")

    def test_repeated_delivery_is_added_once(self):
        result = extract_total("ЗАГАЛОМ 51477 грн\nАдресна доставка +500грн\nАдресна доставка +500грн")
        self.assertEqual(result["amount"], "51977.00")

    def test_delivery_without_plus_not_added(self):
        self.assertEqual(extract_total("ЗАГАЛОМ 51477 грн\nАдресна доставка 500грн")["amount"], "51477.00")

    def test_ambiguous_delivery_requires_review(self):
        self.assertEqual(extract_total("ЗАГАЛОМ 51477 грн\nАдресна доставка +500грн\nАдресна доставка +700грн")["status"], "review")

    def test_delivery_currency_mismatch_requires_review(self):
        self.assertEqual(extract_total("ЗАГАЛОМ 51477 грн\nАдресна доставка +500EUR")["status"], "review")

    def test_raskon_discounted_total_with_square_metre_price(self):
        text = (
            "Загалом по конструкціях       38269\n"
            "Загалом знижка    48 %       18369\n"
            "ЗАГАЛОМ (4929 за 1 м.кв.)    19900\n"
            "Ціни зазначені у грн\nСума: 38269"
        )
        result = extract_total(text)
        self.assertEqual((result["status"], result["amount"], result["currency"]), ("extracted", "19900.00", "UAH"))
        self.assertIn("(4929 за 1 м.кв.)", result["evidence"])

    def test_raskon_discount_rows_alone_are_not_totals(self):
        self.assertEqual(extract_total("Загалом по конструкціях 38269\nЗагалом знижка 48 % 18369 грн")["status"], "review")

    def test_parenthesis_without_final_amount_is_not_a_total(self):
        self.assertEqual(extract_total("ЗАГАЛОМ (4929 за 1 м.кв.)")["status"], "review")

    def test_raskon_total_not_item_price(self):
        result = extract_total("Профіль: WDS    ЗАГАЛОМ          8837\nФурнітура: VHS    Ціни зазначені у    грн\nВартість: (4971 за 1 м.кв.)\nСума: 8837")
        self.assertEqual((result["status"], result["amount"], result["currency"]), ("extracted", "8837.00", "UAH"))

    def test_ukrainian_total(self):
        result = extract_total("Всього до сплати: 35 853,00 грн.")
        self.assertEqual((result["amount"], result["currency"]), ("35853.00", "UAH"))

    def test_currency_elsewhere(self):
        self.assertEqual(extract_total("Валюта EUR\nTotal: 1234.50")["currency"], "EUR")

    def test_ambiguous(self):
        self.assertEqual(extract_total("Разом: 100,00 грн\nВсього: 120,00 грн")["status"], "review")

    def test_item_prices_are_not_totals(self):
        self.assertEqual(extract_total("Вікно 1 шт 1000,00 грн")["status"], "review")

    def test_missing_currency_not_invented(self):
        self.assertEqual(extract_total("Всього: 100,00")["currency"], "")

    def test_repeated_total(self):
        self.assertEqual(extract_total("Всього: 100,00 грн\nВсього: 100,00 грн")["status"], "extracted")
