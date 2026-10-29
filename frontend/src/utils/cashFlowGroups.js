/** Group cash flow without reconstructing opening balances from filtered cash rows. */
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const hasNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
export const isRealization = (item) => ['Реалізація', 'РеализацияТоваровУслуг'].includes(item.DocumentType);

export const isMainContract = (name) => /^основн(?:ой|ий)(?:\s|$)/iu.test(String(name || '').trim());
export const isOrderAllocation = (item) => ['ППВход', 'ПКО'].includes(item.DocumentType) && Boolean(String(item.OrderNumber || item.DealNumber || '').trim());

export function buildCashFlowGroups(items, { allocationView = false, unknownDate = 'Невідома дата', noContract = 'Без договору' } = {}) {
  const groups = new Map();
  const sorted = [...items].sort((a, b) =>
    String(a.Date || '').localeCompare(String(b.Date || '')) ||
    String(a.RegistrarId || '').localeCompare(String(b.RegistrarId || '')) ||
    number(a.LineNumber) - number(b.LineNumber));
  for (const item of sorted) {
    const hideContractAmounts = allocationView && isMainContract(item.FinalDogovorName);
    if (allocationView && (isRealization(item) || (hideContractAmounts && !isOrderAllocation(item)))) continue;
    const date = item.Date?.split(/[T ]/)[0] || unknownDate;
    const name = item.FinalDogovorName || noContract;
    const currency = item.Currency_2 || 'грн';
    const contractKey = `${item.DogovorCustomer || item.FinalDogovor || name}|${item.Currency || currency}`;
    const documentId = item.RegistrarId || `${item.DocumentType}|${item.DocumentNumber}`;
    const docKey = `${documentId}|${contractKey}|${item.FlowDirection}|${item.DocumentType}`;
    if (!groups.has(date)) groups.set(date, { date, documentGroups: {}, totalIncome: 0,
      totalExpense: 0, totalRealization: 0, contractSummary: {}, initialContracts: {} });
    const group = groups.get(date);
    if (!group.documentGroups[docKey]) group.documentGroups[docKey] = {
      docKey, hideContractAmounts, items: [], totalIncome: 0, totalExpense: 0, totalRealization: 0,
      CumSaldoStart: number(item.CumSaldoStart), lastCumSaldo: number(item.CumSaldo),
    };
    const document = group.documentGroups[docKey];
    document.items.push(item);
    document.lastCumSaldo = number(item.CumSaldo);
    if (hideContractAmounts) continue; // Keep order allocation cards, omit main-contract totals/badges.
    if (!group.contractSummary[contractKey]) {
      group.contractSummary[contractKey] = { contractName: name, income: 0, expense: 0,
        realized: 0, lastCumSaldo: 0, currency };
      group.initialContracts[contractKey] = { contractName: name, currency,
        initialSaldo: hasNumber(item.DayOpeningSaldo) ? number(item.DayOpeningSaldo) : number(item.CumSaldoStart) };
    }
    const contract = group.contractSummary[contractKey];
    contract.lastCumSaldo = hasNumber(item.DayClosingSaldo) ? number(item.DayClosingSaldo) : number(item.CumSaldo);
    const amount = Math.abs(number(item.DeltaRow));
    if (isRealization(item)) {
      const realized = hasNumber(item.RealizationAmount) ? number(item.RealizationAmount) : amount;
      group.totalRealization += realized;
      document.totalRealization += realized;
      contract.realized += realized;
    }
    if (item.FlowDirection === 'Прихід') {
      group.totalIncome += amount; document.totalIncome += amount; contract.income += amount;
    } else {
      group.totalExpense += amount; document.totalExpense += amount; contract.expense += amount;
    }
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date)).reverse();
}
