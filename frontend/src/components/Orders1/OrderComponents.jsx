import React, { useState } from "react";
import OrderDetails from "./OrderDetails";

const formatMoney = (amount) => {
  if (amount == null) return "0 грн";
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0
  }).format(amount);
};

// ===================== SubOrderItem =====================
export const SubOrderItem = ({ subOrder }) => {


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "1px",
        backgroundColor: "#fff",
        border: "1px solid #d4d4d4",
        borderRadius: "3px",
        marginBottom: "7px",
        gap: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "15%",
        }}
      >
        <span>📄</span>
        <div>
          <div style={{ color: "#5b9bd5", fontWeight: "bold" }}>
            {subOrder.id}
          </div>
          <div style={{ fontSize: "12px", color: "#7f7f7f" }}>
            {subOrder.date}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }}>Сума: {formatMoney(subOrder.sum)}</div>
    </div>
  );
};

// ===================== OrderItemSummary =====================



export const OrderItemSummary = ({ order, confirmationNodeStyle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);


  const debt = parseFloat(order.sum) - parseFloat(order.paid ?? 0);

  return (
    <div className="order-item flex flex-col w-full gap-0">
      {/* Summary container */}
      <div
        className="order-item-summary flex w-full cursor-pointer items-center gap-4"
        onClick={toggleExpand}
      >
        {/* Icon */}
        <div className="summary-item small row  no-wrap">
          <span className="icon icon-news font-size-20 text-success"></span>
        </div>

        {/* Назва + дата */}
        <div className="summary-item flex-shrink-0 w-36 medium flex-col">
          <div className="column">
            <div className="text-info text-lg border-b border-gray-300 pb-0 pt-0 w-full">
              {order.number}
            </div>
            <div className="text-danger">{order.date}</div>
          </div>
        </div>

        {/* Кількість конструкцій */}
        <div className="summary-item small no-wrap">
          <div className="row gap-5 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order.count}</div>
          </div>
        </div>

        {/* PDF */}
        <div className="summary-item medium no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-document-file-pdf font-size-20 text-red"></div>
            <div>{order.name}.pdf</div>
          </div>
        </div>

        {/* Сума замовлення */}
        <div className="summary-item medium-status flex items-start gap-0 pl-0">
          <span className="icon icon-coin-dollar text-success text-2xl flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-info text-lg">{formatMoney(order.amount)}</div>
            <div className="text-grey text-xs border-t border-dashed mt-1 pt-1">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* Сума боргу */}
        <div className="summary-item medium-status flex items-start gap-0 pl-0">
          <span className="icon icon-coin-dollar text-danger text-2xl flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-danger text-lg ">{formatMoney(order.amount - order.paid)}</div>
            <div className="text-grey text-xs border-t border-dashed mt-1 pt-1">
              Сума боргу
            </div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item medium-status row">
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${confirmationNodeStyle}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Кнопки */}
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

      {/* Деталі замовлення */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t flex w-full border-dashed border-gray-300">
          <OrderDetails order={order} confirmationNodeStyle={confirmationNodeStyle} />
        </div>
      )}
    </div>
  );
};


// ===================== CalculationItem =====================
export const CalculationItem = ({ calc, isExpanded, onToggle }) => {
  // Встановлюємо дефолтні порожні масиви
  const orderList = Array.isArray(calc.order) ? calc.order : [];
  const constructionsList = Array.isArray(calc.constructions) ? calc.constructions : [];

  const orderCount = orderList.length;
  const constructionsCount = constructionsList.length;

  return (
    <div className="calc-item w-full flex flex-col mb-4 p-4 bg-white rounded shadow-sm border-dashed border border-gray-300">
      {/* ================= CALCS SUMMARY ================= */}
      <div className="item-summary flex w-full" onClick={onToggle}>
        <span className="summary-item-icon icon-calculator text-success text-2xl"></span>

        <div className="summary-item medium flex-col">
          <div className="text-info text-lg border-b border-gray-300 pb-0 pt-0 w-full">{`№ ${calc.number}`}</div>
          <div className="text-danger mt-0 mb-0">{calc.date}</div>
        </div>

        <div className="summary-item small justify-center" title="Кількість конструкцій">
          <span className="icon-layout5 text-info text-2xl"></span>
          <div className="text-danger text-xl">{calc.count}</div>
        </div>

        <div className="summary-item small flex-1 justify-center " title="Кількість замовлень">
          <span className="icon-news text-info text-2xl gap-2"></span>
          <div className="text-danger text-xl justify-center">{calc.orderCountInCalc}</div>
        </div>

        <div className="summary-item medium-status" title="Сума прорахунку">
          <span className="icon icon-coin-dollar text-success text-2xl gap-2"></span>
          <div className="text-danger text-lg justify-center">{formatMoney(calc.amount)}</div>
        </div>

        <div className="summary-item large" title="Повідомлення">
          <div className="icon-chat5 text-info text-2xl justify-start"></div>
          <div className="text-grey text-xs flex-1">{calc.message}</div>
        </div>
        <div className="summary-item medium">
          <div className="icon-document-file-numbers text-success text-2xl"></div>
          <div className="summary-item medium" title="Файл">
            {calc.file ? (
              <a 
                href={calc.file} 
                download={`${calc.number}.zkz`} 
                className="text-blue-600 underline"
              >
                {`${calc.number}.zkz`}
              </a>
            ) : (
              <span className="text-gray-400">Немає файлу</span>
            )}
          </div>
        </div>


        <div className="summary-item medium-status flex items-center gap-2">
        <span className="icon-info-with-circle text-info text-2xl flex-shrink-0"></span>
        <div className="text-xs flex flex-wrap gap-2">
          {Object.entries(calc.statuses)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => (
              <span key={status} className="text-danger">
                {status}: {count}
              </span>
            ))
          }
        </div>
      </div>

      </div>
      {/* ================= CALCS SUMMARY ================= */}

      {/* ================= CALCS DETAILS ================= */}
        {isExpanded && (
          <div className="item-details flex flex-col w-full border-t border-dashed border-gray-300 pt-4 pb-4 gap-2">
            {orderCount === 0 ? (
              <div className="order-item flex justify-center text-grey text-lg">
                Ще немає замовлень по цьому прорахунку
              </div>
            ) : (
              <div className="flex flex-col w-full gap-4">
                {orderList.map((order) => (
                  <OrderItemSummary
                    key={order.id}
                    order={order}
                    confirmationNodeStyle="text-success"
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* ================= CALCS DETAILS ================= */}
    </div>
  );
};