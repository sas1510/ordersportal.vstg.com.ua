// ================= OrderDetails.jsx =================
import React from "react";
import { formatDateHuman, formatDateHumanShorter, formatDate } from '../../utils/formatters';

export default function OrderDetailsMobile({ order }) {
  const isEmpty = (val) => val === undefined || val === null || String(val).trim() === "";

  const paymentDue = () => {
    if (isEmpty(order.amount) || isEmpty(order.paid)) return 0;
    return parseFloat(order.amount) - parseFloat(order.paid);
  };

  const getStatusStyle = (status) => {
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
      case "Доставлено":
      
        return "text-success";
      default:
        return "text-danger";
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  };

  const getDateStatus = (plannedStr, actualStr) => {
    const planned = parseDate(plannedStr);
    const actual = parseDate(actualStr);
    const today = new Date();

    if (!planned && !actual) return { icon: "text-danger", bg: "background-warning-light" };
    if (actual) return { icon: "text-success", bg: "background-success-light" };
    if (planned && planned < today) return { icon: "text-danger", bg: "background-warning-light" };
    return { icon: "text-warning", bg: "background-warning-light" };
  };

  // Дані для етапів
  const stages = [
    {
      id: "order",
      title: "Замовлення",
      icon: "icon-news",
      date: order.date,
      status: isEmpty(order.date) ? "text-danger" : "text-success",
      bg: isEmpty(order.date) ? "background-danger-light" : "background-success-light",
      content: order.date || "Немає дати"
    },
    {
      id: "payment",
      title: "Оплата",
      icon: "icon-coin-dollar",
      status: paymentDue() > 0 ? "text-danger" : "text-success",
      bg: paymentDue() > 0 ? "background-danger-light" : "background-success-light",
      content: paymentDue() > 0 ? `Борг: ${paymentDue()}` : "Сплачено"
    },
    {
      id: "confirmation",
      title: "Підтвердження",
      icon: "icon-clipboard",
      status: isEmpty(order.status) ? "text-danger" : getStatusStyle(order.status),
      bg: isEmpty(order.status) ? "background-danger-light" : "background-success-light",
      content: order.status || "Не підтверджено"
    },
    {
      id: "production",
      title: "Виробництво",
      icon: "icon-cogs",
      factDate: order.factStartProduction,
      planDate: order.planProduction,
      // planDateMax: order.planProductionMax,
      status: getDateStatus(order.planProductionMax, order.factStartProduction),
      getContent: () => {
        if (order.factStartProduction) {
          return formatDateHuman(order.factStartProduction);
        }
        if (order.planDate) {
          return (
            <div className="flex flex-col gap-1">
              <div className="text-grey font-size-11">Планово:</div>
              <div className="font-size-12">{formatDateHumanShorter(order.planDate)}</div>
            </div>
          );
        }
        return "Немає даних";
      }
    },
    {
      id: "ready",
      title: "Готовність",
      icon: "icon-layers2",
      status: getDateStatus(order.planReadyMax, order.factReady),
      content: formatDateHuman(order.factReady) || "Немає даних"
    },
    {
      id: "delivery",
      title: "Доставка",
      icon: "icon-shipping",
      status: getDateStatus(order.planDelivery, order.realizationDate),
      content: formatDateHuman(order.realizationDate) || "Не доставлено"
    }
  ];

  return (
    <div className="order-item-details flex flex-col gap-3 w-full">

      {/* ============ MOBILE VERSION - Cards ============ */}
      <div className="md:hidden flex flex-col gap-3 w-full">
        {stages.map((stage, index) => {
          const isCompleted = stage.status?.icon === "text-success" || stage.status === "text-success";
          const isWarning = stage.status?.icon === "text-warning" || stage.status === "text-warning";
          const isDanger = stage.status?.icon === "text-danger" || stage.status === "text-danger";

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {index < stages.length - 1 && (
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
                  <span className={`${stage.icon} font-size-18 ${stage.status?.icon || stage.status}`}></span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-size-13 font-weight-bold text-dark mb-1">
                    {stage.title}
                  </div>
                  <div className="font-size-12 text-grey">
                    {stage.getContent ? stage.getContent() : stage.content}
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

        {/* Mobile summary bar
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-size-11 text-grey mb-1">Виконано</div>
              <div className="font-size-16 font-weight-bold text-success">
                {stages.filter(s => s.status?.icon === "text-success" || s.status === "text-success").length}
              </div>
            </div>
            <div>
              <div className="font-size-11 text-grey mb-1">В процесі</div>
              <div className="font-size-16 font-weight-bold text-warning">
                {stages.filter(s => s.status?.icon === "text-warning" || s.status === "text-warning").length}
              </div>
            </div>
            <div>
              <div className="font-size-11 text-grey mb-1">Проблеми</div>
              <div className="font-size-16 font-weight-bold text-danger">
                {stages.filter(s => s.status?.icon === "text-danger" || s.status === "text-danger").length}
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}