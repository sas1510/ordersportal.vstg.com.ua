import assert from 'node:assert/strict';
import { activityStart, filterReconciliation, summarizeReconciliation } from './dealerReconciliation.js';
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
