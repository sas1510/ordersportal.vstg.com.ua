import { test } from "node:test";
import assert from "node:assert/strict";
import { paymentDebtTotals } from "./paymentDebtTotals.js";
test("payment source debt excludes sketches, duplicates, overpayments and mixes no currencies", () => {
  assert.deepEqual(paymentDebtTotals([
    { OrderNumber: "01-1", OrderID_GUID: "a", DebtAmount: 500, CurrencyName: "грн" },
    { OrderNumber: "01-1", OrderID_GUID: "a", DebtAmount: 500, CurrencyName: "грн" },
    { OrderNumber: "45-1", DebtAmount: 25, CurrencyName: "EUR" },
    { OrderNumber: "34-1", DebtAmount: 100, CurrencyName: "грн" },
    { OrderNumber: "01-2", DebtAmount: -5, CurrencyName: "грн" },
  ]), { "грн": 500, EUR: 25 });
});
