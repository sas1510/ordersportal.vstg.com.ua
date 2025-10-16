// ================= OrderItemSummary.jsx =================
import React, { useState } from "react";
import OrderDetails from "./OrderDetails";
import { formatMoney } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./CalculationMenu";
import AddClaimModal from "./AddClaimModal";
import AddReorderModal from "./AddReorderModal"; // шлях до твого нового компоненту
import axiosInstance from "../../api/axios";


export const OrderItemSummary = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const toggleExpand = () => setIsExpanded(!isExpanded);
  const getButtonState = (status) => {
    // Мапа доступності кнопок за статусом
    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };

    switch (status) {
      case "Новий":
        state.confirm = true;
        state.pay = false;
        state.reorder = false;
        state.claim = false;
        break;

      case "Підтверджений":
        state.confirm = false;
        state.pay = true;
        state.reorder = false;
        state.claim = true;
        break;

      case "Очикуємо оплату":
        state.confirm = false;
        state.pay = true;
        state.reorder = false;
        state.claim = false;
        break;

      case "Оплачено":
        state.confirm = false;
        state.pay = false;
        state.reorder = true;
        state.claim = false;
        break;

      case "Відвантажений":
      case "Готовий":
        state.confirm = false;
        state.pay = false;
        state.reorder = true;
        state.claim = true;
        break;

      case "Відмова":
        state.confirm = false;
        state.pay = false;
        state.reorder = false;
        state.claim = false;
        break;

      default:
        break;
    }

    return state;
  };

  const buttonState = getButtonState(order.status);

  const getStatusClass = (status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "У виробництві":
      case "Підтверджений":
        return "text-info";
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
      case "Відмова":
        return "text-danger";
      case "Готовий":
      case "Відвантажений":
        return "text-success";
      default:
        return "text-grey";
    }
  };

  const openClaimModal = () => {
    setClaimOrderNumber(order.name || order.number); // автоматично підставляємо номер
    setIsClaimModalOpen(true);
  };

  const openReorderModal = () => {
    setIsReorderModalOpen(true);
  };


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
        <div className="summary-item row w-9 no-wrap">
          <div className="column">
            <div className="text-info font-size-18 border-b border-gray-300 pb-0 pt-0 w-full">
              {order.number}
            </div>
            <div className="text-danger">{order.date}</div>
          </div>
        </div>

        {/* Кількість конструкцій */}
        <div className="summary-item flex items-center w-6  justify-center no-wrap">
          <div className="row gap-5 align-center" title="Кількість конструкцій">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order.count}</div>
          </div>
        </div>



        {/* PDF */}
        <div className="summary-item flex w-10 items-center justify-center no-wrap" onClick={(e) => e.stopPropagation()}>
          <div className="row gap-14 align-center">
            <div className="icon-document-file-pdf font-size-20 text-red"></div>
            <div>{order.name}.pdf</div>
          </div>
        </div>


        {/* Сума замовлення */}
        <div className="summary-item row w-12 no-wrap gap-0 pl-0">
          <span className="icon icon-coin-dollar text-success font-size-16 flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-info font-size-18">{formatMoney(order.amount)}</div>
            <div className="text-grey font-size-12 border-t border-dashed ">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* Сума боргу */}
        <div className="summary-item row w-12 no-wrap gap-0 pl-0">
          <span className="icon icon-coin-dollar text-danger font-size-16 flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-danger  font-size-18">{formatMoney(order.amount - (order.paid ?? 0))}</div>
            <div className="text-grey  font-size-12 border-t border-dashed ">
              Сума боргу
            </div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item  w-[140px] row justify-start" >
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${order.statusClass || "text-grey"}`}>{order.status}</div>
          </div>
        </div>

        {/* Кнопки */}
        
        <div className="summary-item row"  onClick={(e) => e.stopPropagation()}>
          <button
            className={`column align-center button button-first background-success ${
              !buttonState.confirm ? "disabled opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.confirm}
          >
            <div className="font-size-12">Підтвердити</div>
          </button>

          <button
            className={`column align-center button background-warning ${
              !buttonState.pay ? "disabled opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.pay}
          >
            <div className="font-size-12">Сплатити</div>
          </button>

          <button
            className={`column align-center button background-info ${
              !buttonState.reorder ? "disabled opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.reorder}
            onClick={(e) => {
              e.stopPropagation(); // щоб клік не розкривав деталі замовлення
              openReorderModal();
            }}
          >
            <div className="font-size-12">Дозамовлення</div>
          </button>


          <button
            className={`column align-center button button-last background-danger ${
              !buttonState.claim ? "disabled opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.claim}
            onClick={(e) => {
              e.stopPropagation();
              setClaimOrderNumber(order.number); // номер для модалки
              setIsClaimModalOpen(true);
            }}
          >
            <div className="font-size-12">Рекламація</div>
          </button>

        </div>

      </div>

      {/* Деталі замовлення */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t flex w-full border-dashed border-gray-300">
          <OrderDetails order={order} />
        </div>
      )}

      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSave={() => setIsClaimModalOpen(false)}
        initialOrderNumber={claimOrderNumber}
      />

      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        onSave={(formData) => {
          console.log("Дозамовлення по замовленню", order.number, formData);
          setIsReorderModalOpen(false);

          // Тут можеш додати axios.post на сервер, щоб відправити дозамовлення
        }}
      />



    </div>
  );
};

// ================= CalculationItem.jsx =================

export const CalculationItem = ({ calc, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);

  const handleEdit = (updatedCalc) => {
    if (onEdit) onEdit(updatedCalc); // викликаємо метод з PortalOriginal
  };
const handleDownload = async () => {
  try {
    const response = await axiosInstance.get(`/calculations/${calc.id}/download/`, {
      responseType: 'blob', // важливо для файлів
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${calc.number}.zkz`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Помилка при завантаженні файлу:", error);
  }
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
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
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

        <div className="summary-item row w-9 no-wrap">
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calc.number}</div>
            <div className="text-danger">{calc.date}</div>
          </div>
        </div>

        <div className="summary-item row w-6 no-wrap" title="Кількість конструкцій">
          <span className="icon-layout5 font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{calc.constructionsQTY}</div>
        </div>

        <div className="summary-item row w-5 no-wrap" title="Кількість замовлень">
          <span className="icon-news font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{orderList.length}</div>
        </div>

        <div className="summary-item row w-14 no-wrap">
          <div className="row gap-14 align-center">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="column">
              <div className="font-size-18 text-success border-bottom">{formatMoney(calc.amount)}</div>
              <div className="font-size-16 text-danger">{formatMoney(calc.debt)}</div>
            </div>
          </div>
        </div>

      <div className="summary-item expandable row w-30 align-start space-between">
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


<div
  className="summary-item row w-10 no-wrap"
  onClick={(e) => {
    e.stopPropagation();
    console.log("Клікнув на завантаження"); // <- перевір
    handleDownload();
  }}
>

  <div className="row gap-14 align-center">
    <div className="icon-document-file-numbers font-size-24 text-success"></div>
    <div>{calc.number}.zkz</div>
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
       

      <div onClick={(e) => e.stopPropagation()}>
        <CalculationMenu
          calc={calc}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      </div>



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
        orderId={calc.id}            // або calc.PortalOrderId
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
