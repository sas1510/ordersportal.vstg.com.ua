export function paymentDebtTotals(orders) {
  const totals = {}, seen = new Set();
  for (const order of orders || []) {
    const number = String(order.OrderNumber || order.Number || "");
    if (/^34-/.test(number)) continue;
    const key = order.OrderID_GUID || order.OrderGUID || order.OrderID || number;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const debt = Number(order.DebtAmount);
    if (!Number.isFinite(debt)) continue;
    const currency = order.CurrencyName || order.Currency || "Валюта не вказана";
    totals[currency] = (totals[currency] || 0) + Math.max(0, debt);
  }
  return totals;
}
