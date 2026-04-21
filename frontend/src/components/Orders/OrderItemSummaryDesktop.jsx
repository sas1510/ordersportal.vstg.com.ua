// ================= OrderItemSummary.jsx (Clean + Optimized) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import {

  formatDateTimeShort

} from "../../utils/formatters";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
// --- МОДАЛКИ ---
import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
import PaymentModal from "./PaymentModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";


export default React.memo(function OrderItemSummaryDesktop({
  order,
  calculationDate,
  onRefresh
}) {
  const { addNotification } = useNotification();

  // =========================== UI STATE ===========================
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  // Додайте це до інших useState на початку компонента
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);



  const windowsIcon = "/assets/icons/WindowsIconCalc.png";
  const listCalcIcon = "/assets/icons/ListCalcIcon.png";
  const moneyGreen = "/assets/icons/MoneyGreen.png";
  const moneyRed = "/assets/icons/MoneyRed.png";
  const fileIcon = "/assets/icons/FileIcon.png";
  const speedIcon = "/assets/icons/SpeedIcon.png";



  const { user } = useAuthGetRole();
  // const isAdmin = role === "admin";
  // ---- ONLY PAYMENT MODAL FLAG ----
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const [claimOrderGuid, setClaimOrderGuid] = useState("");

  // ========================= BUTTON STATES =========================
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  // const getButtonState = useCallback((status) => {
  //   const state = { confirm: false, pay: false, reorder: false, claim: false };

  //   switch (status) {
  //     case "Новий":
  //     case "Очікуємо підтвердження":
  //       state.pay = true;
  //       state.confirm = true;
  //       break;

  //     case "Підтверджений":
  //       state.pay = true;
  //       state.claim = true;
  //       break;

  //     case "Очікуємо оплату":
  //       state.pay = true;
  //       break;

  //     case "Оплачено":
  //     case "Готовий":
  //     case "Відвантажений":
  //       state.pay = true;
  //       state.reorder = true;
  //       if (status === "Відвантажений") state.claim = true;
  //       break;
  //   }

  //   return state;
  // }, []);
  const getButtonState = useCallback((status) => {
    // Всі кнопки за замовчуванням вимкнені
    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };

    // Логіка на основі статусу
    const statusConfig = {
      Новий: { confirm: true, pay: true,  reorder: true },
      "У виробництві" : {pay: true,  reorder: true},
      "Очікуємо підтвердження": { confirm: true, pay: true },
      Підтверджений: { pay: true, confirm: true, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      Оплачено: { pay: true, reorder: true },
      Готовий: { pay: true, reorder: true },
      Відвантажений: { pay: true, reorder: true, claim: true },
    };

    // Якщо статус є в конфігу — застосовуємо значення
    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }

    return state;
  }, []);


    const handleSaveAdditionalOrder = useCallback(async (formData) => {
  setLoading(true); // Тепер цей стейт існує
  try {
    const response = await axiosInstance.post(
      "/additional_orders/save_additional_order/",
      formData
    );

    // Перевірка успіху (враховуючи масив, який ми бачили раніше)
    const result = Array.isArray(response.data) ? response.data[0] : response.data;

    if (result?.success === true || response.status === 201) {
      addNotification("Дозамовлення успішно створено!", "success");
      setIsReorderModalOpen(false); // ВИПРАВЛЕНО: назва функції закриття
      
      // Якщо у вас refreshTrigger приходить з батьківського компонента як пропс, 
      // то використовуйте його. Якщо ні — ця лінія може бути не потрібна тут.
      if (typeof setRefreshTrigger === 'function') {
        setRefreshTrigger((prev) => prev + 1);
      }
    } else {
      addNotification("Помилка: " + (result?.message || "Невідома помилка"), "error");
    }
  } catch (err) {
    console.error("Помилка відправки:", err);
    addNotification("Не вдалося відправити дані: " + (err.response?.data?.message || err.message), "error");
  } finally {
    setLoading(false);
  }
}, [addNotification, setIsReorderModalOpen]); // Додано залежності

  // ========================= DEBT =========================
  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  const buttonState = useMemo(() => {
    const state = getButtonState(order.status);

    // Блокувати оплату, якщо борг 0
    if (debtAmount <= 0) {
      state.pay = false;
    }

    return state;
  }, [order.status, debtAmount, getButtonState]);

  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "У виробництві":

        return "text-WS---DarkBlue";
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
      case "Відмова":
        return "text-WS---DarkRed";
      case "Підтверджений":
      case "Готовий":
      case "Відвантажений":
        return "text-WS---DarkGreen";

      default:
        return "text-WS---DarkGrey";
    }
  }, []);

  // ========================= MODAL OPENERS =========================

  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order.number);
    setClaimOrderGuid(order.idGuid); // ✅ ОСЬ ТУТ
    setIsClaimModalOpen(true);
  }, [order.number, order.idGuid]);

  const openReorderModal = useCallback(() => {
    setIsReorderModalOpen(true);
  }, []);

  const openConfirmModal = useCallback((e) => {
    e.stopPropagation();
    setIsConfirmModalOpen(true);
  }, []);

  const openFilesModal = useCallback((e) => {
    e.stopPropagation();
    setIsFilesModalOpen(true);
  }, []);

  // ========================= PAYMENT OPEN =========================

  const openPaymentModal = useCallback((e) => {
    e.stopPropagation();
    setIsPaymentOpen(true); // А ВСЕ ЗАВАНТАЖЕННЯ В МОДАЛЦІ!
  }, []);

  // ========================= CONFIRM PAYMENT =========================
  const handlePaymentConfirm = async (contractID, amount) => {
    console.log("ОПЛАТА:", { contractID, amount, orderID: order.id });

    try {
      await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: order.idGuid,
        amount: Number(amount),
      });

      addNotification("Оплату успішно виконано!", "success");
      setIsPaymentOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      addNotification("Помилка при виконанні оплати", "error");
    }
  };

  // ========================= CONFIRM ORDER =========================
  const handleConfirmOrder = useCallback(async () => {
    try {
      const response = await axiosInstance.post(
        `/orders/${order.idGuid}/confirm/`,
      );

      if (response.status === 200 || response.status === 204) {
        addNotification(
          `Замовлення ${order.number} успішно підтверджено!`,
          "success",
        );
      }


      if (onRefresh) onRefresh();

      
    } catch (error) {
      addNotification(`Помилка підтвердження: ${error.message}`, "error");
    }
  }, []);

  const dateDiffStatus = useMemo(() => {
    // Перевіряємо наявність обох дат
    if (!order.date || !calculationDate) return null;

    const d1 = new Date(calculationDate);
    const d2 = new Date(order.date);

    // Різниця в мілісекундах перетворена в дні
    const diffInDays = (d2 - d1) / (1000 * 60 * 60 * 24);

    // Якщо замовлення зроблено протягом 24 годин (<= 1 дня) — true (радісний)
    return diffInDays <= 1;
  }, [order.date, calculationDate]);

  return (
    <div className="order-item flex flex-col w-full gap-0">
      {/* --- SUMMARY ROW --- */}
      <div
        className="order-item-summary flex w-full cursor-pointer items-center"
        onClick={toggleExpand}
      >
        {/* ICON */}
        <div className="summary-item row no-wrap !border-r-0 !pr-0">
            <img 
                  src={listCalcIcon} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
        </div>

        {/* NUMBER + DATE */}
        <div className="text-WS---DarkGrey summary-item row no-wrap">
          <div className="column items-start w-full">
            <div className="text-[15px]  text-bold border-bottom w-full ">
              {order.number}
            </div>
            <div className=" text-start text-[11px]  mb-1">
              {/* {formatDateHumanShorter(order.date)} */}
              {formatDateTimeShort(order.createDate)}
            </div>
          </div>
        </div>

        {/* COUNT */}
        <div className="summary-item flex items-center w-8 justify-center">
          <div className="row gap-5 align-center">
                 <img 
                  src={windowsIcon} 
                  // alt="Вікно" 
                  className="align-center mr-1 w-[25px] h-[25px]" 
                
                />
            <div className="font-size-16 text-WS---DarkBlue">{order.count}</div>
          </div>
        </div>

        {/* FILES */}
        <div
          className="summary-item flex w-10 items-start justify-start cursor-pointer w-full  "
          onClick={openFilesModal}
        >
          <div className="row gap-1 align-center">
            <img 
                src={fileIcon} 
                // alt="Вікно" 
                className="align-center mr-0.5 w-[20px] h-[25px]" 
              
              />
            <div className="text-WS---DarkGrey text-[13px] underline">Файли</div>
          </div>
        </div>

        {/* AMOUNT */}
        <div className="summary-item row no-wrap">
                 <img 
                  src={moneyGreen} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
          <div className="flex flex-col flex-1 ml-1">
            <div className="text-WS---DarkGreen font-bold text-[14px]">
              {formatMoney2(order.amount, order.currency)}
            </div>
            <div className="text-grey font-size-12 border-t border-dashed">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* DEBT */}
        <div className="summary-item row no-wrap">
          <img 
                  src={moneyRed} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
          <div className="flex flex-col flex-1 ml-1">
            <div className="text-WS---DarkRed font-bold text-[14px]">
              {formatMoney2(debtAmount, order.currency)}
            </div>
            <div className="text-grey font-size-12 border-t border-dashed">
              Сума боргу
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="summary-item row justify-start">
          <div className="row gap-14 align-center">
            {/* Замінюємо 'text-info' на динамічний клас статусу */}
            <span className={`icon-info-with-circle font-size-20 ${getStatusClass(order.status)}`}></span>
            
            <div className={`font-size-12 ${getStatusClass(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="summary-item row grid-buttons" onClick={(e) => e.stopPropagation()}>
  {user?.role !== "admin" && (
    <>
      {/* CONFIRM */}
      <button
        className={`column align-center button bg-WS---DarkGrey ${
          !buttonState.confirm ? "disabled opacity-50" : ""
        }`}
        disabled={!buttonState.confirm}
        onClick={openConfirmModal}
      >
        <div className="font-size-12">Підтвердити</div>
      </button>

      {/* PAY */}
      <button
        className={`column align-center button bg-WS---DarkGreen  ${
          !buttonState.pay ? "disabled opacity-50" : ""
        }`}
        disabled={!buttonState.pay}
        onClick={openPaymentModal}
      >
        <div className="font-size-12">Сплатити</div>
      </button>
    </>
  )}

  {/* REORDER */}
  <button
    className={`column align-center button bg-WS---DarkBlue ${
      !buttonState.reorder ? "disabled opacity-50" : ""
    }`}
    disabled={!buttonState.reorder}
    onClick={openReorderModal}
  >
    <div className="font-size-12">Дозамовлення</div>
  </button>

  {/* CLAIM */}
  <button
    className={`column align-center button bg-WS---DarkRed ${
      !buttonState.claim ? "disabled opacity-50" : ""
    }`}
    disabled={!buttonState.claim}
onClick={openClaimModal}
  >
    <div className="font-size-12">Рекламація</div>
  </button>
</div>

        {/* SMILEY COLUMN */}
      <div
        className="summary-item flex items-center justify-center w-4"
        title={
          dateDiffStatus
            ? "Швидке оформлення"
            : "Замовлення оформлено пізніше ніж через добу"
        }
      >
        {/* Переконуємося, що батьківський div має flex для центрування */}
        <div className="font-size-24 flex items-center justify-center">
          {dateDiffStatus === null ? null : (
            /* Використовуємо тег <img /> замість <i> */
            <img 
              src={speedIcon} 
              alt="Speed Icon"
              // Налаштовуємо розмір (десь 24px, щоб відповідало попередньому font-size-24)
              style={{ width: '24px', height: '24px' }}
              className={`
                ${dateDiffStatus ? "color-green-icon pulse-animation-img" : "color-red-icon"}
              `}
            />
          )}
        </div>
      </div>
      </div>

      {/* DETAILS */}
      {isExpanded && (
        <div className="separator-border w-full">
          <OrderDetailsDesktop order={order} />
        </div>
      )}

      {/* FILES MODAL */}
      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order.idGuid}
          onClose={() => setIsFilesModalOpen(false)}
        />
      )}

      {/* CONFIRM ORDER */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Підтвердження замовлення"
        message={`Ви впевнені, що хочете підтвердити замовлення ${order.number}?`}
        confirmText="Підтвердити"
        type="success"
      />

      {/* CLAIM */}
      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        initialOrderNumber={claimOrderNumber}
        initialOrderGUID={claimOrderGuid}
      />

      {/* REORDER */}
      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        initialOrderNumber={order.number}
        onSave={handleSaveAdditionalOrder}
      />

      {/* PAYMENT */}
      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.id,
            CurrencyName: order.currency,
          }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
});
