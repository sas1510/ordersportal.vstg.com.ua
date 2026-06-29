import React from "react";
import { formatDateHuman } from "../utils/formatters";
import { useTranslation } from "react-i18next";

export default function PaymentsMobileContent({
  filteredOrders,
  openPaymentModal,
  formatCurrency,
  normalizeStatus,
  translateStatus,
  STATUS_FILTERS,
  inProcessingIcon,
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="pp-orders-wrapper mobile-only-payments">
      {filteredOrders.length === 0 ? (
        <div className="pp-empty">
          {t("payments_page.empty.no_orders_filtered")}
        </div>
      ) : (
        filteredOrders.map((o, i) => {
          const currentStatus = normalizeStatus(o.OrderStage);
          const statusObj = STATUS_FILTERS.find((f) => f.key === currentStatus);
          const statusIcon = statusObj ? statusObj.icon : inProcessingIcon;
          const statusColor = statusObj ? statusObj.colorClass : "status-unknown";

          return (
            <div className="pp-order-card mobile-card" key={i}>
              {/* Верхня тонка зелена лінія картки на всю ширину */}
              {/* <div className="card-top-accent" /> */}

              {/* Блок 1: Хедер (Номер, Дата та Статус) */}
              <div className="mobile-card-section info-section">
                <div className="order-meta">
                  <div className="pp-num">№ {o.OrderNumber}</div>
                  <div className="pp-date">
                    {o.OrderDate ? formatDateHuman(o.OrderDate.slice(0, 10), i18n.language) : "—"}
                  </div>
                </div>

                <div className={`status-pill ${statusColor}`}>
                  {statusIcon && <img src={statusIcon} alt="" className="brightness-0 invert" />}
                  <span>{translateStatus ? translateStatus(currentStatus) : currentStatus}</span>
                </div>
              </div>

              <div className="border-bottom-custom-payment" />

              {/* Блок 2: Фінансова сітка 2х2 - тепер розтягується повністю */}
              <div className="mobile-card-grid">
                {/* Сума */}
                <div className="grid-cell cell-sum">
                  <span className="mobile-label-payment">{t("payments_page.labels.amount")}</span>
                  <strong className="order-sum-payment">
                    {formatCurrency(o.OrderSum)}{" "}
                    <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                  </strong>
                </div>

                {/* Оплачено */}
                <div className="grid-cell cell-paid">
                  <span className="mobile-label-payment">{t("payments_page.labels.paid")}</span>
                  <strong className="pp-green-payment">
                    {formatCurrency(o.PaidAmount)}{" "}
                    <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                  </strong>
                </div>

             

                {/* Залишок */}
                <div className="grid-cell cell-debt">
                  <span className="mobile-label-payment">{t("payments_page.labels.balance_due")}</span>
                  <strong className="pp-red-payment">
                    {formatCurrency(o.DebtAmount)}{" "}
                    <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                  </strong>
                </div>

                {/* Кнопка Оплатити */}
                <div className="grid-cell cell-action">
                  <button
                    className="pp-pay-btn mobile-pay-btn"
                    onClick={() => openPaymentModal(o)}
                  >
                    <span className="pay-icon">₴</span>
                    {t("payments_page.actions.pay")}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
