import React from 'react';
import Menu from './Menu';
import OrderItem from '../OrderItem/OrderItem';
import RootHeader from './RootHeader';
import RootFooter from './RootFooter';
import FilterMenu from './FilterMenu';

const RootView = ({ user, orders, menuContent }) => {
  return (
    <div className="portal">
      <RootHeader user={user} menuContent={menuContent} />
      <div className="column gap-14 portal-body">
        <div className="content-wrapper row w-100 h-100">
          <FilterMenu />
          <div className="content" id="content">
            <div className="items-wrapper column gap-14">
              {orders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <RootFooter />
    </div>
  );
};

export default RootView;
