from decimal import Decimal


def use_full_underadvance_debt(orders, summary):
    """Keep category membership, replace the advance shortfall with unpaid debt."""
    total = Decimal("0")
    for order in orders:
        current = Decimal(str(order.get("NedoAvans") or 0))
        if current <= 0:
            continue
        if order.get("ZakazSumma") is not None and order.get("PaidAmount") is not None:
            current = max(Decimal("0"), Decimal(str(order["ZakazSumma"])) - Decimal(str(order["PaidAmount"])))
            order["NedoAvans"] = current
        total += current
    if summary is not None:
        summary["NedoAvans"] = total
