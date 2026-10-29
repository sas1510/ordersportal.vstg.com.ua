export const DEALER_REPORT_GROUP_OPTIONS = [
  { value: '__GROUP__DEALERS', label: 'Дилера', group: 'Дилера' },
  { value: '__GROUP__OUR_COMPANY', label: 'Наша фірма', group: 'ТОВ "Наша фірма"' },
  { value: '__GROUP__EXPORT', label: 'Експорт', group: 'Експорт' },
  { value: '__GROUP__BRANCHES', label: 'Філіали', group: 'Філіали' },
];
export const dealerGroupForSelection = (value) =>
  DEALER_REPORT_GROUP_OPTIONS.find((option) => option.value === value)?.group || null;
export const isAggregateDealerSelection = (value) => value === '__ALL__' || Boolean(dealerGroupForSelection(value));
