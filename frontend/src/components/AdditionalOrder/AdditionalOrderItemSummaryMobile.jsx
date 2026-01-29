import React, { useState, useMemo, useCallback } from "react";
import { formatMoney } from "../../utils/formatMoney";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from './OrderDetailsMobile';

// Модальні вікна
import AddClaimModal from "../Complaint/AddClaimModal";
import AddReorderModal from "./AddReorderModal";
import ConfirmModal from "../Orders/ConfirmModal";
import PaymentModal from "../Orders/PaymentModal";
import OrderFilesModal from "../Orders/OrderFilesModal";
import { useNotification } from "../notification/Notifications";

export default function AdditionalOrderItemSummaryMobile({ order }) {
  // =========================== UI STATE ===========================
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

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

  // ========================= LOGIC =========================
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
      case "Доставлено": return "text-success";
      default: return "text-grey";
    }
  };

  // ========================= HANDLERS =========================
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleConfirmOrder = async () => {
    try {
      const response = await axiosInstance.post(`/additional-orders/${order.guid}/confirm/`);
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
      addNotification("Помилка виконання оплати", 'error');
    }
  };

  return (
    <div className="order-item flex flex-col w-full gap-0">
      <div className="flex flex-col w-full p-3 bg-white rounded-lg shadow-sm border border-gray-200" onClick={toggleExpand}>
        
        {/* Номер і статус */}
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
              <span className="text-grey font-size-14">Сума</span>
            </div>
            <div className="text-info font-size-16 font-weight-bold">{formatMoney(order.amount)}</div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon icon-coin-dollar text-danger font-size-14"></span>
              <span className="text-grey font-size-14">Борг</span>
            </div>
            <div className="text-danger font-size-16 font-weight-bold">{formatMoney(debtAmount)}</div>
          </div>
        </div>

        {/* Кнопка файлів */}
        <div 
          className="flex items-center gap-1.2 p-1.5 bg-gray-50 rounded mb-2 active:bg-gray-100"
          onClick={(e) => { e.stopPropagation(); setIsFilesModalOpen(true); }}
        >
          <div className="icon-download font-size-16 text-red"></div>
          <div className="font-size-14 text-info underline">Файли замовлення</div>
        </div>

        {/* Кнопки дій */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 py-[2px] mobile-buttons-scroll" onClick={(e) => e.stopPropagation()}>
          {user?.role !== "admin" && (
            <>
              <button 
                className="grow shrink-0 h-8 flex items-center justify-center px-3 background-success text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50"
                disabled={!buttonState.confirm}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Підтвердити
              </button>

              <button 
                className="grow shrink-0 h-8 flex items-center justify-center px-3 background-warning text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50"
                disabled={!buttonState.pay}
                onClick={() => setIsPaymentOpen(true)}
              >
                Сплатити
              </button>
            </>
          )}

          <button 
            className="grow shrink-0 h-8 flex items-center justify-center px-3 background-danger text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50"
            disabled={!buttonState.claim}
            onClick={() => setIsClaimModalOpen(true)}
          >
            Рекламація
          </button>
        </div>

        <div className="flex justify-center mt-1.5">
          <span className={`icon ${isExpanded ? 'icon-chevron-up' : 'icon-chevron-down'} font-size-12 text-grey`}></span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
          <OrderDetailsMobile order={order} />
        </div>
      )}

      {/* ================= MODALS ================= */}
      {isFilesModalOpen && (
        <OrderFilesModal orderGuid={order.guid} onClose={() => setIsFilesModalOpen(false)} />
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
          order={{ OrderNumber: order.number, DebtAmount: debtAmount, OrderID: order.guid }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
}