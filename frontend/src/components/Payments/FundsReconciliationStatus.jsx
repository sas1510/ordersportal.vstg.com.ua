export default function FundsReconciliationStatus({ item }) {
  if (!item.funds_status) return null;
  return <div className={`funds-reconciliation funds-reconciliation--${item.funds_status}`}>
    <span>{item.funds_status_label}</span>
    {item.received_amount != null && <small>Отримано: {Number(item.received_amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {item.currency === 'UAH' ? 'грн' : item.currency}</small>}
    {item.funds_checked_at ? <small>Перевірено: {new Date(item.funds_checked_at).toLocaleString('uk-UA')}</small> : <small>Звірку ще не виконано</small>}
    {item.cash_receipts?.length > 0 && <small>ПКО: {item.cash_receipts.map((receipt) => receipt.number || receipt.guid).join(', ')}</small>}
  </div>;
}
