// ================= OrderItemSummary.jsx (Clean + Optimized) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney } from "../../utils/formatMoney";
import AddClaimModal from "../Complaint/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import { formatDateHumanShorter } from "../../utils/formatters";
import { useNotification } from "../notification/Notifications";
// --- МОДАЛКИ ---
import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
import PaymentModal from "./PaymentModal";
import { useAuth } from '../../hooks/useAuth';

export default React.memo(function OrderItemSummaryDesktop({ order }) {

  const { addNotification } = useNotification();

  // =========================== UI STATE ===========================
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
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
      "Новий": { confirm: true, pay: true },
      "Очікуємо підтвердження": { confirm: true, pay: true },
      "Підтверджений": { pay: true,confirm: true,reorder: true},
      "Очікуємо оплату": { pay: true, reorder: true },
      "Оплачено": { pay: true, reorder: true },
      "Готовий": { pay: true, reorder: true },
      "Відвантажений": { pay: true, reorder: true, claim: true },
    };

    // Якщо статус є в конфігу — застосовуємо значення
    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }

    return state;
  }, []);

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
    } catch (error) {
      console.error(error);
      addNotification("Помилка при виконанні оплати", "error");
    }
  };

  // ========================= CONFIRM ORDER =========================
  const handleConfirmOrder = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/orders/${order.idGuid}/confirm/`);

      if (response.status === 200 || response.status === 204) {
        addNotification(`Замовлення ${order.number} успішно підтверджено!`, "success");
      }
    } catch (error) {
      addNotification(`Помилка підтвердження: ${error.message}`, "error");
    }
  }, []);


  // =================================================================
  // ============================== RENDER =============================
  // =================================================================

  return (
    <div className="order-item flex flex-col w-full gap-0">

      {/* --- SUMMARY ROW --- */}
      <div
        className="order-item-summary flex w-full cursor-pointer items-center"
        onClick={toggleExpand}
      >
        {/* ICON */}
        <div className="summary-item row no-wrap">
          <span className="icon icon-news font-size-20 text-success"></span>
        </div>

        {/* NUMBER + DATE */}
        <div className="summary-item row w-9 no-wrap">
          <div className="column items-center w-full">
            <div className="text-info font-size-18 border-b border-gray-300 w-full text-center">
              {order.number}
            </div>
            <div className="text-danger text-center mb-1">
              {formatDateHumanShorter(order.date)}
            </div>
          </div>
        </div>

        {/* COUNT */}
        <div className="summary-item flex items-center w-6 justify-center">
          <div className="row gap-5 align-center">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order.count}</div>
          </div>
        </div>

        {/* FILES */}
        <div
          className="summary-item flex w-10 items-start justify-start cursor-pointer w-full bg-gray-100 rounded-md "
          onClick={openFilesModal}
        >
          <div className="row gap-1 align-center">
            <div className="icon-download font-size-20 text-red"></div>
            <div className="text-info underline">Файли</div>
          </div>
        </div>

        {/* AMOUNT */}
        <div className="summary-item row w-12 no-wrap">
          <span className="icon icon-coin-dollar text-success font-size-16"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-info font-size-18">
              {formatMoney(order.amount)}
            </div>
            <div className="text-grey font-size-12 border-t border-dashed">
              Сума замовлення
            </div>
          </div>
        </div>

        {/* DEBT */}
        <div className="summary-item row w-12 no-wrap">
          <span className="icon icon-coin-dollar text-danger font-size-16"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-danger font-size-18">
              {formatMoney(debtAmount)}
            </div>
            <div className="text-grey font-size-12 border-t border-dashed">
              Сума боргу
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="summary-item w-[140px] row justify-start">
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${getStatusClass(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="summary-item row" onClick={(e) => e.stopPropagation()}>
 
           {user.role !== "admin" && (
                <>
                  {/* CONFIRM */}
                  <button
                    className={`column align-center button button-first background-success ${
                      !buttonState.confirm ? "disabled opacity-50" : ""
                    }`}
                    disabled={!buttonState.confirm}
                    onClick={openConfirmModal}
                  >
                    <div className="font-size-12">Підтвердити</div>
                  </button>

                  {/* PAY */}
                  <button
                    className={`column align-center button background-warning ${
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
            className={`column align-center button background-info ${
              !buttonState.reorder ? "disabled opacity-50" : ""
            }`}
            disabled={!buttonState.reorder}
            onClick={openReorderModal}
          >
            <div className="font-size-12">Дозамовлення</div>
          </button>

          {/* CLAIM */}
          <button
            className={`column align-center button button-last background-danger ${
              !buttonState.claim ? "disabled opacity-50" : ""
            }`}
            disabled={!buttonState.claim}
            onClick={openClaimModal}
          >
            <div className="font-size-12">Рекламація</div>
          </button>
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
      />

      {/* PAYMENT */}
      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.id,
          }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
});
