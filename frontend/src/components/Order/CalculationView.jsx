import React from "react";
import OrderView from "./OrderView";
import "../../styles/portal.css";

const CalculationView = ({ calc }) => {
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
  const ifZero = (val) => (val ? val : 0);
  const numToUAMoneyFormat = (num) =>
    new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" }).format(num);

  const items = calc.items || {};
  const itemsKeys = Object.keys(items);

  return (
    <div className="calc-item column">
      {/* SUMMARY */}
      <div className="item-summary row w-100">
        <div className="summary-item row w-2 no-wrap">
          <span className="icon icon-calculator font-size-24 text-success"></span>
        </div>

        <div className="summary-item row w-8 no-wrap">
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calc.name}</div>
            <div className="text-danger">{formatDate(calc["ДатаПросчета"])}</div>
          </div>
        </div>

        <div className="summary-item row w-5 no-wrap">
          <div className="row gap-14 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-24 text-info"></span>
            <div className="font-size-24 text-danger">
              {ifZero(parseInt(calc["КоличествоКонструкцийВПросчете"]))}
            </div>
          </div>
        </div>

        <div className="summary-item row w-5 no-wrap">
          <div className="row gap-14 align-center" title="Кількість замовлень">
            <span className="icon-news font-size-24 text-info"></span>
            <div className="font-size-24 text-danger">{ifZero(itemsKeys.length)}</div>
          </div>
        </div>

        <div className="summary-item row w-12 no-wrap">
          <div className="row gap-14 align-center" title="Сума прорахунку">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="font-size-20 text-danger">{numToUAMoneyFormat(calc.getSum())}</div>
          </div>
        </div>

        <div className="summary-item row w-30">
          <div className="row gap-14 align-center">
            <div className="icon-chat5 font-size-24 text-info"></div>
            <div className="font-size-12 text-grey">{calc["ПросчетСообщения"]}</div>
          </div>
        </div>

        <div className="summary-item row w-10 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-document-file-numbers font-size-24 text-success"></div>
            <div>{calc.name}.zkz</div>
          </div>
        </div>

        <div className="summary-item row w-15 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-info-with-circle font-size-24 text-info"></div>
            <div className="font-size-16 text-danger">Очикують оплату</div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="item-details column gap-14 hidden">
        {itemsKeys.length > 0 ? (
          itemsKeys.map((key) => <OrderView key={key} order={items[key]} />)
        ) : (
          <div className="order-item column gap-14 w-100 align-center">
            <div className="font-size-22 text-grey uppercase float-center">
              Ще немає замовлень по цьому прорахунку
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationView;
