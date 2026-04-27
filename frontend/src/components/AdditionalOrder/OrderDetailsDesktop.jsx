import React from "react";
import { formatDateHumanShorter } from "../../utils/formatters";
import "./OrderDetailsDesktop.css";

export default function OrderDetailsDesktop({ order }) {
  const isEmpty = (val) =>
    val === undefined || val === null || String(val).trim() === "";

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
        return "text-WS---DarkBlue";
      case "Очикуємо оплату":
      case "Очикуємо підтвердження":
      case "Відмова":
        return "text-WS---DarkRed";
      case "Готовий":
      case "Відвантажений":
      case "Підтверджений":
      case "У виробництві":
        return "text-WS---DarkGreen";
      default:
        return "text-WS---DarkRed";
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
    if (!planned && !actual)
      return { icon: "text-WS---DarkGrey", bg: "bg-WS---DarkGrey-Light" };
    // Якщо є фактична дата → зелений
    if (actual) return { icon: "text-WS---DarkGreen ", bg: "bg-WS---DarkGreen-Light" }

    // Якщо нема фактичної, але є планова дата
    if (planned && planned < today)
      return { icon: "text-WS---DarkRed", bg: "bg-WS---DarkRed-Light" }; // прострочено
   return { icon: "text-WS---DarkGrey", bg: "bg-WS---DarkGrey-Light" };
  };

  return (
    <div className="order-item-details flex flex-col gap-3 w-full">
      <div className="timeline w-full">
        <ul className="timeline-list">
          {/* Замовлення */}
          <li>
            <div
              className={`icon ${isEmpty(order.date) ? "text-WS---DarkRed" : "text-WS---DarkGreen"}`}
            >
              <span className="icon-news font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Замовлення</div>
              <div className="badge-content bg-WS---DarkGreen-Light">
                {order.date || "Немає дати"}
              </div>
            </div>
          </li>

          {/* Оплата */}
          <li>
            <div
              className={`icon ${paymentDue() > 0 ? "text-WS---DarkRed" : "text-WS---DarkGreen"}`}
            >
              <span className="icon-coin-dollar font-size-22"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Оплата</div>
              <div
                className={`badge-content ${paymentDue() > 0 ? "bg-WS---DarkRed-Light" : "bg-WS---DarkGreen-Light"}`}
              >
                {paymentDue() > 0
                  ? `Борг: ${paymentDue().toLocaleString("uk-UA", { minimumFractionDigits: 2 })} `
                  : "Сплачено"}
              </div>
            </div>
          </li>

          {/* Підтвердження */}
          <li>
            <div
              className={`icon ${isEmpty(order.status) ? "text-WS---DarkRed" : getStatusStyle(order.status)}`}
            >
              <span className="icon-clipboard font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Підтвердження</div>
              <div
                className={`badge-content ${isEmpty(order.status) ? "bg-WS---DarkRed-Light" : "bg-WS---DarkGreen-Light"}`}
              >
                {order.status || "Не підтверджено"}
              </div>
            </div>
          </li>

          {/* Виробництво */}
          <li>
            {(() => {
              // Виробництво: факт = factStartProduction, план = planProduction
              const factDate = order.factStartProduction;
              const planDate = order.planProduction;
              const factReady = order.factReady; // 🆕 Додаємо факт готовності

              const status = getDateStatus(planDate, factDate || factReady); // Використовуємо факт готовності для статусу, якщо немає факту старту

              const displayDate = factDate ? (
                formatDateHumanShorter(factDate) // ✅ Є факт початку
              ) : factReady ? ( // 🆕 Якщо немає факту початку, але є факт готовності
                <div
                  className="plan-block executed-block"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/*                         <div className="plan-name executed-name">Виконано:</div> */}
                  <div> {formatDateHumanShorter(factReady)}</div>
                </div>
              ) : planDate ? (
                <div
                  className="plan-block"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="plan-name">Планово:</div>
                  <div> {formatDateHumanShorter(planDate)}</div>{" "}
                  {/* ВИПРАВЛЕНО: planDate замість order.planProduction */}
                </div>
              ) : (
                "Немає даних"
              );

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
              const status = getDateStatus(order.planReadyMax, order.factReady);
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-layers2 font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Готовність</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHumanShorter(order.factReady) || "Немає даних"}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>

          {/* Доставка */}
          <li>
            {(() => {
              const status = getDateStatus(
                order.planDelivery,
                order.realizationDate,
              );
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-shipping font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Доставка</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHumanShorter(order.realizationDate) ||
                        "Не доставлено"}
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
