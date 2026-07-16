// ================= OrderItemSummary.jsx (Clean + Optimized) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import {

  formatDateHumanShorter_full,
  formatDateTimeShort

} from "../../utils/formatters";

import {

  formatDateHumanShorter

} from "../../utils/formatters";
import { AppIcon } from "../Icons/AppIcon";
import { useTranslation  } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
import PaymentModal from "./PaymentModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";


export default React.memo(function OrderItemSummaryDesktop({
  order,
  calculationDate,
  calculationConstructionsCount,
  totalOrderConstructions,
  onRefresh
}) {
  const {t, i18n} = useTranslation();
  const locale = i18n.language;
  const { addNotification } = useNotification();


  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConstructionWarningModalOpen, setIsConstructionWarningModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);



  const windowsIcon = "/assets/icons/WindowsIconCalc.png";
  const listCalcIcon = "/assets/icons/ListCalcIcon.png";
  const moneyGreen = "/assets/icons/MoneyGreen.png";
  const moneyRed = "/assets/icons/MoneyRed.png";
  const fileIcon = "/assets/icons/FileIcon.png";
  const speedIcon = "/assets/icons/SpeedIcon.png";



  const { user } = useAuthGetRole();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const [claimOrderGuid, setClaimOrderGuid] = useState("");


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

    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };


    const statusConfig = {
      Новий: { confirm: true, pay: true,  reorder: true },
      "У виробництві" : {pay: true,  reorder: true},
      "Очікуємо підтвердження": { confirm: true, pay: true },
      Підтверджений: { pay: true, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      Оплачено: { pay: true, reorder: true },
      Готовий: { pay: true, reorder: true },
      Відвантажений: { pay: true, reorder: true, claim: true },
    };


    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }

    return state;
  }, []);


    const handleSaveAdditionalOrder = useCallback(async (formData) => {
  setLoading(true); 
  try {
    const response = await axiosInstance.post(
      "/additional_orders/save_additional_order/",
      formData
    );


    const result = Array.isArray(response.data) ? response.data[0] : response.data;

    if (result?.success === true || response.status === 201) {
      addNotification(t("reorder_modal.success_create"), "success");
      setIsReorderModalOpen(false); 
    
      if (typeof setRefreshTrigger === 'function') {
        setRefreshTrigger((prev) => prev + 1);
      }
    } else {
      addNotification( t("errors.error") + (result?.message || t("errors.unknownError")), "error");
    }
  } catch (err) {
    // console.error("Помилка відправки:", err);
    addNotification(t("errors.errorSendData") + (err.response?.data?.message || err.message), "error");
  } finally {
    setLoading(false);
  }
}, [addNotification, setIsReorderModalOpen]); 


  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  const buttonState = useMemo(() => {
    const state = getButtonState(order.status);


    if (debtAmount <= 0) {
      state.pay = false;
    }

    return state;
  }, [order.status, debtAmount, getButtonState]);

  const getStatusClass = useCallback((status) => {
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


      case "Відмова":
        return "text-WS---MiddleGrey";

      case "Готовий":
        return "text-WS---DarkGreen";
      case "Відвантажений":
        return "text-WS---DarkPurple";

      default:
        return "text-WS---MiddleGrey ";
    }
  }, []);




  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order.number);
    setClaimOrderGuid(order.idGuid); 
    setIsClaimModalOpen(true);
  }, [order.number, order.idGuid]);

  const openReorderModal = useCallback(() => {
    setIsReorderModalOpen(true);
  }, []);

  const openConfirmModal = useCallback((e) => {
    e.stopPropagation();

    const calculationCount = Number(calculationConstructionsCount);
    const ordersTotal = Number(totalOrderConstructions);
    const hasComparableCounts =
      Number.isFinite(calculationCount) &&
      Number.isFinite(ordersTotal) &&
      calculationCount > 0;

    if (hasComparableCounts && ordersTotal !== calculationCount) {
      setIsConstructionWarningModalOpen(true);
      return;
    }

    setIsConfirmModalOpen(true);
  }, [calculationConstructionsCount, totalOrderConstructions]);

  const handleConstructionWarningConfirm = useCallback(() => {
    setIsConstructionWarningModalOpen(false);
    setIsConfirmModalOpen(true);
  }, []);

  const openFilesModal = useCallback((e) => {
    e.stopPropagation();
    setIsFilesModalOpen(true);
  }, []);



  const openPaymentModal = useCallback((e) => {
    e.stopPropagation();
    setIsPaymentOpen(true);
  }, []);


  const handlePaymentConfirm = async (contractID, amount) => {
    // console.log("ОПЛАТА:", { contractID, amount, orderID: order.id });

    try {
      await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: order.idGuid,
        amount: Number(amount),
      });

        addNotification(
        t("order_mobile.notifications.payment_success"),
        "success",
      );
      setIsPaymentOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      addNotification(t("errors.paymentError"), "error");
    }
  };


  const handleConfirmOrder = useCallback(async () => {
    try {
      const response = await axiosInstance.post(
        `/orders/${order.idGuid}/confirm/`,
      );

      if (response.status === 200 || response.status === 204) {
        addNotification(
          t("order_mobile.notifications.order_confirmed", {
            number: order.number,
          }),
          "success",
        );
      }


      if (onRefresh) onRefresh();

      
    } catch (error) {
      addNotification(`${t("errors.error")} ${error.message}`, "error");
    }
  }, []);

  const dateDiffStatus = useMemo(() => {

    if (!order.date || !calculationDate) return null;

    const d1 = new Date(calculationDate);
    const d2 = new Date(order.date);

 
    const diffInDays = (d2 - d1) / (1000 * 60 * 60 * 24);


    return diffInDays <= 1;
  }, [order.date, calculationDate]);


    const translatedStatus = useMemo(() => {
    const statusMap = {
      "Новий": t("order_status.new"),
      "В обробці": t("order_status.processing"),
      "Очікуємо підтвердження": t("order_status.waiting_confirmation"),
      "Очікуємо оплату": t("order_status.waiting_payment"),
      "Підтверджений": t("order_status.confirmed"),
      "Оплачено": t("order_status.paid"),
      "У виробництві": t("order_status.production"),
      "Готовий": t("order_status.ready"),
      "Відвантажений": t("order_status.shipped"),
      "Відмова": t("order_status.rejected"),
    };
  
    return statusMap[order.status] || order.status;
  }, [order.status, t]);
  

  return (
    <div className="order-item !border-b-0 flex flex-col w-full gap-0">
      {/* --- SUMMARY ROW --- */}
      <div
        // className="order-item-summary flex w-full cursor-pointer items-center"
         className="order-item-summary order-grid cursor-pointer"
        onClick={toggleExpand}
      >
        {/* ICON */}
        <div className="summary-item row no-wrap !border-r-0 !pr-0">
            {/* <img 
                  src={listCalcIcon} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                /> */}
                <AppIcon name="listCalc" className="order-summary-icon align-center mr-0.5 h-[35px]" />
        </div>

 
        <div className="text-WS---DarkGrey summary-item row no-wrap">
          <div className="column items-start w-full">
         
            <div className="column border-bottom w-full pb-1">
              <span className="text-[10px] text-grey leading-none">{t("order_mobile.labels.order_number")}</span>
              <div className="text-[15px] text-bold mt-0.5">
                № {order.number}
              </div>
            </div>
            

            <div className="text-start text-[11px] pt-1">
              {formatDateHumanShorter_full(order.date, locale)}
            </div>
          </div>
        </div>

        {/* COUNT */}
       <div className="summary-item flex items-center  justify-center">
        <div className="column items-center w-full h-full">
          {/* Маленький підпис зверху */}
          <span className="text-[10px] text-grey leading-none mb-2 mt-1">{t("order_mobile.labels.constructions")}</span>
          
          {/* Рядок з іконкою та значенням */}
          <div className="row gap-2 align-center">
            <AppIcon name="windows" className="order-summary-icon w-[25px] h-[25px] shrink-0" />
            <div className="text-[16px] font-bold text-WS---DarkBlue leading-none">
              {order.count}
            </div>
          </div>
        </div>
      </div>

        {/* FILES */}
        <div
          className="summary-item flex items-start justify-start cursor-pointer w-full  "
          onClick={openFilesModal}
        >
          <div className="row gap-1 align-center">
            {/* <img 
                src={fileIcon} 
                // alt="Вікно" 
                className="align-center mr-0.5 w-[20px] h-[25px]" 
              
              /> */}
              <AppIcon name="file" className="order-summary-icon order-summary-icon--accent order-files-icon align-center mr-0.5 w-[20px] h-[25px]" />
            <div className="text-WS---DarkGrey text-[13px] underline">{t("order_mobile.labels.files")}</div>
          </div>
        </div>

    
      <div className="summary-item flex flex-col h-full !justify-start">

        <div className="text-grey text-[10px] mb-1 w-full align-center justify-center flex">
          {t("order_mobile.labels.order_amount")}
        </div>


        <div className="flex items-center no-wrap">
          <AppIcon name="moneyGreen" className="order-summary-icon--money-green mr-1.5 w-[20px] h-[18px] shrink-0" />
          <div className="text-WS---DarkGreen order-summary-amount-text font-bold text-[15px]">
            {formatMoney2(order.amount, order.currency)}
          </div>
        </div>
      </div>


    <div className="summary-item flex flex-col h-full !justify-start">

      <div className="text-grey text-[10px] mb-1 w-full align-center justify-center flex">
        {t("order_mobile.labels.debt_amount")}
      </div>


      <div className="flex items-center no-wrap">
        <AppIcon name="moneyRed" className="order-summary-icon--money-red mr-1.5 w-[20px] h-[18px] shrink-0" />
        <div className="text-WS---DarkRed order-summary-debt-text font-bold text-[15px]">
          {formatMoney2(debtAmount, order.currency)}
        </div>
      </div>
    </div>

        {/* STATUS */}
        <div className="summary-item row justify-start">
          <div className="row gap-1 align-center">
            {/* Замінюємо 'text-info' на динамічний клас статусу */}
            <span className={`icon-info-with-circle font-size-20 order-status-icon ${getStatusClass(order.status)}`}></span>
            
            <div className={`text-[12px] order-status-text ${getStatusClass(order.status)}`}>
                 {translatedStatus}
            </div>
          </div>
        </div>


        <div className="summary-item row grid-buttons" onClick={(e) => e.stopPropagation()}>
  {user?.role !== "admin" && (
    <>

      <button
        className={`column align-center button bg-WS---DarkGrey order-action-button order-action-button--confirm ${
          !buttonState.confirm ? "disabled opacity-50" : ""
        }`}
        disabled={!buttonState.confirm}
        onClick={openConfirmModal}
      >
        <div className="text-[12px] font-bold font-['Inter'] ">{t("order_mobile.buttons.confirm")}</div>
      </button>

  
      <button
        className={`column align-center button bg-WS---DarkGreen order-action-button order-action-button--pay ${
          !buttonState.pay ? "disabled opacity-50" : ""
        }`}
        disabled={!buttonState.pay}
        onClick={openPaymentModal}
      >
        <div className="text-[12px] font-bold font-['Inter'] mx-1">{t("order_mobile.buttons.pay")}</div>
      </button>
    </>
  )}

  {/* REORDER */}
  <button
    className={`column align-center button bg-WS---DarkBlue px-1 order-action-button order-action-button--reorder ${
      !buttonState.reorder ? "disabled opacity-50" : ""
    }`}
    disabled={!buttonState.reorder}
    onClick={openReorderModal}
  >
    <div className="text-[12px] font-bold font-['Inter']  ">{t("order_mobile.buttons.reorder")}</div>
  </button>

  {/* CLAIM */}
  <button
    className={`column align-center button bg-WS---DarkRed order-action-button order-action-button--claim ${
      !buttonState.claim ? "disabled opacity-50" : ""
    }`}
    disabled={!buttonState.claim}
onClick={openClaimModal}
  >
    <div className="text-[12px] font-bold font-['Inter'] ">{t("order_mobile.buttons.claim")}</div>
  </button>
</div>

 

<div
  className="summary-item items-center justify-center"
  title={
    dateDiffStatus
      ? t("order_mobile.fast_order.fast")
      : t("order_mobile.fast_order.slow")
  }
>
  {/* Змінено на flex-col для вертикального відображення: текст зверху, іконка знизу */}
<div className="flex flex-col items-center justify-center gap-1 text-center font-size-24 w-full">
  {/* Обмежуємо ширину, щоб слова "Швидке" та "оформлення" стали одне під одним */}
  <span className="fast-order-text order-fast-label block max-w-[65px] text-[10px] font-medium leading-tight break-words">
  Швидке оформлення
</span>
  {dateDiffStatus !== null && (
    <img
      src={speedIcon}
      alt="Speed Icon"
      style={{ width: "24px", height: "24px" }}
      className={`shrink-0 order-fast-icon ${dateDiffStatus ? "order-fast-icon--positive" : "order-fast-icon--negative"}`}
    />
  )}
</div>
      </div>
      </div>

   
      {isExpanded && (
        <div className="separator-border w-full">
          <OrderDetailsDesktop order={order} />
        </div>
      )}

      
{isFilesModalOpen && (
  <OrderFilesModal
    orderGuid={order.idGuid}
    hideZkzFiles={true}
    entityType="order" // Явно вказуємо, що це замовлення
    onClose={() => setIsFilesModalOpen(false)}
  />
)}

      <ConfirmModal
        isOpen={isConstructionWarningModalOpen}
        onClose={() => setIsConstructionWarningModalOpen(false)}
        onConfirm={handleConstructionWarningConfirm}
        title="Увага"
        message={
          "Сумарна кількість конструкцій у замовленнях (" +
          totalOrderConstructions +
          ") не збігається з кількістю у прорахунку (" +
          calculationConstructionsCount +
          ")."
        }
        confirmText="Окей"
        type="warning"
        showCancel={false}
      />

      {/* CONFIRM ORDER */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title={t("order_mobile.confirm_modal.title")}
        message={t("order_mobile.confirm_modal.message", {
          number: order.number,
        })}
        confirmText={t("order_mobile.confirm_modal.confirm")}
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
