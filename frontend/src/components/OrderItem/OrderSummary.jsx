import React from 'react';

const OrderSummary = ({ order, onClick }) => {
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';
  const numToUAMoneyFormat = (num) => num.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' });
  const debt = parseFloat(order.СуммаЗаказа || 0) - parseFloat(order.ОплаченоПоЗаказу || 0);

  return (
    <div className="order-item-summary row w-100" onClick={onClick}>
      <div className="summary-item row w-2 no-wrap">
        <span className="icon icon-news font-size-20 text-success"></span>
      </div>
      <div className="summary-item row w-8 no-wrap">
        <div className="column">
          <div className="font-size-16 text-info border-bottom">{order.name}</div>
          <div className="text-danger">{formatDate(order.ДатаЗаказа)}</div>
        </div>
      </div>
      <div className="summary-item row w-5 no-wrap">
        <div className="row gap-14 align-center">
          <span className="icon-layout5 font-size-20 text-info"></span>
          <div className="font-size-20 text-danger">{order.КоличествоКонструкцийВЗаказе || 0}</div>
        </div>
      </div>
      <div className="summary-item row w-10 no-wrap">
        <div className="row gap-14 align-center">
          <div className="icon-document-file-pdf font-size-20 text-red"></div>
          <div>{order.name}.pdf</div>
        </div>
      </div>
      <div className="summary-item row w-10 no-wrap">
        <div className="row gap-14 align-center">
          <span className="icon icon-coin-dollar font-size-20 text-success"></span>
          <div className="column w-100 align-center">
            <div className="font-size-16 text-info">{numToUAMoneyFormat(order.СуммаЗаказа)}</div>
            <div className="font-size-12 text-grey border-top">Сума замовленя</div>
          </div>
        </div>
      </div>
      <div className="summary-item row w-8 no-wrap">
        <div className="row gap-14 align-center">
          <div className="column w-100 align-center">
            <div className="font-size-16 text-danger">{numToUAMoneyFormat(debt)}</div>
            <div className="font-size-12 text-grey border-top">Сума боргу</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
