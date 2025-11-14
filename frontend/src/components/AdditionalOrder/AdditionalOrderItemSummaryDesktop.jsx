// ================= OrderItemSummary.jsx =================
import React, { useState } from "react";
import OrderDetails from "./OrderDetailsDesktop";
import { formatMoney } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./AdditionalOrderMenu";
import AddClaimModal from "./AddClaimModal";
import AddReorderModal from "./AddReorderModal"; // шлях до твого нового компоненту
import axiosInstance from "../../api/axios";
import OrderDetailsDesktop from './OrderDetailsDesktop';
import OrderDetailsMobile from './OrderDetailsMobile';
// import useWindowWidth from '../../hooks/useWindowWidth';


export default function AdditionalOrderItemSummaryDesktop  ({ order })  {
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

      case "Очікуємо оплату":
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


      case "Готовий":
        state.confirm = false;
        state.pay = false;
        state.reorder = true;
        state.claim = false;
        break;
      
      case "Відвантажений":

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
        <div className="column items-center w-full">   {/* ← ДОДАВ items-center */}
            <div className="text-info font-size-18 border-b border-gray-300 pb-0 pt-0 w-full text-center">
            {order.number}
            </div>
            <div className="text-danger text-center">{order.date}</div>
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
          
          {/* 5. Використовуємо тернарний оператор для "перемикання" */}
   
            <OrderDetailsDesktop order={order} />
   

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