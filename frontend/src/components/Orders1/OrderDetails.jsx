// ================= OrderDetails.jsx =================
import React from "react";
import "../../styles/portal.css";

export default function OrderDetails({
  order,
  paymentNodeStyle,
  paymentCaptionStyle,
  confirmationNodeStyle,
  confirmationCaptionStyle,
  productionNodeStyle,
  productionCaptionStyle,
  readinessNodeStyle,
  readinessCaptionStyle,
  deliveryNodeStyle,
  deliveryCaptionStyle,
}) {
  const formatDate = (dateStr) => dateStr || null;

  const isEmpty = (val) =>
    val === undefined || val === null || String(val).trim() === "";

  return (
    <div className="order-item-details flex w-full column gap-9">
      <div className="timeline flex w-full">
        <ul>
          {/* Замовлення */}
          <li>
            <div className="icon">
              <span
                className={`icon-news font-size-20 ${
                  isEmpty(order["ДатаЗаказа"]) ? "text-danger" : "text-success"
                }`}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Замовлення</div>
              <div className="badge-content background-success-light">
                {formatDate(order["ДатаЗаказа"]) || "Немає дати"}
              </div>
            </div>
          </li>

          {/* Оплата */}
          <li>
            <div className="icon">
              <span
                className={`icon-coin-dollar font-size-22 ${
                  isEmpty(order["СуммаЗаказа"]) ||
                  isEmpty(order["ОплаченоПоЗаказу"])
                    ? "text-danger"
                    : paymentNodeStyle
                }`}
                style={{ transform: "translateY(-1.5px)" }}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Оплата</div>
              <div className={`badge-content ${paymentCaptionStyle}`}>
                {paymentDue(order) > 0
                  ? `Борг: ${paymentDue(order)}`
                  : isEmpty(order["СуммаЗаказа"])
                  ? "Немає даних"
                  : "Сплачено"}
              </div>
            </div>
          </li>

          {/* Підтвердження */}
          <li>
            <div className="icon background-white">
              <span
                className={`icon-clipboard font-size-20 ${
                  isEmpty(order["СостояниеЗаказа"])
                    ? "text-danger"
                    : confirmationNodeStyle
                }`}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Підтвердження</div>
              <div className={`badge-content ${confirmationCaptionStyle}`}>
                {order["СостояниеЗаказа"] || "Не підтверджено"}
              </div>
            </div>
          </li>

          {/* Виробництво */}
          <li>
            <div className="icon background-white">
              <span
                className={`icon-cogs font-size-20 ${
                  isEmpty(order["ФактическаяДатаПроизводстваМакс"]) &&
                  isEmpty(order["ПлановаяДатаПроизводстваМакс"])
                    ? "text-danger"
                    : productionNodeStyle
                }`}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Виробництво</div>
              <div className={`badge-content ${productionCaptionStyle}`}>
                {order["ФактическаяДатаПроизводстваМакс"] ||
                  order["ПлановаяДатаПроизводстваМакс"] ||
                  "Немає даних"}
              </div>
            </div>
          </li>

          {/* Готовність */}
          <li>
            <div className="icon background-white">
              <span
                className={`icon-layers2 font-size-20 ${
                  isEmpty(order["ФактическаяДатаГотовностиМакс"])
                    ? "text-danger"
                    : readinessNodeStyle
                }`}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Готовність</div>
              <div className={`badge-content ${readinessCaptionStyle}`}>
                {order["ФактическаяДатаГотовностиМакс"] || "Не готовий"}
              </div>
            </div>
          </li>

          {/* Доставка */}
          <li>
            <div className="icon background-white">
              <span
                className={`icon-shipping font-size-20 ${
                  isEmpty(order["ДатаРеализации"])
                    ? "text-danger"
                    : deliveryNodeStyle
                }`}
              ></span>
            </div>
            <div className="badge">
              <div className="badge-title">Доставка</div>
              <div className={`badge-content ${deliveryCaptionStyle}`}>
                {order["ДатаРеализации"] || "Не доставлено"}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );

  function paymentDue(order) {
    if (isEmpty(order["СуммаЗаказа"]) || isEmpty(order["ОплаченоПоЗаказу"]))
      return 0;
    return (
      parseFloat(order["СуммаЗаказа"]) - parseFloat(order["ОплаченоПоЗаказу"])
    );
  }
}
