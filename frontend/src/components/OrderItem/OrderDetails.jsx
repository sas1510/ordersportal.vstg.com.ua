import React from 'react';

const OrderDetails = ({ order }) => {
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';
  const numToUAMoneyFormat = (num) => num.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' });
  const debt = parseFloat(order.СуммаЗаказа || 0) - parseFloat(order.ОплаченоПоЗаказу || 0);

  const getStyle = (value) => value ? 'text-success' : 'text-warning';
  const getCaption = (value) => value ? 'background-success-light' : 'background-warning-light';

  return (
    <div className="order-item-details column gap-14">
      <div className="timeline w-100">
        <ul>
          <li>
            <div className="icon text-success background-white">
              <span className="icon-news font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Замовлення</div>
              <div className="badge-content background-success-light">{formatDate(order.ДатаЗаказа)}</div>
            </div>
          </li>
          <li>
            <div className={`icon ${getStyle(debt)} background-white`}>
              <span className="icon-coin-dollar font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Оплата</div>
              <div className={`badge-content ${getCaption(debt)}`}>
                {debt > 0 ? `Борг: ${numToUAMoneyFormat(debt)}` : 'Сплачено'}
              </div>
            </div>
          </li>
          <li>
            <div className={`icon ${getStyle(order.СостояниеЗаказа)} background-white`}>
              <span className="icon-clipboard font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Підтвердження</div>
              <div className={`badge-content ${getCaption(order.СостояниеЗаказа)}`}>
                {order.СостояниеЗаказа || 'Не підтверджено'}
              </div>
            </div>
          </li>
          <li>
            <div className={`icon ${getStyle(order.ФактическаяДатаПроизводстваМакс)} background-white`}>
              <span className="icon-cogs font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Виробництво</div>
              <div className={`badge-content ${getCaption(order.ФактическаяДатаПроизводстваМакс)}`}>
                {order.ФактическаяДатаПроизводстваМакс
                  ? formatDate(order.ФактическаяДатаПроизводстваМакс)
                  : `Заплановано: ${formatDate(order.ПлановаяДатаПроизводстваМакс)}`}
              </div>
            </div>
          </li>
          <li>
            <div className={`icon ${getStyle(order.ФактическаяДатаГотовностиМакс)} background-white`}>
              <span className="icon-layers2 font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Готовність</div>
              <div className={`badge-content ${getCaption(order.ФактическаяДатаГотовностиМакс)}`}>
                {order.ФактическаяДатаГотовностиМакс ? formatDate(order.ФактическаяДатаГотовностиМакс) : 'Не готовий'}
              </div>
            </div>
          </li>
          <li>
            <div className={`icon ${getStyle(order.ДатаРеализации)} background-white`}>
              <span className="icon-shipping font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Доставка</div>
              <div className={`badge-content ${getCaption(order.ДатаРеализации)}`}>
                {order.ДатаРеализации ? formatDate(order.ДатаРеализации) : 'Не доставлено'}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OrderDetails;
