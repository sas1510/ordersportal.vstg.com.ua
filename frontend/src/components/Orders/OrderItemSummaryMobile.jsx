// ================= OrderItemSummaryMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";

import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from "./OrderDetailsMobile";
import { formatDateHumanShorter, formatDateHumanShorter_full } from "../../utils/formatters";
import PaymentModal from "./PaymentModal";

import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

import { useTranslation } from "react-i18next";


export default React.memo(function OrderItemSummaryMobile({
  order,
  calculationDate,
  calculationConstructionsCount,
  totalOrderConstructions,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConstructionWarningModalOpen, setIsConstructionWarningModalOpen] = useState(false);
  const locale = i18n.language;


  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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


  // ------------------------------------
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const { user, role } = useAuthGetRole();
  const _isAdmin = role === "admin";

  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);


  const dateDiffStatus = useMemo(() => {

    if (!order.date || !calculationDate) return null;

    const d1 = new Date(calculationDate);
    const d2 = new Date(order.date);


    const diffInDays = (d2 - d1) / (1000 * 60 * 60 * 24);

    return diffInDays <= 1;
  }, [order.date, calculationDate]);

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

  const openPaymentModal = useCallback((e) => {
    e.stopPropagation();
    setIsPaymentOpen(true);
  }, []);

  const handlePaymentConfirm = async (contractID, amount) => {
    console.log("ОПЛАТА:", {
      contractID,
      amount,
      orderID: order.idGuid,
    });

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


  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order.number);
    setIsClaimModalOpen(true);
  }, [order.number]);

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

  const handleReorderSave = useCallback(
    (formData) => {
      console.log("Дозамовлення по замовленню", order.number, formData);
      setIsReorderModalOpen(false);

    },
    [order.number],
  );


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

        if (onRefresh) onRefresh();
     
      } else {
        addNotification(
          `⚠️ Не вдалося підтвердити замовлення: ${response.data.error || response.statusText}`,
          "error",
        );
      }
    } catch (error) {
      addNotification(`Помилка підтвердження: ${error.message}`, "error");
    }
  }, [order.idGuid, order.number]);


  return (
    <div className="order-item flex flex-col w-full gap-0 !border-0">
    
      <div
        className="md:hidden flex flex-col w-full p-1 "
        onClick={toggleExpand}
        
      >

        <div className="flex items-stretch justify-between mb-1 w-full gap-3  pb-1 border-bottom ">
          

          <div className="flex flex-[2] items-center pr-1  border-right shrink-0">
             <img src={listCalcIcon} className="align-center mr-2 calc-summary-icon"  alt="" />
            <div className="flex  flex-col gap-[6px] no-wrap w-full">
  
              <div className="text-[15px] w-full font-bold pb-1 no-wrap text-WS---DarkGrey border-bottom leading-tight">
                № {order.number}
              </div>
              <div className="text-[11px] text-WS---DarkGrey">
                 {formatDateHumanShorter_full(order.date, locale)}
              </div>
            </div>
          </div>

            <div className="flex flex-col items-center pt-2 justify-center pr-2 border-right flex-1">
              <div className="flex items-center gap-2 no-wrap">
                <img src={windowsIcon} className="align-center mr-2 calc-summary-icon"  alt="" />
                <span className="font-size-24 font-bold text-WS---DarkBlue">
                  {order.count}
                </span>
              </div>
              <span className="text-grey text-[10px] mt-1">{t("order_mobile.labels.constructions")}</span>
            </div>

            <div 
              className="flex items-center gap-2 text-center justify-center pt-2 flex-1 pb-[17px] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={openFilesModal}

            >
       
             <img src={fileIcon} className="align-center mr-2 calc-summary-icon"  alt="" />
            
              <div className="text-[13px] text-dark">{t("order_mobile.labels.files")}</div>
            </div>



          </div>

          <div className="flex items-stretch justify-between  w-full gap-2   py-2">
  
  {/* 1. Сума замовлення */}
  <div className="flex items-center gap-2 pr-1 border-right  flex-1">
    <img src={moneyGreen} className="mr-1 calc-summary-icon--money-green" alt="" />
    <div className="flex flex-col">
      <div className="text-WS---DarkGreen order-summary-amount-text text-[14px] font-bold leading-tight">
        {formatMoney2(order.amount, order.currency)}
      </div>
      <div className="text-grey text-[8px]"> {t("order_mobile.labels.order_amount")}</div>
    </div>
  </div>

  {/* 2. Сума боргу */}
  <div className="flex items-center gap-2 px-1 border-right flex-1">
    {/* Тут використовуємо червону іконку монет, якщо вона є, або ту саму */}
    <img src={moneyRed} className="mr-1 calc-summary-icon--money-red" alt="" /> 
    <div className="flex flex-col">
      <div className="text-WS---DarkRed order-summary-debt-text text-[14px] font-bold leading-tight">
        {formatMoney2(debtAmount, order.currency)}
      </div>
      <div className="text-grey text-[8px]">{t("order_mobile.labels.debt_amount")}</div>
    </div>
  </div>

  {/* 3. Статус */}
<div className="flex items-center gap-2 pl-3 flex-1">
  <span className={`icon-info-with-circle font-size-24 mr-2 shrink-0 order-status-icon ${getStatusClass(order.status)}`}></span>
  <div className={`font-size-14 leading-tight order-status-text ${getStatusClass(order.status)}`}>
    {translatedStatus}
  </div>
</div>

</div>
        {/* Header - Номер і статус (без змін) */}
        {/* <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-news font-size-18 text-success"></span>
            <div className="text-info font-weight-bold font-size-16">
              {order.number}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="icon-info-with-circle font-size-16 text-info"></span>
            <div
              className={`font-size-14 font-weight-medium ${getStatusClass(order.status)}`}
            >
              {order.status}
            </div>
          </div>
        </div> */}

        {/* Дата і кількість (без змін) */}
       
        {/* Фінанси (без змін) */}
      

        {/* PDF та Файли */}

        {/* КНОПКИ (Сітка 2х2 + Швидке оформлення) */}
<div 
  className="flex items-center gap-3 " 
  onClick={(e) => e.stopPropagation()}
>
  {/* Ліва частина: Сітка кнопок 2х2 */}
  <div className="grid grid-cols-2-btn gap-8 flex-grow">
    {user?.role !== "admin" ? (
      <>
        {/* Підтвердити */}
        <button
          className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkGrey text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--confirm"
          disabled={!buttonState.confirm}
          onClick={openConfirmModal}
        >
          {t("order_mobile.buttons.confirm")}
        </button>

        {/* Сплатити */}
        <button
          className="h-[31px] flex items-center font-['Inter']  justify-center px-2 bg-WS---DarkGreen text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--pay"
          disabled={!buttonState.pay}
          onClick={openPaymentModal}
        >
          {t("order_mobile.buttons.pay")}
        </button>
      </>
    ) : (
      <div className="col-span-2"></div> // Заглушка для адміна, щоб зберегти сітку
    )}

    {/* Дозамовлення */}
    <button
      className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkBlue text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--reorder"
      disabled={!buttonState.reorder}
      onClick={(e) => {
        e.stopPropagation();
        openReorderModal();
      }}
    >
      {t("order_mobile.buttons.reorder")}
    </button>

    {/* Рекламація */}
    <button
      className="h-[31px] flex items-center font-['Inter']  justify-center  px-2 bg-WS---DarkRed text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--claim"
      disabled={!buttonState.claim}
      onClick={(e) => {
        e.stopPropagation();
        openClaimModal();
      }}
    >
      {t("order_mobile.buttons.claim")}
    </button>
  </div>

  {/* Права частина: Швидке оформлення */}
<div 
    className="flex flex-col items-center justify-center min-w-[40px] text-center gap-1 cursor-help"
    title={
      dateDiffStatus
        ? t("order_mobile.fast_order.fast")
    : t("order_mobile.fast_order.slow")
    }
  >
    {dateDiffStatus === null ? null : (
      <div className="order-fast-icon-wrap bg-white p-1 rounded-sm overflow-hidden flex items-center justify-center">
        <img 
          src={speedIcon} 
          alt="Іконка швидкості"
          className={`block order-fast-icon ${dateDiffStatus ? "order-fast-icon--positive" : "order-fast-icon--negative"}`}
        />
      </div>
    )}
    <span className="order-fast-label text-[9px] leading-none text-gray-500 font-medium whitespace-nowrap">
      <>
        {t("order_mobile.fast_order.title_1")}
        <br />
        {t("order_mobile.fast_order.title_2")}
      </>
    </span>
  </div>
</div>
        

<div className="flex justify-center mt-4 cursor-pointer" >
  <img 
    src={openDetails} 
    alt="Деталі"
    className={`block transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}

  />
</div>
      </div>


      {isExpanded && (
                <div className="separator-border w-full mt-2">
        <div className="mt-2 pt-2 flex w-full ">
          <OrderDetailsMobile order={order} />
        </div>
        </div>
      )}


      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order.idGuid}
          hideZkzFiles={true}
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

      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSave={() => {

        }}
        initialOrderNumber={claimOrderNumber}
      />


      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        onSave={handleReorderSave}
      />

      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.idGuid,
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
