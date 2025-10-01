import React, { useState } from "react";

// Order Statistics
export const OrderStatistics = ({ constructions, documents, sum, file, status }) => {
  const formatMoney = (amount) => new Intl.NumberFormat('uk-UA').format(amount) + ' грн';

  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span>🔲</span>
        <span style={{ fontWeight: 'bold', color: '#ff0000' }}>{constructions}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span>📄</span>
        <span style={{ fontWeight: 'bold', color: '#ff0000' }}>{documents}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span>💰</span>
        <span style={{ fontWeight: 'bold', color: '#70ad47' }}>{formatMoney(sum)}</span>
      </div>
      {file && <div><span>📁</span> {file}</div>}
      <div style={{ marginLeft: 'auto' }}><span>ℹ️</span> {status}</div>
    </div>
  );
};

// SubOrder
export const SubOrderItem = ({ subOrder }) => {
  const formatMoney = (amount) => new Intl.NumberFormat('uk-UA').format(amount) + ' грн';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      backgroundColor: '#fff',
      border: '1px solid #d4d4d4',
      borderRadius: '3px',
      marginBottom: '7px',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '15%' }}>
        <span>📄</span>
        <div>
          <div style={{ color: '#5b9bd5', fontWeight: 'bold' }}>{subOrder.id}</div>
          <div style={{ fontSize: '12px', color: '#7f7f7f' }}>{subOrder.date}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>Сума: {formatMoney(subOrder.sum)}</div>
    </div>
  );
};

// OrderItem
export const OrderItem = ({ order, isExpanded, onToggle }) => (
  <div style={{
    backgroundColor: '#f9f9f9',
    border: '1px dashed #d4d4d4',
    borderRadius: '3px',
    padding: '10px',
    marginBottom: '10px'
  }}>
    <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '15%' }}>
        <span>📝</span> {order.orderId}
      </div>
      <OrderStatistics
        constructions={order.constructions}
        documents={order.documents}
        sum={order.orderSum}
        file={order.pdf}
        status={order.stage}
      />
    </div>

    {isExpanded && order.subOrders && (
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #d4d4d4' }}>
        {order.subOrders.map(sub => (
          <SubOrderItem key={sub.id} subOrder={sub} />
        ))}
      </div>
    )}
  </div>
);

// CalculationItem
export const CalculationItem = ({ calc, isExpanded, onToggle }) => {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const orderCount = calc.items.length;
  const constructionsCount = calc.constructions.length;

  return (
    <div className="calc-item column mb-4 p-4 bg-white rounded shadow-sm border-dashed border border-gray-300">
      {/* ================= CALCS SUMMARY CONTAINER ================= */}
      <div className="item-summary row w-100 gap-4" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="summary-item small row w-2 no-wrap">
          <span className="icon icon-calculator text-success text-2xl"></span>
        </div>

        <div className="summary-item medium row w-8 no-wrap flex-col">
          <div className="text-info text-lg border-b">{`№ ${calc.id}`}</div>
          <div className="text-danger">{calc.date}</div>
        </div>

        <div className="summary-item  medium row w-5 no-wrap items-center gap-2" title="Кількість конструкцій">
          <span className="icon-layout5 text-info text-2xl"></span>
          <div className="text-danger text-xl">{constructionsCount}</div>
        </div>

        <div className="summary-item medium row w-5 no-wrap items-center gap-2" title="Кількість замовлень">
          <span className="icon-news text-info text-2xl"></span>
          <div className="text-danger text-xl">{orderCount}</div>
        </div>

        <div className="summary-item medium row w-12 no-wrap items-center gap-2" title="Сума прорахунку">
          <span className="icon icon-coin-dollar text-success text-2xl"></span>
          <div className="text-danger text-lg">{calc.sum}</div>
        </div>

        <div className="summary-item medium row w-30 items-center gap-2">
          <div className="icon-chat5 text-info text-2xl"></div>
          <div className="text-grey text-xs">{calc.message}</div>
        </div>

        <div className="summary-item medium row w-10 items-center gap-2">
          <div className="icon-document-file-numbers text-success text-2xl"></div>
          <div>{calc.file}</div>
        </div>

        <div className="summary-item large row w-15 items-center gap-2">
          <div className="icon-info-with-circle text-info text-2xl"></div>
          <div className="text-danger text-base">Очікують оплату</div>
        </div>
      </div>
      {/* ================= CALCS SUMMARY CONTAINER ================= */}

      {/* ================= CALCS DETAILS ================= */}
      {isExpanded && (
        <div className="item-details column gap-4 mt-4 border-t border-dashed border-gray-300 pt-4">
          {orderCount === 0 ? (
            <div className="order-item column gap-4 w-100 text-center text-grey text-lg">
              Ще немає замовлень по цьому прорахунку
            </div>
          ) : (
            calc.items.map(order => (
              <OrderItem
                key={order.orderId}
                order={order}
                isExpanded={!!expandedOrders[order.orderId]}
                onToggle={() => toggleOrder(order.orderId)}
              />
            ))
          )}
        </div>
      )}
      {/* ================= CALCS DETAILS ================= */}
    </div>
  );
};