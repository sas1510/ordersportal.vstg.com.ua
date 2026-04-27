import React, { useState, useMemo, useCallback } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import axiosInstance from "../../api/axios";

// Модальні вікна
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import ConfirmModal from "../Orders/ConfirmModal";
import PaymentModal from "../Orders/PaymentModal";
import OrderFilesModal from "../Orders/OrderFilesModal"; // Переконайся, що шлях правильний
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

export default function AdditionalOrderItemSummaryDesktop({ order, onRefresh }) {
  // =========================== UI STATE ===========================
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const { addNotification } = useNotification();

  const listCalcIcon = "/assets/icons/ListCalcIcon.png";
  const moneyGreen = "/assets/icons/MoneyGreen.png";
  const moneyRed = "/assets/icons/MoneyRed.png";
  const fileIcon = "/assets/icons/FileIcon.png";
    const windowsIcon = "/assets/icons/WindowsIconCalc.png";

  const { user } = useAuthGetRole();
  // const isAdmin = role === "admin";

  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  // ========================= BUTTON LOGIC =========================
  const getButtonState = useCallback((status) => {
    const state = { confirm: false, pay: false, reorder: false, claim: false };

    const statusConfig = {
      Новий: { confirm: true, pay: true },
      "Очікуємо підтвердження": { confirm: true, pay: true },
      Підтверджений: { pay: true, confirm: false, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      "У виробництві" : { pay: true },
      Оплачено: { pay: false, reorder: true },
      Готовий: { pay: true, reorder: true },
      Відвантажено: { pay: true, reorder: true, claim: true },
    };

    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }
    return state;
  }, []);

  const buttonState = useMemo(() => {
    const state = getButtonState(order.status);
    if (debtAmount <= 0) state.pay = false;
    return state;
  }, [order.status, debtAmount, getButtonState]);

  const getStatusClass = (status) => {
     switch (status) {
          case "Новий":
    
    
            return "text-WS---DarkBlue";
            
          case "Очікуємо підтвердження":
            return "text-WS---Orange";
          case "Очікуємо оплату":
            return "text-WS---DarkRed";
    
          case "Підтверджений":
            return "text-WS---DarkGrey";
    
          case "У виробництві":
            return "text-WS---DarkBlueProfile"
          case "В обробці":
          case "В роботі":
             return "text-WS---MiddleGreen";
    
    
          case "Відмова":
            return "text-WS---MiddleGrey";
    
          case "Готовий":
            return "text-WS---DarkGreen";
          case "Відвантажено":
            return "text-WS---DarkPurple";
    
          default:
            return "text-WS---MiddleGrey ";
        }
  };

  // ========================= HANDLERS =========================
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const openFilesModal = (e) => {
    e.stopPropagation(); // Щоб не спрацьовувало розгортання рядка
    setIsFilesModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    try {
       const response = await axiosInstance.post(
        `/orders/${order.guid}/confirm/`,
      );
      if (response.status === 200 || response.status === 204) {
        addNotification(`Замовлення ${order.number} підтверджено!`, "success");
        setIsConfirmModalOpen(false);
      }


      if (onRefresh) onRefresh();
    } catch (error) {
      addNotification(`Помилка: ${error.message}`, "error");
    }
  };

  const handlePaymentConfirm = async (contractID, amount) => {
    try {
      await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: order.guid,
        amount: Number(amount),
      });
      addNotification("Оплату виконано!", "success");
      
      setIsPaymentOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      addNotification("Помилка виконання оплати", "error");
    }
  };

  return (
    <div className="order-item flex flex-col w-full gap-0 !border-0">
      <div
        className="order-item-summary flex w-full cursor-pointer items-center !border-0 "
        onClick={toggleExpand}
      >
        <div className="summary-item row no-wrap !border-r-0 !pr-0">
          <img 
              src={listCalcIcon} 
              // alt="Вікно" 
              className="align-center mr-0.5" 
            
            />
        </div>

        {/* Номер та Дата */}
        <div className="text-WS---DarkGrey summary-item row no-wrap">
          <div className="column items-center w-full">
            <div className="text-[15px]  text-bold border-bottom w-full ">
              {order.number}
            </div>
            <div className=" text-start text-[11px]  mb-1">{order.date}</div>
          </div>
        </div>

        {/* Кількість */}
        <div className="summary-item flex items-center w-6 justify-center no-wrap">
          <div className="row gap-5 align-center">
             <img 
                  src={windowsIcon} 
                  // alt="Вікно" 
                  className="align-center mr-1 w-[25px] h-[25px]" 
                
                />
            <div className="font-size-20 text-WS---DarkBlue">{order.count}</div>
          </div>
        </div>

        {/* ФАЙЛИ - ТЕПЕР ПРАЦЮЄ */}
        <div
          className="summary-item flex w-10 items-center justify-center no-wrap cursor-pointer"
          onClick={openFilesModal}
        >
          <div className="row w-full h-full align-center  p-1  hover:bg-gray-200 transition-colors">
            <img 
                src={fileIcon} 
                // alt="Вікно" 
                className="align-center mr-0.5 w-[20px] h-[25px]" 
              
              />
            <div className="text-WS---DarkGrey underline font-size-14">Файли</div>
          </div>
        </div>

        {/* Сума */}
        <div className="summary-item row flex no-wrap gap-1 pl-0">
            <img 
                  src={moneyGreen} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-WS---DarkGreen font-bold text-[14px]">
              {formatMoney2(order.amount, order.currency)}
            </div>
            <div className="text-grey text-[8px]">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* Борг */}
        <div className="summary-item row flex no-wrap gap-1 pl-0">
          <img 
            src={moneyRed} 
            // alt="Вікно" 
            className="align-center mr-0.5" 
          
          />
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-WS---DarkRed font-bold text-[14px]">
              {formatMoney2(debtAmount, order.currency)}
            </div>
            <div className="text-grey text-[8px]">
              Сума боргу
            </div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item w-[180px] row justify-start no-wrap">
          <div className="row gap-14 align-center">
            <span className={`icon-info-with-circle font-size-20 ${getStatusClass(order.status)}`}></span>
            <div className={`text-[12px] ${getStatusClass(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Кнопки дій */}
<div className="flex flex-col gap-1.5 w-fit p-1" onClick={(e) => e.stopPropagation()}>
  
  {/* Верхній ряд: Підтвердити та Сплатити */}
  {user?.role !== "admin" && (
    <div className="flex gap-1.5">
      <button
        className={`flex-1 min-w-[100px] py-[3px] px-2 rounded-[5px] text-white bg-WS---DarkGrey transition-all active:scale-95 ${
          !buttonState.confirm ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
        }`}
        disabled={!buttonState.confirm}
        onClick={() => setIsConfirmModalOpen(true)}
      >
        <div className="text-[12px] font-bold text-center">Підтвердити</div>
      </button>

      <button
        className={`flex-1 min-w-[100px] py-[3px] px-2 rounded-[5px] text-white bg-WS---DarkGreen transition-all active:scale-95 ${
          !buttonState.pay ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
        }`}
        disabled={!buttonState.pay}
        onClick={() => setIsPaymentOpen(true)}
      >
        <div className="text-[12px] font-bold text-center">Сплатити</div>
      </button>
    </div>
  )}

  {/* Нижній ряд: Рекламація (не розтягується) */}
  <div className="flex justify-start">
    <button
      className={`min-w-[100px] py-[3px] px-2 rounded-[5px] text-white bg-WS---DarkRed transition-all active:scale-95 ${
        !buttonState.claim ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
      }`}
      disabled={!buttonState.claim}
      onClick={() => {
        setClaimOrderNumber(order.number);
        setIsClaimModalOpen(true);
      }}
    >
      <div className="text-[12px] font-bold text-center">Рекламація</div>
    </button>
  </div>
</div>
      </div>

      {isExpanded && (
        <div style={{width: 'calc(100% + 28px)', marginLeft: '-28px'}} className="order-item-details-container border-t border-dotted border-grey">
        <div className=" pt-1 flex w-full ">
          <OrderDetailsDesktop order={order} />
        </div>
        </div>
      )}

      {/* ================= МОДАЛКИ ================= */}

      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order.guid}
          onClose={() => setIsFilesModalOpen(false)}
        />
      )}

      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        initialOrderNumber={claimOrderNumber}
        initialOrderGUID={order.guid}
      />

      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        initialOrderNumber={order.number}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Підтвердження замовлення"
        message={`Ви впевнені, що хочете підтвердити замовлення ${order.number}?`}
        confirmText="Підтвердити"
        type="success"
      />

      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.guid,
          }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
}
