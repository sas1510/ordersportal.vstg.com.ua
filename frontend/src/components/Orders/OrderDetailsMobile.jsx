// ================= OrderDetailsMobile.jsx (Optimized with useCallback/useMemo) =================
import React, { useCallback, useMemo } from "react";
import { formatDateHuman, formatDateHumanShorter } from '../../utils/formatters';

export default function OrderDetailsMobile({ order }) {

  // 1. Мемоїзація статичної функції
  const isEmpty = useCallback((val) => val === undefined || val === null || String(val).trim() === "", []);

  // 2. Мемоїзація обчислення оплати
  const paymentDue = useMemo(() => {
    if (isEmpty(order.amount) || isEmpty(order.paid)) return 0;
    const due = parseFloat(order.amount) - parseFloat(order.paid);
    // Обмежуємо точність для коректного порівняння
    return Math.round(due * 100) / 100;
  }, [order.amount, order.paid, isEmpty]);

  // 3. Мемоїзація функції стилю статусу
  const getStatusStyle = useCallback((status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "Підтверджений":
      case "У виробництві":
        return "text-info";
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
      case "Відмова":
        return "text-danger";
      case "Готовий":
      case "Відвантажений":
        return "text-success";
      default:
        return "text-danger";
    }
  }, []);

  // 4. Мемоїзація функції парсингу дати
  const parseDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d; // Використовуємо d.getTime() для надійної перевірки
  }, []);

  // 5. Мемоїзація функції статусу дати
  const getDateStatus = useCallback((plannedStr, actualStr) => {
    const planned = parseDate(plannedStr);
    const actual = parseDate(actualStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!planned && !actual) return { icon: "text-danger", bg: "background-warning-light" };
    if (actual) return { icon: "text-success", bg: "background-success-light" };
    // Порівнюємо лише дати
    if (planned && planned < today) return { icon: "text-danger", bg: "background-warning-light" };
    return { icon: "text-warning", bg: "background-warning-light" };
  }, [parseDate]);


  // 6. Мемоїзація масиву етапів
  const stages = useMemo(() => {
    const isPaymentDue = paymentDue > 0;
    const isOrderDateEmpty = isEmpty(order.date);
    const isOrderStatusEmpty = isEmpty(order.status);
    
    // Функція, яка повертає вміст для етапу виробництва (тепер вона мемоїзована через useMemo)
    const getProductionContent = () => {
        if (order.factProductionMax) {
          return formatDateHuman(order.factProductionMax);
        }
        if (order.planProductionMax) {
          return (
            <div className="flex flex-col gap-1">
              <div className="text-grey font-size-11">Планово:</div>
              <div className="font-size-12">з {formatDateHumanShorter(order.planProductionMin)}</div>
              <div className="font-size-12">по {formatDateHumanShorter(order.planProductionMax)}</div>
            </div>
          );
        }
        return "Немає даних";
    };

    return [
      {
        id: "order",
        title: "Замовлення",
        icon: "icon-news",
        status: isOrderDateEmpty ? "text-danger" : "text-success",
        bg: isOrderDateEmpty ? "background-danger-light" : "background-success-light",
        content: order.date || "Немає дати",
        getContent: () => formatDateHuman(order.date) || "Немає дати"
      },
      {
        id: "payment",
        title: "Оплата",
        icon: "icon-coin-dollar",
        status: isPaymentDue ? "text-danger" : "text-success",
        bg: isPaymentDue ? "background-danger-light" : "background-success-light",
        content: isPaymentDue ? `Борг: ${paymentDue.toLocaleString("uk-UA", { minimumFractionDigits: 2 })}` : "Сплачено",
        getContent: () => isPaymentDue ? `Борг: ${paymentDue.toLocaleString("uk-UA", { minimumFractionDigits: 2 })}` : "Сплачено"
      },
      {
        id: "confirmation",
        title: "Підтвердження",
        icon: "icon-clipboard",
        status: isOrderStatusEmpty ? "text-danger" : getStatusStyle(order.status),
        bg: isOrderStatusEmpty ? "background-danger-light" : "background-success-light",
        content: order.status || "Не підтверджено",
        getContent: () => order.status || "Не підтверджено"
      },
      {
        id: "production",
        title: "Виробництво",
        icon: "icon-cogs",
        status: getDateStatus(order.planProductionMax, order.factProductionMax),
        getContent: getProductionContent // Викликаємо обчислену функцію
      },
      {
        id: "ready",
        title: "Готовність",
        icon: "icon-layers2",
        status: getDateStatus(order.planReadyMax, order.factReadyMax),
        content: formatDateHuman(order.factReadyMax) || "Не готовий",
        getContent: () => formatDateHuman(order.factReadyMax) || "Не готовий"
      },
      {
        id: "delivery",
        title: "Доставка",
        icon: "icon-shipping",
        status: getDateStatus(order.planDelivery, order.realizationDate),
        content: formatDateHuman(order.realizationDate) || "Не доставлено",
        getContent: () => formatDateHuman(order.realizationDate) || "Не доставлено"
      }
    ];
  }, [order, paymentDue, isEmpty, getStatusStyle, getDateStatus]);


  return (
    <div className="order-item-details flex flex-col gap-3 w-full">

      {/* ============ MOBILE VERSION - Cards ============ */}
      <div className="md:hidden flex flex-col gap-3 w-full">
        {stages.map((stage, index) => {
          // Статус тепер є об'єктом {icon, bg} для етапів дати або просто рядком для інших
          const statusIcon = stage.status?.icon || stage.status;
          
          const isCompleted = statusIcon === "text-success";
          const isWarning = statusIcon === "text-warning";
          const isDanger = statusIcon === "text-danger";

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {index < stages.length - 1 && (
                // Увага: перевірка на статус (isCompleted) для лінії може бути корисною,
                // але залишаємо базовий варіант, оскільки це не є частиною оптимізації
                <div className="absolute left-5 top-12 w-0.5 h-8 bg-gray-300 z-0"></div>
              )}

              {/* Stage card */}
              <div className={`relative z-10 flex items-start gap-3 p-3 rounded-lg border ${
                isCompleted ? 'bg-green-50 border-green-200' :
                isDanger ? 'bg-red-50 border-red-200' :
                isWarning ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' :
                  isDanger ? 'bg-red-100' :
                  isWarning ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {/* Використовуємо statusIcon для кольору */}
                  <span className={`${stage.icon} font-size-18 ${statusIcon}`}></span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-size-13 font-weight-bold text-dark mb-1">
                    {stage.title}
                  </div>
                  <div className="font-size-12 text-grey">
                    {/* Викликаємо мемоїзований вміст */}
                    {stage.getContent()} 
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="icon-checkmark text-white font-size-12"></span>
                    </div>
                  )}
                  {isDanger && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="icon-warning text-white font-size-12"></span>
                    </div>
                  )}
                  {isWarning && !isCompleted && !isDanger && (
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="icon-clock text-white font-size-12"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}