import React, { useCallback, useMemo } from "react"; // Імпортуємо useCallback та useMemo
import {formatDateHuman} from '../../utils/formatters'
import {formatDateHumanShorter} from '../../utils/formatters'
import {formatDate} from '../../utils/formatters'
import './OrderDetailsDesktop.css';

// КРОК 1: Обгортаємо функціональний компонент у React.memo
export default React.memo(function OrderDetailsDesktop({ order }) {
//                                ^^^^^^^^^^
  // Мемоїзуємо статичну функцію, що перевіряє на порожнє значення
  const isEmpty = useCallback((val) => val === undefined || val === null || String(val).trim() === "", []);

  // --- 1. Оплата (Мемоїзація обчислюваного значення) ---
  const paymentDue = useMemo(() => {
    if (isEmpty(order.amount) || isEmpty(order.paid)) return 0;
    // Використовуємо parseFloat для коректного обчислення
    const due = parseFloat(order.amount) - parseFloat(order.paid);
    // Обмежуємо точність для уникнення проблем з плаваючою комою
    return Math.round(due * 100) / 100; 
  }, [order.amount, order.paid, isEmpty]);

  // --- 2. Статус (Мемоїзація статичної функції) ---
  const getStatusStyle = useCallback((status) => {
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
  }, []);

  // --- 3. Дата (Мемоїзація допоміжних функцій) ---
  const parseDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }, []); // Не залежить від пропсів

  const getDateStatus = useCallback((plannedStr, actualStr) => {
    const planned = parseDate(plannedStr);
    const actual = parseDate(actualStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Обнуляємо час для коректного порівняння дат

    // Червоний, якщо немає ні фактичної, ні планової
    if (!planned && !actual) return { icon: "text-danger", bg: "background-warning-light" };

    // Якщо є фактична дата → зелений
    if (actual) return { icon: "text-success", bg: "background-success-light" };

    // Якщо нема фактичної, але є планова дата
    // Порівнюємо лише дати
    if (planned && planned < today) return { icon: "text-danger", bg: "background-danger-light" }; // прострочено (змінив bg на більш агресивний)
    return { icon: "text-warning", bg: "background-warning-light" }; // ще в процесі (або планова дата в майбутньому)
  }, [parseDate]); // Залежить від parseDate

  // --- 4. Мемоїзація обчислень для кожного елемента Timeline (для зменшення вбудованого JSX) ---
  
  const paymentIsDue = paymentDue > 0;

  // Виробництво
  const productionStatus = useMemo(() => {
    const factDate = order.factProductionMax;
    const planDate = order.planProductionMax;
    const status = getDateStatus(planDate, factDate);

    const displayDate = factDate 
        ? formatDateHuman(factDate)
        : planDate 
          ? (
              <div className="plan-block">
                <div className="plan-name">Планово: </div>
                <div >з {formatDateHumanShorter(order.planProductionMin)}</div>
                <div className="plan-dates">
                  по {formatDateHumanShorter(planDate)}
                </div>
              </div>
            )
          : "Немає даних";
    return { status, displayDate };
  }, [order.factProductionMax, order.planProductionMax, order.planProductionMin, getDateStatus]);

  // Готовність
  const readyStatus = useMemo(() => {
    const isDelayed = !order.factReadyMax && order.dateDelay;
    
    // Якщо є затримка, повертаємо "агресивний" червоний статус
    if (isDelayed) {
      return { 
        icon: "text-danger", 
        bg: "background-danger-light", 
        isDelayed: true 
      };
    }
    
    return getDateStatus(order.planReadyMax, order.factReadyMax);
  }, [order.planReadyMax, order.factReadyMax, order.dateDelay, getDateStatus]);

  // Доставка
  const deliveryStatus = useMemo(() => {
    return getDateStatus(order.planDelivery, order.realizationDate);
  }, [order.planDelivery, order.realizationDate, getDateStatus]);





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
                {formatDateHumanShorter(order.date) || "Немає дати"}
              </div>
            </div>
          </li>

          {/* Оплата */}
          <li>
            <div className={`icon ${paymentIsDue ? "text-danger" : "text-success"}`}>
              <span className="icon-coin-dollar font-size-22"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Оплата</div>
              <div className={`badge-content ${paymentIsDue ? "background-danger-light" : "background-success-light"}`}>
                {paymentIsDue 
              ? `Борг: ${paymentDue.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ` 
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
              <div className={`icon ${productionStatus.status.icon}`}>
                <span className="icon-cogs font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Виробництво</div>
                <div className={`badge-content ${productionStatus.status.bg}`}>
                  {productionStatus.displayDate}
                </div>
              </div>
          </li>

          {/* Готовність */}
          <li>
              <div className={`icon ${readyStatus.icon}`}>
                <span className="icon-layers2 font-size-20"></span>
              </div>
              <div className="badge">
                {/* Міняємо заголовок, якщо це затримка */}
                <div className="badge-title">
                  {readyStatus.isDelayed ? "Затримка" : "Готовність"}
                </div>
                <div className={`badge-content ${readyStatus.bg}`}>
                  {order.factReadyMax 
                    ? formatDateHumanShorter(order.factReadyMax) 
                    : (order.dateDelay 
                        ? formatDateHumanShorter(order.dateDelay) 
                        : "Не готовий")
                  }
                </div>
              </div>
          </li>
          {/* Доставка */}
          <li>
              <div className={`icon ${deliveryStatus.icon}`}>
                <span className="icon-shipping font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Доставка</div>
                <div className={`badge-content ${deliveryStatus.bg}`}>
                  {formatDateHuman(order.realizationDate) || "Не доставлено"}
                </div>
              </div>
          </li>

        </ul>
      </div>
    </div>
// КРОК 2: Закриваємо React.memo
)
});