import React from "react";
import "../../styles/portal.css";

const OrderView = ({ order }) => {
  // визначення стилів
  let paymentNodeStyle = "text-danger";
  let paymentCaptionStyle = "background-danger-light";
  if (parseFloat(order["СуммаЗаказа"]) - parseFloat(order["ОплаченоПоЗаказу"]) === 0) {
    paymentNodeStyle = "text-success";
    paymentCaptionStyle = "background-success-light";
  }

  let confirmationNodeStyle = "text-danger";
  let confirmationCaptionStyle = "background-danger-light";
  if (order["СостояниеЗаказа"] === "Подтверждено") {
    confirmationNodeStyle = "text-success";
    confirmationCaptionStyle = "background-success-light";
  }

  let productionNodeStyle = "text-warning";
  let productionCaptionStyle = "background-warning-light";
  if (order["ФактическаяДатаПроизводстваМакс"]) {
    productionNodeStyle = "text-success";
    productionCaptionStyle = "background-success-light";
  }

  let readinessNodeStyle = "text-warning";
  let readinessCaptionStyle = "background-warning-light";
  if (order["ФактическаяДатаГотовностиМакс"]) {
    readinessNodeStyle = "text-success";
    readinessCaptionStyle = "background-success-light";
  }

  let deliveryNodeStyle = "text-warning";
  let deliveryCaptionStyle = "background-warning-light";
  if (order["ДатаРеализации"]) {
    deliveryNodeStyle = "text-success";
    deliveryCaptionStyle = "background-success-light";
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
  const ifZero = (val) => (val ? val : 0);
  const numToUAMoneyFormat = (num) =>
    new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" }).format(num);

  return (
    <div className="order-item column gap-14 w-100">
      {/* SUMMARY */}
      <div className="order-item-summary row w-100">
        <div className="summary-item row w-2 no-wrap">
          <span className="icon icon-news font-size-20 text-success"></span>
        </div>

        <div className="summary-item row w-8 no-wrap">
          <div className="column">
            <div className="font-size-16 text-info border-bottom">{order.name}</div>
            <div className="text-danger">{formatDate(order["ДатаЗаказа"])}</div>
          </div>
        </div>

        <div className="summary-item row w-5 no-wrap">
          <div className="row gap-14 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">
              {ifZero(parseInt(order["КоличествоКонструкцийВЗаказе"]))}
            </div>
          </div>
        </div>

        <div className="summary-item row w-10 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-document-file-pdf font-size-20 text-red"></div>
            <div>{order.name}.pdf</div>
          </div>
        </div>

        <div className="summary-item row w-10 no-wrap">
          <div className="row gap-14 align-center" title="Сума замовленя">
            <span className="icon icon-coin-dollar font-size-20 text-success"></span>
            <div className="column w-100 align-center">
              <div className="font-size-16 text-info">
                {numToUAMoneyFormat(parseInt(order["СуммаЗаказа"]))}
              </div>
              <div className="font-size-12 text-grey border-top">Сума замовленя</div>
            </div>
          </div>
        </div>

        <div className="summary-item row w-8 no-wrap">
          <div className="row gap-14 align-center" title="Сума заборгованості">
            <div className="column w-100 align-center">
              <div className="font-size-16 text-danger">
                {numToUAMoneyFormat(
                  parseFloat(order["СуммаЗаказа"]) - parseFloat(order["ОплаченоПоЗаказу"])
                )}
              </div>
              <div className="font-size-12 text-grey border-top">Сума боргу</div>
            </div>
          </div>
        </div>

        <div className="summary-item row">
          <div className="row gap-14 align-center">
            <div className="icon-info-with-circle font-size-20 text-info"></div>
            <div className={`font-size-14 ${confirmationNodeStyle}`}>
              {order["ЭтапВыполненияЗаказа"]}
            </div>
          </div>
        </div>

        {/* кнопки */}
        <div className="summary-item row">
          <div className="column align-center button button-first background-success">
            <div className="font-size-12">Підтвердити</div>
          </div>
          <div className="column align-center button background-warning">
            <div className="font-size-12">Сплатити</div>
          </div>
          <div className="column align-center button background-info">
            <div className="font-size-12">Дозамовлення</div>
          </div>
          <div className="column align-center button button-last background-danger">
            <div className="font-size-12">Рекламація</div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="order-item-details column gap-14 hidden">
        <div className="timeline w-100">
          <ul>
            <li>
              <div className="icon text-success background-white">
                <span className="icon-news font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Замовлення</div>
                <div className="badge-content background-success-light">
                  {formatDate(order["ДатаЗаказа"]) || "Дата відсутня"}
                </div>
              </div>
            </li>

            <li>
              <div className={`icon ${paymentNodeStyle} background-white`}>
                <span className="icon-coin-dollar font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Оплата</div>
                <div className={`badge-content ${paymentCaptionStyle}`}>
                  {parseFloat(order["СуммаЗаказа"]) - parseFloat(order["ОплаченоПоЗаказу"]) > 0
                    ? "Борг: " +
                      numToUAMoneyFormat(
                        parseFloat(order["СуммаЗаказа"]) - parseFloat(order["ОплаченоПоЗаказу"])
                      )
                    : "Сплачено"}
                </div>
              </div>
            </li>

            <li>
              <div className={`icon ${confirmationNodeStyle} background-white`}>
                <span className="icon-clipboard font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Підтвердження</div>
                <div className={`badge-content ${confirmationCaptionStyle}`}>
                  {order["СостояниеЗаказа"] || "Не підтверджено"}
                </div>
              </div>
            </li>

            <li>
              <div className={`icon ${productionNodeStyle} background-white`}>
                <span className="icon-cogs font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Виробництво</div>
                <div className={`badge-content ${productionCaptionStyle}`}>
                  {order["ФактическаяДатаПроизводстваМакс"]
                    ? formatDate(order["ФактическаяДатаПроизводстваМакс"])
                    : `Заплановано: ${formatDate(order["ПлановаяДатаПроизводстваМакс"])}`}
                </div>
              </div>
            </li>

            <li>
              <div className={`icon ${readinessNodeStyle} background-white`}>
                <span className="icon-layers2 font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Готовність</div>
                <div className={`badge-content ${readinessCaptionStyle}`}>
                  {order["ФактическаяДатаГотовностиМакс"]
                    ? formatDate(order["ФактическаяДатаГотовностиМакс"])
                    : "Не готовий"}
                </div>
              </div>
            </li>

            <li>
              <div className={`icon ${deliveryNodeStyle} background-white`}>
                <span className="icon-shipping font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Доставка</div>
                <div className={`badge-content ${deliveryCaptionStyle}`}>
                  {order["ДатаРеализации"] ? formatDate(order["ДатаРеализации"]) : "Не доставлено"}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderView;
