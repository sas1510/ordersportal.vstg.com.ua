import React from 'react';

const OrderButtons = ({ order }) => {
  return (
    <div className="row gap-14">
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
  );
};

export default OrderButtons;
