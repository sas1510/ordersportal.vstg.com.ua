import React, { useState, useMemo, useCallback } from "react";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from "./OrderDetailsMobile";
import {formatDateHumanShorter } from "../../utils/formatters";
// Модальні вікна
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import ConfirmModal from "../Orders/ConfirmModal";
import PaymentModal from "../Orders/PaymentModal";
import OrderFilesModal from "../Orders/OrderFilesModal";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";


export default function AdditionalOrderItemSummaryMobile({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const { addNotification } = useNotification();

  const { user } = useAuthGetRole();
  // const isAdmin = role === "admin";

  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  // ========================= LOGIC =========================
  const getButtonState = useCallback((status) => {
    const state = { confirm: false, pay: false, reorder: false, claim: false };
    const statusConfig = {
      Новий: { confirm: true, pay: true },
      "Очікуємо підтвердження": { confirm: true, pay: true },
      Підтверджений: { pay: true, confirm: true, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      Оплачено: { pay: true, reorder: true },
      Готовий: { pay: true, reorder: true },
      Доставлено: { pay: true, reorder: true, claim: true },
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

  const handleConfirmOrder = async () => {
    try {
      const response = await axiosInstance.post(
        `/additional-orders/${order.guid}/confirm/`,
      );
      if (response.status === 200 || response.status === 204) {
        addNotification(`Замовлення ${order.number} підтверджено!`, "success");
        setIsConfirmModalOpen(false);
      }
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
    } catch {
      addNotification("Помилка виконання оплати", "error");
    }
  };

  
    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";

    const moneyGreen = "/assets/icons/MoneyGreen.png";
    const moneyRed = "/assets/icons/MoneyRed.png";
    const speedIcon = "/assets/icons/SpeedIcon.png";
    const openDetails = "/assets/icons/OpenDetailsOrdersIcon.png";


  return (
    <div className="order-item flex flex-col w-full gap-0 !border-b-0">
      <div
        className="flex flex-col w-full pt-1 "
        onClick={toggleExpand}
      >


                <div className="flex items-stretch justify-between mb-1 w-full gap-3  pb-1 border-bottom ">
                  
                  {/* 1. ЛІВА ЧАСТИНА: Номер та Дата + Бордюр справа */}
                  <div className="flex flex-[2] items-center pr-1  border-right shrink-0">
                     <img src={listCalcIcon} className="align-center mr-2"  alt="" />
                    <div className="flex  flex-col gap-[6px] no-wrap w-full">
          
                      <div className="text-[15px] w-full font-bold pb-1 no-wrap text-WS---DarkGrey border-bottom leading-tight">
                        № {order.number}
                      </div>
                      <div className="text-[11px] text-WS---DarkGrey">
                         {order.date}
                      </div>
                    </div>
                  </div>
        
                    <div className="flex flex-col items-center pt-2 justify-center pr-2 border-right flex-1">
                      <div className="flex items-center gap-2 no-wrap">
                        <img src={windowsIcon} className="align-center mr-2"  alt="" />
                        <span className="font-size-24 font-bold text-WS---DarkBlue">
                          {order.count}
                        </span>
                      </div>
                      <span className="text-grey text-[10px] mt-1">Конструкції</span>
                    </div>
        
                    {/* <div 
                      className="flex items-center gap-2 text-center justify-center pt-2 flex-1 pb-[17px] cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={openFilesModal}
        
                    >
               
                     <img src={fileIcon} className="align-center mr-2"  alt="" />
                    
                      <div className="text-[13px] text-dark">Файли</div>
                    </div> */}

                    <div
          className="flex items-center gap-1.2 p-1.5  mb-2 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            setIsFilesModalOpen(true);
          }}
        >
           <img src={fileIcon} className="align-center mr-2"  alt="" />
          <div className="text-[13px] text-WS---DarkGrey underline">
            Файли
          </div>
        </div>

        
        
        
        
        </div>


             <div className="flex items-stretch justify-between  w-full gap-2   py-2">

          <div className="flex items-center gap-2 pr-1 border-right  flex-1">
            <img src={moneyGreen} className=" mr-1" alt="" />
            <div className="flex flex-col">
              <div className="text-WS---DarkGreen text-[14px] font-bold leading-tight">
                {formatMoney2(order.amount, order.currency)}
              </div>
              <div className="text-grey text-[8px]">Сума замовлення</div>
            </div>
          </div>
        
          {/* 2. Сума боргу */}
          <div className="flex items-center gap-2 px-1  flex-1">
            {/* Тут використовуємо червону іконку монет, якщо вона є, або ту саму */}
            <img src={moneyRed} className="mr-1" alt="" /> 
            <div className="flex flex-col">
              <div className="text-WS---DarkRed  text-[14px] font-bold leading-tight">
                {formatMoney2(debtAmount, order.currency)}
              </div>
              <div className="text-grey text-[8px]">Сума боргу</div>
            </div>
          </div>
        
        
        </div>


                  

        {/* Кнопки дій */}
        <div
          className="flex gap-2 overflow-x-auto pb-1.5 py-[2px] mobile-buttons-scroll"
          onClick={(e) => e.stopPropagation()}
        >
          {user?.role !== "admin" && (
            <>
              <button
                className="grow text-[14px] font-bold text-center shrink-0 h-8 flex items-center justify-center px-3 bg-WS---DarkGrey text-white rounded  whitespace-nowrap disabled:opacity-50"
                disabled={!buttonState.confirm}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Підтвердити
              </button>

              <button
                className="grow shrink-0 text-white font-bold bg-WS---DarkGreen h-8 flex items-center justify-center px-3 rounded text-[14px] whitespace-nowrap disabled:opacity-50"
                disabled={!buttonState.pay}
                onClick={() => setIsPaymentOpen(true)}
              >
                Сплатити
              </button>
            </>
          )}

          <button
            className="grow shrink-0 h-8 flex items-center  font-bold text-center justify-center px-3 bg-WS---DarkRed text-white rounded text-[14px] whitespace-nowrap disabled:opacity-50"
            disabled={!buttonState.claim}
            onClick={() => setIsClaimModalOpen(true)}
          >
            Рекламація
          </button>
        </div>

  <div className="flex justify-center mt-2 cursor-pointer" >
  <img 
    src={openDetails} 
    alt="Деталі"
    className={`block transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}

  />
</div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 w-full border-t border-dotted border-gray-500">
          <OrderDetailsMobile order={order} />
        </div>
      )}

      {/* ================= MODALS ================= */}
      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order.guid}
          onClose={() => setIsFilesModalOpen(false)}
        />
      )}

      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        initialOrderNumber={order.number}
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
        title="Підтвердження"
        message={`Підтвердити замовлення ${order.number}?`}
        confirmText="Так"
        type="success"
      />

      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.guid,
            CurrencyName: order.currency,
          }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
}
