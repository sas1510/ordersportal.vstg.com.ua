import React from "react";
import OrderItem from "./OrderItem";
import '../../styles/portal.css';

export default function CalculationItem({ calculation, isOpen, onToggle }) {
  // Якщо немає замовлень, показуємо заглушку
  const ordersContent = calculation.items.length
    ? calculation.items.map((order) => <OrderItem key={order.name} order={order} />)
    : (
      <div className="order-item column gap-14 w-100 align-center">
        <div className="font-size-22 text-grey uppercase float-center">
          Ще немає замовлень по цьому прорахунку
        </div>
      </div>
    );

  return (
    <div className="calc-item column">
      {/* ================= CALCULATION SUMMARY ================= */}
      <div className="item-summary row w-100" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="summary-item row w-2 no-wrap">
          <span className="icon icon-calculator font-size-24 text-success"></span>
        </div>
        <div className="summary-item row w-8 no-wrap">
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calculation.name}</div>
            <div className="text-danger">{calculation.date}</div>
          </div>
        </div>
        <div className="summary-item row w-5 no-wrap">
          <div className="row gap-14 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-24 text-info"></span>
            <div className="font-size-24 text-danger">{calculation.items.length}</div>
          </div>
        </div>
        <div className="summary-item row w-12 no-wrap">
          <div className="row gap-14 align-center" title="Сума прорахунку">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="font-size-20 text-danger">{calculation.sum}</div>
          </div>
        </div>
      </div>
      {/* ================= CALCULATION SUMMARY ================= */}

      {/* ================= CALCULATION DETAILS ================= */}
      {isOpen && (
        <div className="item-details column gap-14">
          {ordersContent}
        </div>
      )}
      {/* ================= CALCULATION DETAILS ================= */}
    </div>
  );
}
