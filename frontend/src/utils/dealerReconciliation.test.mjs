import assert from 'node:assert/strict';
import { activityStart, filterReconciliation, summarizeReconciliation, statusBreakdown } from './dealerReconciliation.js';
assert.equal(activityStart('2026-05-31'), '2026-02-28');
assert.equal(activityStart('2026-10-29'), '2026-07-29');
const rows = [
  { name: 'Дилер А', guid: 'A', aliases: ['Портальна назва'], region: 'Львів', newAccount: true, applications: 2, applicationConstructions: 9, convertedApplications: 1, linkedOrders: 2, linkedConstructions: 5, newOrders: 2, newConstructions: 5, recent: 3, total: 3, orderConstructions: 7 },
  { name: 'Дилер Б', guid: 'B', aliases: [], region: 'Філіал', newAccount: true, applications: 3, applicationConstructions: 12, convertedApplications: 3, linkedOrders: 4, linkedConstructions: 10, newOrders: 4, newConstructions: 10, recent: 4, total: 4, orderConstructions: 10 },
];
assert.equal(summarizeReconciliation(rows).conversion, 80);
assert.equal(summarizeReconciliation(rows).onPortal, 2);
assert.equal('independentApplicationConstructions' in summarizeReconciliation(rows), false);
assert.equal(summarizeReconciliation(rows).difference, 6);
assert.equal(filterReconciliation(rows, { region: '', search: 'ПОРТАЛЬНА' }).length, 1);
assert.equal(summarizeReconciliation(filterReconciliation(rows, { region: 'Філіал', newAccount: true, search: '' })).linkedConstructions, 10);
assert.equal(summarizeReconciliation([]).conversion, 0);
console.log('Dealer portal constructions: dates, alias search, filters, conversion and unsplit totals passed');

const docs = [{ guid: 'A', stateGuid: 'P', state: 'Подтверждено', constructions: 3 }, { guid: 'B', stateGuid: 'W', state: 'Ждем оплати', constructions: 2 }];
assert.equal(statusBreakdown([...docs, docs[0]]).reduce((sum, row) => sum + row.constructions, 0), 5);
const actual = summarizeReconciliation([{ ...rows[0], applicationDetails: [docs[0]], cohortOrders: docs, orders: docs, applicationsWithOrders: 1, confirmedLinkedOrders: 1, confirmedLinkedConstructions: 3 }]);
assert.equal(actual.confirmedLinkedConstructions, 3);
assert.equal(actual.orderStatuses.reduce((sum, row) => sum + row.documents, 0), 2);
console.log('Document status quantities and unique GUID status totals passed');

// Period totals include orders without an application and obey the dealer filter.
const unlinked = { guid: 'C', stateGuid: 'R', state: 'Отказ', constructions: 7 };
const periodRows = [
  { ...rows[0], orders: [...docs, unlinked], cohortOrders: docs },
  { ...rows[1], orders: [{ ...unlinked, guid: 'D', constructions: 4 }], cohortOrders: [] },
];
const allPeriod = summarizeReconciliation(periodRows);
assert.equal(allPeriod.periodOrderStatuses.reduce((sum, row) => sum + row.documents, 0), 4);
assert.equal(allPeriod.periodOrderStatuses.reduce((sum, row) => sum + row.constructions, 0), 16);
assert.equal(allPeriod.orderStatuses.reduce((sum, row) => sum + row.documents, 0), 2);
const filteredPeriod = summarizeReconciliation(filterReconciliation(periodRows, { region: 'Філіал', search: '' }));
assert.deepEqual(filteredPeriod.periodOrderStatuses, [{ guid: 'R', name: 'Отказ', documents: 1, constructions: 4 }]);
assert.deepEqual(summarizeReconciliation([]).periodOrderStatuses, []);
console.log('All period order statuses: unlinked orders, filters, quantities and empty results passed');

const groupedDealers = [
  { ...periodRows[0], dealerGroup: 'Дилера' },
  { ...periodRows[1], dealerGroup: 'Філіали' },
];
const branchOnly = filterReconciliation(groupedDealers, { group: 'Філіали', contractor: 'B', region: '', search: '' });
assert.equal(branchOnly.length, 1);
assert.equal(summarizeReconciliation(branchOnly).periodOrderStatuses[0].constructions, 4);
assert.equal(filterReconciliation(groupedDealers, { group: 'Дилера', contractor: 'B', region: '', search: '' }).length, 0);
