// ================= OrderItemSummary.jsx =================
import React, { useState } from "react";
// import OrderDetails from "./OrderDetails";
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import AddClaimModal from "./AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from './OrderDetailsMobile';

export default function  OrderItemSummaryMobile ({ order })  {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const getButtonState = (status) => {
    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };

    switch (status) {
      case "Новий":
        state.confirm = true;
        break;
      case "Підтверджений":
        state.pay = true;
        state.claim = true;
        break;
      case "Очікуємо оплату":
        state.pay = true;
        break;
      case "Оплачено":
      case "Готовий":
        state.reorder = true;
        break;
      case "Відвантажений":
        state.reorder = true;
        state.claim = true;
        break;
      default:
        // Всі false за замовчуванням (включаючи "Відмова" тощо)
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
    setClaimOrderNumber(order.name || order.number);
    setIsClaimModalOpen(true);
  };

  const openReorderModal = () => {
    setIsReorderModalOpen(true);
  };

  return (
    <div className="order-item flex flex-col w-full gap-0">
    
      {/* ============ MOBILE VERSION (COMPACT & UPDATED BUTTONS) ============ */}
      <div className="md:hidden flex flex-col w-full p-3 bg-white rounded-lg shadow-sm border border-gray-200"
        onClick={toggleExpand}>
        
        {/* Header - Номер і статус */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-news font-size-18 text-success"></span>
            <div className="text-info font-weight-bold font-size-16">{order.number}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="icon-info-with-circle font-size-16 text-info"></span>
            <div className={`font-size-14 font-weight-medium ${getStatusClass(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Дата і кількість */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <div className="text-danger font-size-18">{order.date}</div>
          <div className="flex items-center gap-1.5">
            <span className="icon-layout5 font-size-18 text-info"></span>
            <span className="font-size-16 text-danger font-weight-medium">{order.count} конст.</span>
          </div>
        </div>

        {/* Фінанси */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon icon-coin-dollar text-success font-size-14"></span>
              <span className="text-grey font-size-16">Сума</span>
            </div>
            <div className="text-info font-size-18 font-weight-bold">
              {formatMoney(order.amount)}
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon icon-coin-dollar text-danger font-size-14"></span>
              <span className="text-grey font-size-16">Борг</span>
            </div>
            <div className="text-danger font-size-18 font-weight-bold">
              {formatMoney(order.amount - (order.paid ?? 0))}
            </div>
          </div>
        </div>

        {/* PDF файл */}
        <div className="flex items-center gap-1.2 p-1.5 bg-gray-50 rounded mb-2"
          onClick={(e) => e.stopPropagation()}>
          <div className="icon-document-file-pdf font-size-16 text-red"></div>
          <div className="font-size-14 text-grey">{order.name}.pdf</div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 py-[2px] -mx-3 px-3 mobile-buttons-scroll"
            onClick={(e) => e.stopPropagation()}>

            <button 
                className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-success text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                disabled={!buttonState.confirm}
            >
                Підтвердити
            </button>

            <button 
                className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-warning text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                disabled={!buttonState.pay}
            >
                Сплатити
            </button>

            <button 
                className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-info text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                disabled={!buttonState.reorder}
                onClick={(e) => {
                e.stopPropagation();
                openReorderModal();
                }}
            >
                Дозамовлення
            </button>

            <button 
                className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-danger text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center mr-3"
                disabled={!buttonState.claim}
                onClick={(e) => {
                e.stopPropagation();
                openClaimModal();
                }}
            >
                Рекламація
            </button>

            </div>

        {/* === КІНЕЦЬ ОНОВЛЕНОГО БЛОКУ === */}


        {/* Індикатор розкриття */}
        <div className="flex justify-center mt-1.5">
          <span className={`icon ${isExpanded ? 'icon-chevron-up' : 'icon-chevron-down'} font-size-12 text-grey`}></span>
        </div>
      </div>

      {/* Деталі замовлення (для обох версій) */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t flex w-full border-dashed border-gray-300">
          <OrderDetailsMobile order={order} />
        </div>
      )}

      {/* Модальні вікна */}
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
        }}
      />
    </div>
  );
};