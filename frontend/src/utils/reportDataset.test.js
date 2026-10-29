import { test } from "node:test";
import assert from "node:assert/strict";
import { inReportPeriod, belongsToDealerGroup, isRefusedCalculation } from "./reportDataset.js";
test("refused calculation without orders is not an active new application", () => {
  assert.equal(isRefusedCalculation({ number: "Пандазі", status: "Відмова", orders: [], statuses: { "Відмова": 1 } }), true);
  assert.equal(isRefusedCalculation({ status: " відмова ", orders: [] }), true);
  assert.equal(isRefusedCalculation({ status: "Новий", orders: [] }), false);
  assert.equal(isRefusedCalculation({ orders: [] }), false);
});
test("one dataset supplies selected period, history and disjoint groups", () => {
  const rows = [{ dateRaw: "2026-08-01T10:00:00", dealerType: "Експорт" }, { dateRaw: "2026-10-01T10:00:00", dealerType: "Дилера", isBranch: true }, { dateRaw: "2026-10-12T23:59:00", dealerType: "Філіали" }];
  const period = inReportPeriod(rows, "2026-10-01", "2026-10-12");
  assert.equal(period.length, 2);
  assert.equal(inReportPeriod(rows, "2026-07-14", "2026-10-12").length, 3);
  assert.equal(period.filter((row) => belongsToDealerGroup(row, "Філіали")).length, 1);
  assert.equal(period.filter((row) => belongsToDealerGroup(row, "Дилера")).length, 1);
});

test('processing calculations without orders retain their status instead of becoming new', async () => {
  const { calculationReportStatus, normalizeReportStatus } = await import('./reportDataset.js');
  assert.equal(calculationReportStatus({ status: 'В обробці', orders: [] }), 'В обробці');
  assert.equal(calculationReportStatus({ statuses: { 'В обробці': 1 }, orders: [] }), 'В обробці');
  assert.equal(calculationReportStatus({ status: 'Відмова', orders: [] }), 'Відмова');
  assert.equal(calculationReportStatus({ orders: [] }), 'Новий');
  assert.equal(normalizeReportStatus(' В  роботі '), 'В обробці');
});
