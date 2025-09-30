// ================= OrderDetails.jsx =================
import React from "react";
import '../../styles/portal.css';
// import '../../assets/icomoon/icomoon.css';



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
  const formatDate = (dateStr) => dateStr || "Дата відсутня";

  return (
    <div className="order-item-details column gap-14">
      <div className="timeline w-100">
        <ul>
          <li>
            <div className={`icon`}>
                <span className="icon-news font-size-20 text-success"></span>
            </div>
            <div className="badge">
                <div className="badge-title">Замовлення</div>
                <div className="badge-content background-success-light">
                {formatDate(order['ДатаЗаказа'])}
                </div>
            </div>
            </li>

         <li>
            <div className={`icon `}>
                <span
                className={`icon-coin-dollar font-size-22 ${paymentNodeStyle}`}
                style={{ transform: "translateY(-1.5px)" }}
                ></span>
            </div>
            <div className="badge">
                <div className="badge-title">Оплата</div>
                <div className={`badge-content ${paymentCaptionStyle}`}>
                {paymentDue(order) > 0 ? `Борг: ${paymentDue(order)}` : "Сплачено"}
                </div>
            </div>
            </li>


          <li>
            <div className={`icon  background-white`}>
              <span className={`icon-clipboard font-size-20 ${confirmationNodeStyle}`}></span>
            </div>
            <div className="badge">
              <div className="badge-title">Підтвердження</div>
              <div className={`badge-content ${confirmationCaptionStyle}`}>
                {order['СостояниеЗаказа'] || "Не підтверджено"}
              </div>
            </div>
          </li>

          <li>
            <div className={`icon  background-white`}>
              <span className={`icon-cogs font-size-20 ${productionNodeStyle}`}></span>
            </div>
            <div className="badge">
              <div className="badge-title">Виробництво</div>
              <div className={`badge-content ${productionCaptionStyle}`}>
                {order['ФактическаяДатаПроизводстваМакс'] || order['ПлановаяДатаПроизводстваМакс']}
              </div>
            </div>
          </li>

          <li>
            <div className={`icon  background-white`}>
              <span className={`icon-layers2 font-size-20 ${readinessNodeStyle}`}></span>
            </div>
            <div className="badge">
              <div className="badge-title">Готовність</div>
              <div className={`badge-content ${readinessCaptionStyle}`}>
                {order['ФактическаяДатаГотовностиМакс'] || "Не готовий"}
              </div>
            </div>
          </li>

          <li>
            <div className={`icon background-white`}>
              <span className={`icon-shipping font-size-20 ${deliveryNodeStyle}`}></span>
            </div>
            <div className="badge">
              <div className="badge-title">Доставка</div>
              <div className={`badge-content ${deliveryCaptionStyle}`}>
                {order['ДатаРеализации'] || "Не доставлено"}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );

  function paymentDue(order) {
    return parseFloat(order['СуммаЗаказа']) - parseFloat(order['ОплаченоПоЗаказу']);
  }
}
