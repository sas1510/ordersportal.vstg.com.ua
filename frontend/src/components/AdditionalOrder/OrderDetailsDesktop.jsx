import React from "react";
import {formatDateHuman} from '../../utils/formatters'
import {formatDateHumanShorter} from '../../utils/formatters'
import {formatDate} from '../../utils/formatters'
import './OrderDetailsDesktop.css';

export default function OrderDetailsDesktop({ order }) {
  const isEmpty = (val) => val === undefined || val === null || String(val).trim() === "";

  // --- Оплата ---
  const paymentDue = () => {
    if (isEmpty(order.amount) || isEmpty(order.paid)) return 0;
    return parseFloat(order.amount) - parseFloat(order.paid);
  };

  // --- Статус ---
  const getStatusStyle = (status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "Підтверджений":
      case "У виробництві":
        return "text-info";
      case "Очикуємо оплату":
      case "Очикуємо підтвердження":
      case "Відмова":
        return "text-danger";
      case "Готовий":
      case "Відвантажений":
        return "text-success";
      default:
        return "text-danger";
    }
  };

  // --- Дата ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  };

  const getDateStatus = (plannedStr, actualStr) => {
    const planned = parseDate(plannedStr);
    const actual = parseDate(actualStr);
    const today = new Date();

    // Червоний, якщо немає ні фактичної, ні планової
    if (!planned && !actual) return { icon: "text-danger", bg: "background-warning-light" };

    // Якщо є фактична дата → зелений
    if (actual) return { icon: "text-success", bg: "background-success-light" };

    // Якщо нема фактичної, але є планова дата
    if (planned && planned < today) return { icon: "text-danger", bg: "background-warning-light" }; // прострочено
    return { icon: "text-warning", bg: "background-warning-light" }; // ще в процесі
  };

  return (
    <div className="order-item-details flex flex-col gap-3 w-full">
      <div className="timeline w-full">
        <ul className="timeline-list">

          {/* Замовлення */}
          <li>
            <div className={`icon ${isEmpty(order.date) ? "text-danger" : "text-success"}`}>
              <span className="icon-news font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Замовлення</div>
              <div className="badge-content background-success-light">
                {order.date || "Немає дати"}
              </div>
            </div>
          </li>

          {/* Оплата */}
          <li>
            <div className={`icon ${paymentDue() > 0 ? "text-danger" : "text-success"}`}>
              <span className="icon-coin-dollar font-size-22"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Оплата</div>
              <div className={`badge-content ${paymentDue() > 0 ? "background-danger-light" : "background-success-light"}`}>
                {paymentDue() > 0 
              ? `Борг: ${paymentDue().toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ` 
              : "Сплачено"}

              </div>
            </div>
          </li>

          {/* Підтвердження */}
          <li>
            <div className={`icon ${isEmpty(order.status) ? "text-danger" : getStatusStyle(order.status)}`}>
              <span className="icon-clipboard font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Підтвердження</div>
              <div className={`badge-content ${isEmpty(order.status) ? "background-danger-light" : "background-success-light"}`}>
                {order.status || "Не підтверджено"}
              </div>
            </div>
          </li>

          {/* Виробництво */}
          <li>
            {(() => {
              const factDate = order.factProductionMax;
              const planDate = order.planProductionMax;
              const status = getDateStatus(planDate, factDate);

              const displayDate = factDate 
                ? formatDateHuman(factDate)
                 : planDate 
                    ? (
                        <div className="plan-block">
                          <div className="plan-name">Планово:  </div>
                          <div >з {formatDateHumanShorter(order.planProductionMin)}</div>
                          <div className="plan-dates">
                            по {formatDateHumanShorter(planDate)}
                          </div>
                        </div>
                      )
                    : "Немає даних";

              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-cogs font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Виробництво</div>
                    <div className={`badge-content ${status.bg}`}>
                      {displayDate}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>



          {/* Готовність */}
          <li>
            {(() => {
              const status = getDateStatus(order.planReadyMax, order.factReadyMax);
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-layers2 font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Готовність</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHuman(order.factReadyMax) || "Не готовий"}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>

          {/* Доставка */}
          <li>
            {(() => {
              const status = getDateStatus(order.planDelivery, order.realizationDate);
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-shipping font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Доставка</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHuman(order.realizationDate) || "Не доставлено"}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>

        </ul>
      </div>
    </div>
  );
}
