import React, { useState, useMemo, useCallback } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateHumanShorter } from "../../utils/formatters";
import axiosInstance from "../../api/axios";

// Модальні вікна
import AddClaimModal from "../Complaint/AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import ConfirmModal from "../Orders/ConfirmModal";
import PaymentModal from "../Orders/PaymentModal";
import OrderFilesModal from "../Orders/OrderFilesModal"; // Переконайся, що шлях правильний
import { useNotification } from "../notification/Notifications";

export default function AdditionalOrderItemSummaryDesktop({ order }) {
  // =========================== UI STATE ===========================
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false); // Додано для файлів

  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const { addNotification } = useNotification();
  // =========================== DATA & AUTH ===========================
  const user = useMemo(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }, []);

  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  // ========================= BUTTON LOGIC =========================
  const getButtonState = useCallback((status) => {
    const state = { confirm: false, pay: false, reorder: false, claim: false };

    const statusConfig = {
      "Новий": { confirm: true, pay: true },
      "Очікуємо підтвердження": { confirm: true, pay: true },
      "Підтверджений": { pay: true, confirm: true, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      "Оплачено": { pay: true, reorder: true },
      "Готовий": { pay: true, reorder: true },
      "Доставлено": { pay: true, reorder: true, claim: true },
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
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
      case "Відмова": return "text-danger";
      case "Підтверджений": return "text-info";
      case "Готовий":
      case "Відвантажений": return "text-success";
      default: return "text-grey";
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
      const response = await axiosInstance.post(`/orders/${order.guid}/confirm/`);
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
    } catch (error) {
      console.error(error);
      addNotification("Помилка виконання оплати", 'error');
    }
  };

  return (
    <div className="order-item flex flex-col w-full gap-0">
      <div
        className="order-item-summary flex w-full cursor-pointer items-center gap-4"
        onClick={toggleExpand}
      >
        <div className="summary-item row no-wrap">
          <span className="icon icon-news font-size-20 text-success"></span>
        </div>

        {/* Номер та Дата */}
        <div className="summary-item row w-9 no-wrap">
          <div className="column items-center w-full">
            <div className="text-info font-size-18 border-b border-gray-300 w-full text-center">
              {order.number}
            </div>
            <div className="text-danger text-center">{order.date}</div>
          </div>
        </div>

        {/* Кількість */}
        <div className="summary-item flex items-center w-6 justify-center no-wrap">
          <div className="row gap-5 align-center">
            <span className="icon-layout5 font-size-20 text-info"></span>
            <div className="font-size-20 text-danger">{order.count}</div>
          </div>
        </div>

        {/* ФАЙЛИ - ТЕПЕР ПРАЦЮЄ */}
        <div 
            className="summary-item flex w-10 items-center justify-center no-wrap cursor-pointer" 
            onClick={openFilesModal}
        >
          <div className="row w-full h-full align-center bg-gray-100 p-1 rounded hover:bg-gray-200 transition-colors">
            <div className="icon-download font-size-18 text-red"></div>
            <div className="text-info underline font-size-16">Файли</div>
          </div>
        </div>

        {/* Сума */}
        <div className="summary-item row w-12 no-wrap gap-0 pl-0">
          <span className="icon icon-coin-dollar text-success font-size-16 flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-info font-size-18">{formatMoney(order.amount)}</div>
            <div className="text-grey font-size-12 border-t border-dashed">Сума замовлення</div>
          </div>
        </div>

        {/* Борг */}
        <div className="summary-item row w-12 no-wrap gap-0 pl-0">
          <span className="icon icon-coin-dollar text-danger font-size-16 flex-shrink-0"></span>
          <div className="flex flex-col flex-1 ml-2">
            <div className="text-danger font-size-18">{formatMoney(debtAmount)}</div>
            <div className="text-grey font-size-12 border-t border-dashed">Сума боргу</div>
          </div>
        </div>

        {/* Статус */}
        <div className="summary-item w-[140px] row justify-start">
          <div className="row gap-14 align-center">
            <span className="icon-info-with-circle font-size-20 text-info"></span>
            <div className={`font-size-14 ${getStatusClass(order.status)}`}>{order.status}</div>
          </div>
        </div>

        {/* Кнопки дій */}
        <div className="summary-item row" onClick={(e) => e.stopPropagation()}>
          {user?.role !== "admin" && (
            <>
              <button
                className={`column align-center button button-first background-success ${!buttonState.confirm ? "disabled opacity-50 cursor-not-allowed" : ""}`}
                disabled={!buttonState.confirm}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                <div className="font-size-12">Підтвердити</div>
              </button>

              <button
                className={`column align-center button background-warning ${!buttonState.pay ? "disabled opacity-50 cursor-not-allowed" : ""}`}
                disabled={!buttonState.pay}
                onClick={() => setIsPaymentOpen(true)}
              >
                <div className="font-size-12">Сплатити</div>
              </button>
            </>
          )}


          <button
            className={`column align-center button button-last background-danger ${!buttonState.claim ? "disabled opacity-50 cursor-not-allowed" : ""}`}
            disabled={!buttonState.claim}
            onClick={() => {
              setClaimOrderNumber(order.number);
              setIsClaimModalOpen(true);
            }}
          >
            <div className="font-size-12">Рекламація</div>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className=" pt-1 border-t flex w-full border-dashed border-gray-300">
          <OrderDetailsDesktop order={order} />
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