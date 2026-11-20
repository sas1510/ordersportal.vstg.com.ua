import { FaBoxOpen } from "react-icons/fa";

const quantityFormat = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 12 });

export default function AdditionalItemsMetric({ orders, compact = false }) {
  const seen = new Set();
  let quantity = 0;
  for (const order of orders ?? []) {
    const id = order.idGuid || order.id || order.guid || order.number;
    if (id && seen.has(id)) continue;
    const value = Number(order.additionalItemsQuantity);
    if (!Number.isFinite(value)) continue;
    if (id) seen.add(id);
    quantity += value;
  }
  const formatted = quantityFormat.format(quantity);

  return (
    <div className="order-quantity-metric" title="Допи з табличної частини замовлення">
      <span className="order-quantity-label text-grey" aria-hidden="true">Допи</span>
      <span className="order-quantity-value" aria-label={`Допи: ${formatted}`}>
        <FaBoxOpen className="order-quantity-box order-summary-icon" aria-hidden="true" />
        <span className={`${compact ? "text-[16px]" : "font-size-24"} font-bold text-WS---DarkBlue calc-primary-text`}>
          {formatted}
        </span>
      </span>
    </div>
  );
}
