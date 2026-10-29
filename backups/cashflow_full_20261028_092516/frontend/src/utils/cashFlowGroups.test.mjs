import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCashFlowGroups } from './cashFlowGroups.js';
const row = (overrides = {}) => ({ Date: '2026-10-23T16:30:11', RegistrarId: 'payment',
  LineNumber: 1, FinalDogovor: 'main', DogovorCustomer: 'main', FinalDogovorName: 'Основний',
  Currency: 'UAH', Currency_2: 'грн', DocumentType: 'ППВход', FlowDirection: 'Прихід',
  DeltaRow: 30876, CumSaldoStart: 121642, CumSaldo: 152518, DayOpeningSaldo: 130296,
  DayClosingSaldo: 221465, ...overrides });

test('opening balance comes from 1C, not previous visible payment or cash subtotal', () => {
  const groups = buildCashFlowGroups([
    row({ Date: '2026-10-21T16:00:00', CumSaldo: 138167, DayOpeningSaldo: 0, DayClosingSaldo: 138167 }),
    row(),
  ]);
  assert.equal(Object.values(groups[0].initialContracts)[0].initialSaldo, 130296);
});

test('Moshchuk: realizations explain 16525 and reduce main-contract balance exactly once', () => {
  const groups = buildCashFlowGroups([
    row({ Date: '2026-10-22T08:56:52', RegistrarId: 'sale22', DocumentType: 'Реалізація', FlowDirection: 'Витрата',
      DeltaRow: -7871, RealizationAmount: 7871, CumSaldoStart: 138167, CumSaldo: 130296,
      DayOpeningSaldo: 138167, DayClosingSaldo: 130296 }),
    row({ Date: '2026-10-23T08:54:43', RegistrarId: 'sale1', DocumentType: 'Реалізація', FlowDirection: 'Витрата',
      DeltaRow: -1441, RealizationAmount: 1441, CumSaldoStart: 130296, CumSaldo: 128855 }),
    row({ Date: '2026-10-23T08:55:43', RegistrarId: 'sale2', DocumentType: 'Реалізація', FlowDirection: 'Витрата',
      DeltaRow: -6880.42, RealizationAmount: 6880.42, CumSaldoStart: 128855, CumSaldo: 121974.58 }),
    row({ Date: '2026-10-23T12:01:52', RegistrarId: 'sale3', DocumentType: 'Реалізація', FlowDirection: 'Витрата',
      DeltaRow: -332.58, RealizationAmount: 332.58, CumSaldoStart: 121974.58, CumSaldo: 121642 }),
    row(), row({ LineNumber: 2, DeltaRow: 35549, CumSaldoStart: 152518, CumSaldo: 188067 }),
    row({ LineNumber: 3, DeltaRow: 33398, CumSaldoStart: 188067, CumSaldo: 221465 }),
  ]);
  const contract = Object.values(groups[0].contractSummary)[0];
  assert.equal(groups[0].totalRealization, 8654);
  assert.equal(groups[1].totalRealization, 7871);
  assert.equal(contract.income, 99823);
  assert.equal(contract.expense, 8654);
  assert.equal(130296 + contract.income - contract.expense, contract.lastCumSaldo);
});

test('contracts with same name or different currencies are not merged', () => {
  const groups = buildCashFlowGroups([row(), row({ DogovorCustomer: 'another', FinalDogovor: 'another' }),
    row({ Currency: 'EUR', Currency_2: 'EUR' })]);
  assert.equal(Object.keys(groups[0].contractSummary).length, 3);
  assert.equal(Object.keys(groups[0].documentGroups).length, 3);
});

test('same timestamp follows registrar and line order and does not mutate input', () => {
  const items = [row({ LineNumber: 2, CumSaldoStart: 152518, CumSaldo: 188067 }), row()];
  const original = structuredClone(items);
  const document = Object.values(buildCashFlowGroups(items)[0].documentGroups)[0];
  assert.equal(document.CumSaldoStart, 121642);
  assert.equal(document.lastCumSaldo, 188067);
  assert.deepEqual(items, original);
});

test('legacy response uses first movement opening, not inferred closing minus visible cash', () => {
  const groups = buildCashFlowGroups([row({ DayOpeningSaldo: null, DayClosingSaldo: null, CumSaldo: 152518 })]);
  assert.equal(Object.values(groups[0].initialContracts)[0].initialSaldo, 121642);
});
