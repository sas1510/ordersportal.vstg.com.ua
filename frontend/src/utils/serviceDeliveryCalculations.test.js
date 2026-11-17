import test from "node:test";
import assert from "node:assert/strict";
import { serviceDeliveryCalculations } from "./serviceDeliveryCalculations.js";
import { getDeliveryRows, mergeDeliveryRows } from "./deliveryRows.js";

test("PDF includes routed 70- from complaints even if there are no additional orders", () => {
  const complaints = [{ ComplaintNumber: "91", ClaimOrderNumber: "70-38425", ComplaintDate: "2026-11-16", DeliveryOrderGuid: "one", PlannedDeliveryDateTime: "2026-11-17T12:00:00+02:00", StatusName: "Новий", DeliveryOrderCount: 3, DeliveryOrderAmount: 1500, DeliveryOrderCurrency: "грн" }];
  const rows = getDeliveryRows(serviceDeliveryCalculations([], complaints), Date.parse("2026-11-16T12:00:00+02:00"), "all");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].order.number, "70-38425");
  assert.equal(rows[0].order.count, 3);
  assert.equal(rows[0].order.amount, 1500);
  assert.equal(rows[0].order.paid, null);
  assert.equal(mergeDeliveryRows(rows, rows).length, 1);
});

test("refused and unrouted linked orders are excluded without using complaint workflow status", () => {
  const source = serviceDeliveryCalculations([], [
    { ClaimOrderNumber: "70-refused", DeliveryOrderStatus: "Отказ", PlannedDeliveryDateTime: "2026-11-17T12:00:00+02:00" },
    { ClaimOrderNumber: "70-no-route" },
    { ClaimOrderNumber: "70-valid", StatusName: "Відмова", PlannedDeliveryDateTime: "2026-11-17T12:00:00+02:00" },
  ]);
  assert.deepEqual(getDeliveryRows(source, Date.parse("2026-11-16T12:00:00+02:00"), "all").map(row => row.order.number), ["70-valid"]);
});
