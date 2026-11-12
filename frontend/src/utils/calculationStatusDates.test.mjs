import test from "node:test";
import assert from "node:assert/strict";
import { calculationStatusDates, calculationSummaryDates } from "./calculationStatusDates.js";
test("date ranges include only orders of the selected status and expose missing dates", () => {
 const rows=Array.from({length:10},(_,i)=>({status:"У виробництві",planProductionMin:i<7?`2026-11-${String(12+i).padStart(2,"0")}`:null}));
 rows.push({status:"Відвантажений",realizationDate:"2026-10-01"});
 assert.deepEqual(calculationStatusDates(rows,"У виробництві"),{label:"План вир.",range:"12.11.2026 — 18.11.2026",available:7,total:10});
});
test("same dates collapse and shipment uses actual rather than planned dates", () => {
 assert.equal(calculationStatusDates([{status:"Відвантажений",realizationDate:"2026-11-02T14:00:00Z",planDelivery:"2026-11-07"}],"Відвантажений").range,"02.11.2026");
 assert.equal(calculationStatusDates([{status:"Готовий",factReadyMin:"2026-11-01",factReadyMax:"2026-11-01"}],"Готовий").range,"01.11.2026");
});
test("missing dates, 1C empty dates and unrelated statuses render no date caption", () => {
 assert.equal(calculationStatusDates([{status:"Готовий",factReadyMax:"0001-01-01"}],"Готовий"),null);
 assert.equal(calculationStatusDates([{status:"Очікуємо оплату",planProductionMax:"2026-11-01"}],"Очікуємо оплату"),null);
});

test("one calculation date caption follows confirmed then production priority", () => {
 const rows=[{status:"Підтверджений",planProductionMin:"2026-11-20",planProductionMax:"2026-12-03"},{status:"У виробництві",planProductionMax:"2026-11-18"}];
 assert.equal(calculationSummaryDates(rows,"У виробництві"),null);
 assert.equal(calculationSummaryDates(rows,"Підтверджений").range,"20.11.2026 — 03.12.2026");
 const mixed=[{status:"Готовий",factReadyMax:"2026-11-01"},{status:"У виробництві",planProductionMin:"2026-11-02",planProductionMax:"2026-11-06"}];
 assert.equal(calculationSummaryDates(mixed,"Готовий"),null);
 assert.equal(calculationSummaryDates(mixed,"У виробництві").range,"02.11.2026 — 06.11.2026");
 assert.equal(calculationSummaryDates([mixed[1]],"У виробництві").range,"06.11.2026");
});
