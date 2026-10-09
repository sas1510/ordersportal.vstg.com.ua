import { test } from "node:test";
import assert from "node:assert/strict";
import { getDeliveryRows, sortDeliveryDates } from "./deliveryRows.js";
test("delivery dates are ordered newest first", () => {
  assert.deepEqual(sortDeliveryDates(["2026-09-01", "2026-10-08", "2026-10-12", "2026-10-09", "2026-10-05"]), ["2026-10-12", "2026-10-09", "2026-10-08", "2026-10-05", "2026-09-01"]);
});
test("future timed deliveries only, sorted and deduplicated in Kyiv timezone", () => {
  const order = (number, date, status = "Готовий") => ({ number, plannedDeliveryDateTime: date, status });
  const data = [{ orders: [
    order("later", "2026-10-10T12:00:00+03:00"),
    order("first", "2026-10-09T12:00:00+03:00"),
    order("old", "2026-10-09T09:00:00+03:00"),
    order("midnight", "2026-10-10T00:00:00+03:00"),
    order("date-only", "2026-10-10"),
    order("invalid", "invalid"), order("missing", null),
    order("refused", "2026-10-10T12:00:00+03:00", "Відмова"),
    order("first", "2026-10-09T12:00:00+03:00"),
  ] }];
  const rows = getDeliveryRows(data, Date.parse("2026-10-09T10:00:00+03:00"));
  assert.deepEqual(rows.map((row) => [row.order.number, row.day, row.time]), [["first", "2026-10-09", "12:00"], ["later", "2026-10-10", "12:00"]]);
});
test("past and all delivery modes retain date grouping and exclude undated orders", () => {
  const now = Date.parse("2026-10-09T10:00:00+03:00");
  const data = [{ orders: [
    { number: "future", plannedDeliveryDateTime: "2026-10-10T11:00:00+03:00" },
    { number: "past", plannedDeliveryDateTime: "2026-10-08T09:30:00+03:00" },
    { number: "too-old", plannedDeliveryDateTime: "2026-07-08T09:30:00+03:00" },
    { number: "no-time", plannedDeliveryDateTime: "2026-10-08" },
  ] }];
  assert.deepEqual(getDeliveryRows(data, now, "past").map((row) => row.order.number), ["past"]);
  assert.deepEqual(getDeliveryRows(data, now, "all").map((row) => row.order.number), ["past", "future"]);
});
test("past window is three calendar months with month-end clamping", () => {
  const data = [{ orders: [
    { number: "boundary", plannedDeliveryDateTime: "2026-02-28T09:00:00+02:00" },
    { number: "outside", plannedDeliveryDateTime: "2026-02-27T09:00:00+02:00" },
  ] }];
  assert.deepEqual(getDeliveryRows(data, Date.parse("2026-05-31T10:00:00+03:00"), "past").map((row) => row.order.number), ["boundary"]);
});
