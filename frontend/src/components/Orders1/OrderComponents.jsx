// ================= OrderItemSummary.jsx =================
import React, { useState } from "react";
import OrderDetails from "./OrderDetails";
import { formatMoney } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./CalculationMenu";


export const OrderItemSummary = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="order-item flex flex-col w-full gap-0">
      {/* Summary container */}
      <div
        className="order-item-summary flex w-full cursor-pointer items-center gap-4"
        onClick={toggleExpand}
      >
        {/* Icon */}
        <div className="summary-item row no-wrap">
          <span className="icon icon-news font-size-20 text-success"></span>
        </div>

        {/* Назва + дата */}
        <div className="summary-item flex-shrink-0 flex-col">
          <div className="column">
            <div className="text-info text-lg border-b border-gray-300 pb-0 pt-0 w-full">
              {order.number}
            </div>
            <div className="text-danger">{order.date}</div>
          </div>
        </div>

        {/* Кількість конструкцій */}
        <div className="summary-item flex items-center justify-center no-wrap">
          <div className="row gap-5 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order.count}</div>
          </div>
        </div>

        {/* PDF */}
        <div className="summary-item flex items-center justify-center no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-document-file-pdf font-size-20 text-red"></div>
            <div>{order.name}.pdf</div>
          </div>
        </div>


        {/* Сума замовлення */}
        <div className="summary-item  flex items-start gap-0 pl-0">
          <span className="icon icon-coin-dollar text-success text-2xl flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-info text-lg">{formatMoney(order.amount)}</div>
            <div className="text-grey text-xs border-t border-dashed ">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* Сума боргу */}
        <div className="summary-item  flex items-start gap-0 pl-0">
          <span className="icon icon-coin-dollar text-danger text-2xl flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-danger text-lg">{formatMoney(order.amount - (order.paid ?? 0))}</div>
            <div className="text-grey text-xs border-t border-dashed ">
              Сума боргу
            </div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item  w-[150px] row justify-start" >
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${order.statusClass || "text-grey"}`}>{order.status}</div>
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
          <OrderDetails order={order} />
        </div>
      )}
    </div>
  );
};

// ================= CalculationItem.jsx =================

export const CalculationItem = ({ calc, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);

  const handleEdit = (calc) => {
  console.log("Редагувати розрахунок:", calc);
  // Тут викликати вашу логіку редагування
};

const handleDelete = async () => {
  if (onDelete) await onDelete(calc.id); // ✅ передаємо id
};


  const handleViewComments = (comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  const orderList = Array.isArray(calc.orders) ? calc.orders : [];

  const getStatusClass = (status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "У виробництві":
      case "Підтверджений":
        return "text-info";
      case "Очикуємо оплату":
      case "Очикуємо підтвердження":
      case "Відмова":
        return "text-danger";
      case "Готовий":
      case "Відвантажений":
        return "text-success";
      default:
        return "text-grey";
    }
  };

  return (
    <div className="calc-item column">
      {/* ============ CALC SUMMARY ============ */}
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        <div className="summary-item row  no-wrap">
          <span className="icon icon-calculator font-size-24 text-success"></span>
        </div>

        <div className="summary-item row w-8 no-wrap">
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calc.number}</div>
            <div className="text-danger">{calc.date}</div>
          </div>
        </div>

        <div className="summary-item row w-5 no-wrap" title="Кількість конструкцій">
          <span className="icon-layout5 font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{calc.constructionsCount}</div>
        </div>

        <div className="summary-item row w-5 no-wrap" title="Кількість замовлень">
          <span className="icon-news font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{orderList.length}</div>
        </div>

        <div className="summary-item row w-12 no-wrap">
          <div className="row gap-14 align-center">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="column">
              <div className="font-size-18 text-success border-bottom">{formatMoney(calc.amount)}</div>
              <div className="font-size-16 text-danger">{formatMoney(calc.debt)}</div>
            </div>
          </div>
        </div>

      <div className="summary-item row w-30 align-start space-between">
          <div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div className="comments-text-wrapper-last">
              {calc.message || "Без коментарів"}
            </div>
            <button
              className="btn-comments"
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(calc.comments || []);
              }}
            >
              💬 Історія коментарів
            </button>
          </div>
        </div>


        <div className="summary-item row w-10 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-document-file-numbers font-size-24 text-success"></div>
            <div>
              {calc.file ? (
                <a href={calc.file} download={`${calc.number}.zkz`} className="text-link">
                  {`${calc.number}.zkz`}
                </a>
              ) : (
                <span className="text-grey">Немає файлу</span>
              )}
            </div>
          </div>
        </div>

        <div className="summary-item row w-15 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-info-with-circle font-size-24 text-info"></div>

            <div className="column gap-3 font-size-12 no-wrap scroll-y">
              {calc.statuses && Object.keys(calc.statuses).length > 0 ? (
                Object.entries(calc.statuses).map(([status, count]) => (
                  <div
                    key={status}
                    className={`row gap-3 left no-wrap calc-status ${getStatusClass(status)}`}
                  >
                    <div>{status}</div>
                    <div>({count})</div>
                  </div>
                ))
              ) : (
                <div className="row gap-3 left no-wrap calc-status text-warning">
                  <div>Новий</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
         <div className="summary-item row w-15 no-wrap"></div>

        <CalculationMenu 
          calc={calc} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
    
      </div>

      {/* ============ CALC DETAILS ============ */}
      {expanded && (
        <div className="item-details column gap-14 mt-2">
          {orderList.length === 0 ? (
            <div className="order-item column gap-14 w-100 align-center">
              <div className="font-size-22 text-grey uppercase float-center">
                Ще немає замовлень по цьому прорахунку
              </div>
            </div>
          ) : (
            orderList.map((order) => (
              <OrderItemSummary key={order.number} order={order} />
            ))
          )}
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={selectedComments} // можна передавати пустий масив, модалка сама підвантажить
        orderId={calc.number}            // або calc.PortalOrderId
        onAddComment={async (text) => {
          try {
            await axiosInstance.post(`/calculations/${calc.number}/add-comment/`, { message: text });
            // оновити локальний стан коментарів
            const res = await axiosInstance.get(`/calculations/${calc.number}/comments/`);
            setSelectedComments(res.data);
          } catch (err) {
            console.error("Помилка при додаванні коментаря:", err);
          }
        }}
      />

    </div>
  );
};
