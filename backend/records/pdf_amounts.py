"""Conservative extraction: never infer a total from item prices."""
import re
from decimal import Decimal

TOTAL = re.compile(
    r"(?:всього\s+до\s+сплати|итого\s+к\s+оплате|сума\s+замовлення|сумма\s+заказа|"
    r"загальна\s+сума|общая\s+сумма|grand\s+total|gesamtbetrag|загалом|всього|разом|итого|total)"
    # Raskon inserts the price per square metre between the total label and amount.
    r"\s*(?:\([^()\r\n]{1,100}\)\s*)?[:：]?\s*(?:[A-Z]{3}\s*)?"
    r"([0-9][0-9 \u00a0\u202f]*(?:[.,][0-9]{2})?)(?:\s*(грн\.?|UAH|EUR|USD|€|\$))?",
    re.I,
)


def extract_total(text):
    candidates = []
    document_currencies = set()
    for value in re.findall(r"\b(?:UAH|EUR|USD|грн)\b|[€$]", text, re.I):
        normalized = value.upper()
        document_currencies.add({"ГРН": "UAH", "€": "EUR", "$": "USD"}.get(normalized, normalized))
    for match in TOTAL.finditer(text):
        # Subtotals and VAT-only totals must not be mistaken for the grand total.
        context = text[max(0, match.start() - 25):match.start()].lower()
        if re.search(r"(?:без\s+пдв|без\s+ндс|sub)\s*$", context):
            continue
        raw = re.sub(r"\s", "", match.group(1)).replace(",", ".")
        try:
            amount = Decimal(raw).quantize(Decimal("0.01"))
        except Exception:
            continue
        currency = (match.group(2) or "").upper().rstrip(".")
        currency = {"ГРН": "UAH", "€": "EUR", "$": "USD"}.get(currency, currency)
        if not currency and len(document_currencies) == 1:
            currency = next(iter(document_currencies))
        candidates.append({"amount": str(amount), "currency": currency, "evidence": match.group(0).strip()})
    unique = {(item["amount"], item["currency"]) for item in candidates}
    if len(unique) != 1:
        return {"status": "review", "reason": "Підсумок не знайдено або знайдено декілька різних сум.", "candidates": candidates[:20]}
    result = {"status": "extracted", **candidates[0]}
    # Only an explicit extra charge (+) is added: delivery may otherwise already
    # be included in the printed total. Repeated headers must not double-charge it.
    deliveries = {}
    for match in re.finditer(
        r"адресна\s+доставка[ \t]*[:：]?[ \t]*\+[ \t]*"
        r"([0-9][0-9 \u00a0\u202f]*(?:[.,][0-9]{2})?)[ \t]*(грн\.?|UAH|EUR|USD|€|\$)?",
        text, re.I,
    ):
        amount = Decimal(re.sub(r"\s", "", match.group(1)).replace(",", ".")).quantize(Decimal("0.01"))
        currency = (match.group(2) or result["currency"]).upper().rstrip(".")
        currency = {"ГРН": "UAH", "€": "EUR", "$": "USD"}.get(currency, currency)
        deliveries[(amount, currency)] = match.group(0).strip()
    if deliveries:
        if len(deliveries) != 1:
            return {"status": "review", "reason": "Знайдено декілька різних сум адресної доставки.", "candidates": candidates[:20]}
        (delivery, currency), evidence = next(iter(deliveries.items()))
        if not currency or currency != result["currency"]:
            return {"status": "review", "reason": "Не вдалося узгодити валюту адресної доставки та підсумку.", "candidates": candidates[:20]}
        result["base_amount"] = result["amount"]
        result["delivery_amount"] = str(delivery)
        result["amount"] = str(Decimal(result["amount"]) + delivery)
        result["evidence"] += " + " + evidence
    return result
