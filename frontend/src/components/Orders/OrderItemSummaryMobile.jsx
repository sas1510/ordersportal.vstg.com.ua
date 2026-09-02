import React, { useState, useCallback, useMemo, useEffect } from "react";

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
import { hasFinanceAccess } from "../../utils/financeAccess";

import { useTranslation } from "react-i18next";


export default React.memo(function OrderItemSummaryMobile({
  order,
  contractorGuid,
  calculationDate,
  calculationConstructionsCount,
  totalOrderConstructions,
  isExpanded: externalExpanded,
  onToggle,
  onRefresh,
  onOrderPaymentSuccess,
  onOrderConfirmationSuccess,
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
  const { isAdmin, isBackoffice, isManager } = useAuthGetRole();
  const canViewFinance = hasFinanceAccess();
  const canConfirmOrder = !isBackoffice || isManager || isAdmin;
  const canPayOrder = !isBackoffice || isManager || isAdmin;

  const orderNumber = String(order?.number || "").trim();
  const isSketchOrder = orderNumber.startsWith("34-");
  const isSketchConfirmed = order?.status === "Ескіз підтверджено";

  const toggleExpand = useCallback(() => {
    if (isSketchOrder) return;

    if (onToggle) {
      onToggle(order.idGuid || order.number);
      return;
    }

    setIsExpanded((prev) => !prev);
  }, [isSketchOrder, onToggle, order.idGuid, order.number]);


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

  useEffect(() => {
    if (typeof externalExpanded === "boolean") {
      setIsExpanded(externalExpanded);
    }
  }, [externalExpanded]);

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


  const debtColorClass = Number(order?.paid || order.paid || 0) > 0 ? "text-WS---Orange" : "text-WS---DarkRed";

  const buttonState = useMemo(() => {
    const state = getButtonState(order?.status);

    if (debtAmount <= 0) {
      state.pay = false;
    }

    // Для замовлень 34-* залишаємо тільки підтвердження ескізу.
    if (isSketchOrder) {
      return {
        confirm: !isSketchConfirmed,
        pay: false,
        reorder: false,
        claim: false,
      };
    }

    return state;
  }, [
    order?.status,
    debtAmount,
    getButtonState,
    isSketchOrder,
    isSketchConfirmed,
  ]);


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
      const response = await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: order.idGuid,
        amount: Number(amount),
      });
      if (response?.data?.success !== true) {
        throw new Error("Payment was not confirmed by 1C");
      }

      if (onRefresh) {
        await onRefresh({ silent: true });
      }
      onOrderPaymentSuccess?.({
        orderIdGuid: order?.idGuid,
        amount: Number(amount),
      });
      setIsPaymentOpen(false);
      addNotification(
        t("order_mobile.notifications.payment_success"),
        "success",
      );
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

  const openConfirmModal = useCallback(
    (e) => {
      e.stopPropagation();

      // Для 34-* одразу відкриваємо підтвердження ескізу.
      if (isSketchOrder) {
        setIsConfirmModalOpen(true);
        return;
      }

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
    },
    [
      isSketchOrder,
      calculationConstructionsCount,
      totalOrderConstructions,
    ],
  );

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
        "/orders/confirm-order-by-number/",
        {
          order_id: String(order?.idGuid || ""),
          order_number: orderNumber,
          linked_order_number: String(order?.linkedOrderNumber || "").trim(),
        },
      );

      if (response.data?.success !== true) {
        throw new Error(
          response.data?.error || "Не вдалося змінити стан замовлення",
        );
      }

      setIsConfirmModalOpen(false);
      onOrderConfirmationSuccess?.({
        orderIdGuid: order?.idGuid,
        status: isSketchOrder ? String.fromCharCode(1045, 1089, 1082, 1110, 1079, 32, 1087, 1110, 1076, 1090, 1074, 1077, 1088, 1076, 1078, 1077, 1085, 1086) : String.fromCharCode(1055, 1110, 1076, 1090, 1074, 1077, 1088, 1076, 1078, 1077, 1085, 1080, 1081),
      });

      addNotification(
        response.data?.message ||
          (isSketchOrder
            ? "Ескіз підтверджено"
            : t("order_mobile.notifications.order_confirmed", {
                number: orderNumber,
              })),
        "success",
      );

    } catch (error) {
      addNotification(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          error.message ||
          t("errors.error"),
        "error",
      );
    }
  }, [
    order?.idGuid,
    order?.linkedOrderNumber,
    orderNumber,
    isSketchOrder,
    onRefresh,
    onOrderConfirmationSuccess,
    addNotification,
    t,
  ]);


  const readyDeliveryTimeDisplay = useMemo(() => {
    const status = order?.status;
    const isReady = status === "\u0413\u043e\u0442\u043e\u0432\u0438\u0439";
    const isShipped = status === "\u0412\u0456\u0434\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u0438\u0439";
    if (!isReady && !isShipped) return null;

    const rawDate = order?.plannedDeliveryDateTime || order?.PlannedDeliveryDateTime;
    if (!rawDate) return null;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime()) || (date.getHours() === 0 && date.getMinutes() === 0)) return null;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateText = day + "." + month + "." + year;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedDay = new Date(date);
    plannedDay.setHours(0, 0, 0, 0);

    // After the planned day, a shipped order retains the date but no longer
    // presents the delivery hour as upcoming.
    if (isShipped && today > plannedDay) {
      return dateText;
    }

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return dateText + " \u043e " + hours + ":" + minutes;
  }, [order?.status, order?.plannedDeliveryDateTime, order?.PlannedDeliveryDateTime]);

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
              {order.linkedOrderNumber && (
                <div className="text-[11px] text-grey leading-tight -mt-1">
                  → {order.linkedOrderNumber}
                </div>
              )}
              <div className="text-[10px] text-WS---DarkGrey">
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
      <div className={debtColorClass + " order-summary-debt-text text-[14px] font-bold leading-tight"}>
        {formatMoney2(debtAmount, order.currency)}
      </div>
      <div className="text-grey text-[8px]">{t("order_mobile.labels.debt_amount")}</div>
    </div>
  </div>

  {/* 3. Status */}
  <div className="flex items-center gap-2 pl-3 flex-1">
    <span className={"icon-info-with-circle font-size-24 mr-2 shrink-0 order-status-icon " + getStatusClass(order.status)}></span>
    <div className="flex flex-col">
      <div className={"font-size-14 leading-tight order-status-text " + getStatusClass(order.status)}>{translatedStatus}</div>
      {readyDeliveryTimeDisplay && (
        <div className="text-[9px] text-grey leading-tight mt-0.5">{readyDeliveryTimeDisplay}</div>
      )}
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
  {/* Ліва частина: кнопки дій */}
  <div
    className={
      isSketchOrder
        ? "flex-grow"
        : "grid grid-cols-2-btn gap-8 flex-grow"
    }
  >
    {isSketchOrder ? (
      canConfirmOrder && (
        <button
          type="button"
          className="w-full h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkGrey text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--confirm"
          disabled={!buttonState.confirm}
          onClick={openConfirmModal}
        >
          Підтвердити ескіз
        </button>
      )
    ) : (
      <>
        {canConfirmOrder ? (
          <>
            <button
              type="button"
              className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkGrey text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--confirm"
              disabled={!buttonState.confirm}
              onClick={openConfirmModal}
            >
              {t("order_mobile.buttons.confirm")}
            </button>

            {canViewFinance && (
              <button
              type="button"
              className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkGreen text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--pay"
              disabled={!buttonState.pay || !canViewFinance}
              onClick={canViewFinance ? openPaymentModal : undefined}
            >
              {debtAmount <= 0
                ? t("order_status.paid", { defaultValue: "Сплачено" })
                : t("order_mobile.buttons.pay")}
            </button>
              )}
          </>
        ) : (
          <div className="col-span-2" />
        )}

        <button
          type="button"
          className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkBlue text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--reorder"
          disabled={!buttonState.reorder}
          onClick={(e) => {
            e.stopPropagation();
            openReorderModal();
          }}
        >
          {t("order_mobile.buttons.reorder")}
        </button>

        <button
          type="button"
          className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkRed text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50 order-action-button order-action-button--claim"
          disabled={!buttonState.claim}
          onClick={(e) => {
            e.stopPropagation();
            openClaimModal();
          }}
        >
          {t("order_mobile.buttons.claim")}
        </button>
      </>
    )}
  </div>

  {!isSketchOrder && (
    <div
      className="flex flex-col items-center justify-center min-w-[40px] text-center gap-1 cursor-help"
      title={
        dateDiffStatus
          ? t("order_mobile.fast_order.fast")
          : t("order_mobile.fast_order.slow")
      }
    >
      {dateDiffStatus === null ? null : (
        <div className="order-fast-icon-wrap p-1 rounded-sm overflow-hidden flex items-center justify-center">
          <img
            src={speedIcon}
            alt="Іконка швидкості"
            className={`block order-fast-icon ${
              dateDiffStatus
                ? "order-fast-icon--positive"
                : "order-fast-icon--negative"
            }`}
          />
        </div>
      )}
      <span className="order-fast-label text-[9px] leading-none text-gray-500 font-medium whitespace-nowrap">
        {t("order_mobile.fast_order.title_1")}
        <br />
        {t("order_mobile.fast_order.title_2")}
      </span>
    </div>
  )}
</div>

{!isSketchOrder && (
  <div className="flex justify-center mt-4 cursor-pointer">
    <img
      src={openDetails}
      alt="Деталі"
      className={`block transition-transform duration-300 ${
        isExpanded ? "rotate-180" : "rotate-0"
      }`}
    />
  </div>
)}
      </div>


      {!isSketchOrder && isExpanded && (
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
        title={
          isSketchOrder
            ? "Підтвердження ескізу"
            : t("order_mobile.confirm_modal.title")
        }
        message={
          isSketchOrder
            ? `Підтвердити ескіз замовлення №${orderNumber}?`
            : t("order_mobile.confirm_modal.message", {
                number: orderNumber,
              })
        }
        confirmText={
          isSketchOrder
            ? "Підтвердити ескіз"
            : t("order_mobile.confirm_modal.confirm")
        }
        type="success"
      />

      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSave={() => {

        }}
        initialOrderNumber={claimOrderNumber}
        initialContractorGuid={contractorGuid}
      />


      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        initialOrderNumber={orderNumber}
        initialContractorGuid={contractorGuid}
        onSave={handleReorderSave}
      />

      {canViewFinance && isPaymentOpen && !isSketchOrder && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.idGuid,
            CurrencyName: order.currency,
          }}
          contractorGuid={contractorGuid}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
});