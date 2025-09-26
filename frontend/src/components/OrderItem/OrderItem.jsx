import React, { useState } from 'react';
import OrderSummary from './OrderSummary';
import OrderDetails from './OrderDetails';
import OrderButtons from './OrderButtons';

const OrderItem = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleDetails = () => setExpanded(!expanded);

  return (
    <div className="order-item column gap-14 w-100">
      <OrderSummary order={order} onClick={toggleDetails} />
      <OrderButtons order={order} />
      {expanded && <OrderDetails order={order} />}
    </div>
  );
};

export default OrderItem;
