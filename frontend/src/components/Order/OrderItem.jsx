// ================= OrderItem.jsx =================
import { useState } from "react";
import OrderDetails from "./OrderDetails"; // окремий компонент для деталей
import '../../styles/portal.css';

export default function OrderItem({ order }) {
  const [showDetails, setShowDetails] = useState(false);

  // Розрахунок стилів для статусів
  const paymentDue = parseFloat(order['СуммаЗаказа']) - parseFloat(order['ОплаченоПоЗаказу']);
  const paymentNodeStyle = paymentDue > 0 ? "text-danger" : "text-success";
  const paymentCaptionStyle = paymentDue > 0 ? "background-danger-light" : "background-success-light";

  const confirmationNodeStyle = order['СостояниеЗаказа'] === 'Подтверждено' ? "text-success" : "text-danger";
  const confirmationCaptionStyle = order['СостояниеЗаказа'] === 'Подтверждено' ? "background-success-light" : "background-danger-light";

  const productionNodeStyle = order['ФактическаяДатаПроизводстваМакс'] ? "text-success" : "text-warning";
  const productionCaptionStyle = order['ФактическаяДатаПроизводстваМакс'] ? "background-success-light" : "background-warning-light";

  const readinessNodeStyle = order['ФактическаяДатаГотовностиМакс'] ? "text-success" : "text-warning";
  const readinessCaptionStyle = order['ФактическаяДатаГотовностиМакс'] ? "background-success-light" : "background-warning-light";

  const deliveryNodeStyle = order['ДатаРеализации'] ? "text-success" : "text-warning";
  const deliveryCaptionStyle = order['ДатаРеализации'] ? "background-success-light" : "background-warning-light";

  const toggleDetails = () => setShowDetails(!showDetails);

  return (
    <div className="order-item column gap-14 w-100">

      {/* ================= ORDER SUMMARY ================= */}
      <div
        className="order-item-summary row w-100"
        style={{ cursor: "pointer" }}
        onClick={toggleDetails}
      >
        {/* Іконка */}
  {/* Іконка (вужча колонка) */}
  <div className=" summary-item-icon row w-1 no-wrap justify-center items-center">
    <span className="icon icon-news font-size-20 text-success"></span>
  </div>



        <div className="summary-item row flex-2 no-wrap">
        <div className="column">
            <div className="font-size-16 text-info border-bottom">{order.name}</div>
            <div className="text-danger">{order['ДатаЗаказа']}</div>
        </div>
        </div>

        <div className="summary-item row flex-1 no-wrap">
        <div className="row gap-14 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order['КоличествоКонструкцийВЗаказе'] || 0}</div>
        </div>
        </div>

        <div className="summary-item row flex-2 no-wrap">
        <div className="row gap-14 align-center" title="Сума замовлення">
            <span className="icon icon-coin-dollar font-size-20 text-success"></span>
            <div className="column w-100 align-center">
            <div className="font-size-16 text-info">{order['СуммаЗаказа']}</div>
            <div className="font-size-12 text-grey border-top">Сума замовлення</div>
            </div>
        </div>
        </div>

        {/* Сума боргу */}
        <div className="summary-item row w-8 no-wrap">
          <div className="row gap-14 align-center" title="Сума заборгованості">
            <div className="column w-100 align-center">
              <div className="font-size-16 text-danger">{paymentDue > 0 ? paymentDue : 0}</div>
              <div className="font-size-12 text-grey border-top">Сума боргу</div>
            </div>
          </div>
        </div>
      </div>
      {/* ================= ORDER SUMMARY ================= */}

      {/* ================= ORDER DETAILS ================= */}
      {showDetails && (
        <OrderDetails
          order={order}
          paymentNodeStyle={paymentNodeStyle}
          paymentCaptionStyle={paymentCaptionStyle}
          confirmationNodeStyle={confirmationNodeStyle}
          confirmationCaptionStyle={confirmationCaptionStyle}
          productionNodeStyle={productionNodeStyle}
          productionCaptionStyle={productionCaptionStyle}
          readinessNodeStyle={readinessNodeStyle}
          readinessCaptionStyle={readinessCaptionStyle}
          deliveryNodeStyle={deliveryNodeStyle}
          deliveryCaptionStyle={deliveryCaptionStyle}
        />
      )}
      {/* ================= ORDER DETAILS ================= */}
    </div>
  );
}
