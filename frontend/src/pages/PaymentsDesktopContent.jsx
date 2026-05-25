import React from "react";
import { AppIcon } from "../components/Icons/AppIcon";
import { formatDateHuman } from "../utils/formatters";

export default function PaymentsDesktopContent({
  loadData,
  error,
  debtTotal,
  showDebtDetails,
  formatCurrency,
  contracts,
  filteredOrders,
  normalizeStatus,
  STATUS_FILTERS,
  allContracts,
  openPaymentModal
}) {
  return (
    <div className="content" id="content">
      <div className="pp-header">
        <span className="payment-filter-headers-name uppercase">
          Фінанси
        </span>

        <button
          className="pp-reload flex items-center gap-2 font-bold"
          onClick={loadData}
        >
          <AppIcon
            name="reload"
            className="w-[18px] h-[18px]"
          />

          Оновити дані
        </button>
      </div>

      {error && <div className="pp-error">{error}</div>}

      {/* analytics */}

      {debtTotal && (
        <div className="analytics-container">
          {/* твій analytics */}
        </div>
      )}

      {/* аванси */}

      <h2 className="pp-title" style={{ marginTop: 24 }}>
        Ваші аванси на договорах
      </h2>

      <div className="pp-badges">
        {contracts.length === 0 ? (
          <div className="pp-empty">Аванси відсутні</div>
        ) : (
          contracts.map((c, i) => (
            <div key={i} className="pp-badge">
              {c.DogovorName} —
              <strong>
                {formatCurrency(c.DogovorBalance)}
                {" "}
                {c.CurrencyName}
              </strong>
            </div>
          ))
        )}
      </div>

      {/* orders */}

      <h2 className="pp-title" style={{ marginTop: 24 }}>
        Замовлення до оплати
      </h2>

      <div className="pp-orders-wrapper">
        {filteredOrders.length === 0 ? (
          <div className="pp-empty">
            Немає замовлень за обраними фільтрами
          </div>
        ) : (
          filteredOrders.map((o, i) => {
            const currentStatus = normalizeStatus(o.OrderStage);

            const statusObj = STATUS_FILTERS.find(
              f => f.key === currentStatus
            );

            return (
              <div className="pp-order-card" key={i}>
                <div className="pp-section pp-order-meta">
                  <div className="pp-num">
                    № {o.OrderNumber}
                  </div>

                  <div className="pp-date">
                    {o.OrderDate
                      ? formatDateHuman(o.OrderDate.slice(0, 10))
                      : "—"}
                  </div>
                </div>

                <div className="pp-section pp-status-col">
                  <span
                    className={`status-pill ${
                      statusObj
                        ? statusObj.colorClass
                        : "status-unknown"
                    }`}
                  >
                    <img
                      src={statusObj ? statusObj.icon : allContracts}
                      alt=""
                      className="status-pill-icon brightness-0 invert"
                    />

                    {currentStatus}
                  </span>
                </div>

                <div className="pp-section pp-pay-btn-wrapper">
                  <button
                    className="pp-pay-btn"
                    onClick={() => openPaymentModal(o)}
                  >
                    <span className="pp-pay-icon">
                      <AppIcon
                        name="pay"
                        className="w-5 h-5"
                      />
                    </span>

                    Оплатити
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}