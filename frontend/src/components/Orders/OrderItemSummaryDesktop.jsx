// ================= OrderItemSummary.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderDetailsDesktop from './OrderDetailsDesktop';
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./CalculationMenu";
import AddClaimModal from "./AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import axiosInstance from "../../api/axios";
import {formatDateHumanShorter} from '../../utils/formatters'

// КРОК 1: Обгортаємо функціональний компонент у React.memo
export default React.memo(function OrderItemSummaryDesktop  ({ order })  {
//                                ^^^^^^^^^^
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [claimOrderNumber, setClaimOrderNumber] = useState("");

  // 1. Мемоїзація простого обробника стану
  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);

  // 2. Мемоїзація функції, що обчислює доступність кнопок
  const getButtonState = useCallback((status) => {
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
        break;
    }

    return state;
  }, []);

  // 3. Мемоїзація результату обчислення стану кнопок
  const buttonState = useMemo(() => getButtonState(order.status), [order.status, getButtonState]);

  // 4. Мемоїзація функції стилю статусу (для повноти, хоча вона не використовується у JSX напряму, лише для прикладу)
  const getStatusClass = useCallback((status) => {
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
  }, []);

  // 5. Мемоїзація обробників модальних вікон
  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order.number);
    setIsClaimModalOpen(true);
  }, [order.number]);

  const openReorderModal = useCallback(() => {
    setIsReorderModalOpen(true);
  }, []);

  // 6. Мемоїзація обчислення боргу (для використання у JSX)
  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    // Забезпечуємо коректне математичне обчислення, уникаючи помилок плаваючої коми
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100); 
  }, [order.amount, order.paid]);
  
  // 7. Мемоїзація обробника збереження дозамовлення
  const handleReorderSave = useCallback((formData) => {
    console.log("Дозамовлення по замовленню", order.number, formData);
    setIsReorderModalOpen(false);
  }, [order.number]);


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
        <div className="column items-center w-full">
            <div className="text-info font-size-18 border-b border-gray-300 pb-0 pt-0 w-full text-center">
            {order.number}
            </div>
            <div className="text-danger text-center">{formatDateHumanShorter(order.date)}</div>
        </div>
        </div>


        {/* Кількість конструкцій */}
        <div className="summary-item flex items-center w-6  justify-center no-wrap">
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
            <div className="text-danger font-size-18">{formatMoney(debtAmount)}</div>
            <div className="text-grey font-size-12 border-t border-dashed ">
              Сума боргу
            </div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item  w-[140px] row justify-start" >
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${order.statusClass || "text-grey"}`}>{order.status}</div>
          </div>
         </div>

        {/* Кнопки */}
        
        <div className="summary-item row"  onClick={(e) => e.stopPropagation()}>
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
            onClick={openReorderModal} 
          >
            <div className="font-size-12">Дозамовлення</div>
          </button>


          <button
            className={`column align-center button button-last background-danger ${
              !buttonState.claim ? "disabled opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.claim}
            onClick={openClaimModal} 
          >
            <div className="font-size-12">Рекламація</div>
          </button>

        </div>

      </div>

      {/* Деталі замовлення */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t flex w-full border-dashed border-gray-300">
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
        onSave={handleReorderSave}
      />
    </div>
  );
});