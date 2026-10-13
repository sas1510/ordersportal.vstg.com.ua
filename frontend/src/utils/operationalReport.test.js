import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOperationalReport, overdueProduction } from "./operationalReport.js";

test("current production date shown in the order card replaces the original plan", () => {
  const order = { number: "01-360639", status: "У виробництві", planProductionMax: "2026-10-09", factProductionMax: "2026-10-14", factReadyMax: null };
  const now = Date.parse("2026-10-12T10:00:00+03:00");
  assert.equal(overdueProduction(order, now).daysLate, 0);
  assert.equal(buildOperationalReport([{ orders: [order] }], now).risks.length, 0);
  assert.equal(overdueProduction(order, Date.parse("2026-10-14T23:00:00+03:00")).daysLate, 0);
  assert.equal(overdueProduction(order, Date.parse("2026-10-15T10:00:00+03:00")).daysLate, 1);
});

test("dealer activity, separate currency debt, deliveries and readiness risks", () => {
  const now = Date.parse("2026-10-12T09:00:00+03:00");
  const order = (number, date, extra = {}) => ({ number, dateRaw: date, status: "Підтверджений", amount: 100, paid: 50, currency: "UAH", ...extra });
  const data = [{ dealerId: "regular", dealer: "Регулярний", orders: [order("01-1", "2026-08-15"), order("01-2", "2026-09-15"), order("01-3", "2026-10-10", { plannedDeliveryDateTime: "2026-10-13T10:00:00+03:00", currency: "EUR" }), order("34-1", "2026-10-10"), order("45-1", "2026-10-10", { status: "Відмова" })] }, { dealerId: "inactive", dealer: "Неактивний", orders: [order("01-4", "2026-08-01", { planProductionMax: "2026-10-01" })] }];
  const result = buildOperationalReport(data, now);
  const regular = result.dealers.find((dealer) => dealer.id === "regular");
  assert.equal(regular.regular, true);
  assert.equal(regular.orders, 3);
  assert.deepEqual(regular.debts, { UAH: 100, EUR: 50 });
  assert.equal(result.dealers.find((dealer) => dealer.id === "inactive").inactive, true);
  assert.equal(result.deliveries.length, 1);
  assert.equal(result.risks.length, 2);
  assert.equal(result.risks.every((order) => order.delayMissing), true);
  assert.equal(result.risks.filter((order) => order.severity === "high").length, 1);
  assert.equal(result.risks.filter((order) => order.severity === "medium").length, 1);
});
test("assigned delay is not a missing-date alert and completed orders are not risks", () => {
  const result = buildOperationalReport([{ dealer: "Дилер", orders: [
    { number: "01-1", date: "2026-10-01", status: "У виробництві", planProductionMax: "2026-10-10", dateDelay: "2026-10-15" },
    { number: "01-2", date: "2026-10-01", status: "Готовий", planProductionMax: "2026-10-10" },
  ] }], Date.parse("2026-10-12T10:00:00+03:00"));
  assert.equal(result.risks.length, 0);
});
test("last production date or later revised date is the deadline; the deadline day is not overdue", () => {
  const order = { planProductionMin: "2026-09-03", planProductionMax: "2026-09-14" };
  assert.equal(overdueProduction(order, Date.parse("2026-09-14T23:00:00+03:00")).daysLate, 0);
  assert.equal(overdueProduction(order, Date.parse("2026-09-17T10:00:00+03:00")).delayBucket, "1–3 дні");
  assert.equal(overdueProduction(order, Date.parse("2026-09-20T10:00:00+03:00")).delayBucket, "4–7 днів");
  assert.equal(overdueProduction(order, Date.parse("2026-09-23T10:00:00+03:00")).delayBucket, "Понад 7 днів");
  assert.equal(overdueProduction({ ...order, dateDelay: "2026-09-25" }, Date.parse("2026-09-23T10:00:00+03:00")).daysLate, 0);
});
test("due-today readiness is not flagged even with an imminent delivery", () => {
  const report = buildOperationalReport([{ dealer: "Дилер", orders: [{ number: "01-1", dateRaw: "2026-10-01", status: "У виробництві", planProductionMax: "2026-10-12T00:00:00", plannedDeliveryDateTime: "2026-10-12T18:00:00+03:00" }] }], Date.parse("2026-10-12T10:00:00+03:00"));
  assert.equal(report.risks.length, 0);
  assert.equal(report.deliveries.length, 1);
});
