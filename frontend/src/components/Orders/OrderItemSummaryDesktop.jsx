// ================= OrderItemSummary.jsx =================
import React, { useCallback, useMemo, useState, useEffect } from "react";
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import { formatDateHumanShorter_full, formatDateTimeShort_2 } from "../../utils/formatters";
import { AppIcon } from "../Icons/AppIcon";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
import PaymentModal from "./PaymentModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { hasFinanceAccess } from "../../utils/financeAccess";

export default React.memo(function OrderItemSummaryDesktop({
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
  const locale = i18n.language;
  const { addNotification } = useNotification();
  const { isAdmin, isBackoffice, isManager } = useAuthGetRole();
  const canViewFinance = hasFinanceAccess();
  const canConfirmOrder = !isBackoffice || isManager || isAdmin;
  const canPayOrder = !isBackoffice || isManager || isAdmin;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [
    isConstructionWarningModalOpen,
    setIsConstructionWarningModalOpen,
  ] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setRefreshTrigger] = useState(0);

  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const [claimOrderGuid, setClaimOrderGuid] = useState("");

  const speedIcon = "/assets/icons/SpeedIcon.png";

  const orderNumber = String(order?.number || "").trim();
  const isSketchOrder = orderNumber.startsWith("34-");
  const isSketchConfirmed = order?.status === "Ескіз підтверджено";

  const toggleExpand = useCallback(() => {
    if (isSketchOrder) {
      return;
    }

    if (onToggle) {
      onToggle(order.idGuid || order.number);
      return;
    }

    setIsExpanded((prev) => !prev);
  }, [isSketchOrder, onToggle, order.idGuid, order.number]);

  const getButtonState = useCallback((status) => {
    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };

    const statusConfig = {
      Новий: {
        confirm: true,
        pay: true,
        reorder: true,
      },
      "У виробництві": {
        pay: true,
        reorder: true,
      },
      "Очікуємо підтвердження": {
        confirm: true,
        pay: true,
      },
      Підтверджений: {
        pay: true,
        reorder: true,
      },
      "Очікуємо оплату": {
        pay: true,
        reorder: true,
      },
      Оплачено: {
        pay: true,
        reorder: true,
      },
      Готовий: {
        pay: true,
        reorder: true,
      },
      Відвантажений: {
        pay: true,
        reorder: true,
        claim: true,
      },
    };

    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }

    return state;
  }, []);

  const debtAmount = useMemo(() => {
    const amount = Number(order?.amount || 0);
    const paid = Number(order?.paid || 0);
    const debt = amount - paid;

    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order?.amount, order?.paid]);

  const debtColorClass = Number(order?.paid || order.paid || 0) > 0 ? "text-WS---Orange" : "text-WS---DarkRed";

  useEffect(() => {
    if (typeof externalExpanded === "boolean") {
      setIsExpanded(externalExpanded);
    }
  }, [externalExpanded]);

  const buttonState = useMemo(() => {
    const state = getButtonState(order?.status);

    if (debtAmount <= 0) {
      state.pay = false;
    }

    /*
     * Для 34-* на фронті лишається тільки підтвердження ескізу.
     * Код статусу фронт не визначає.
     */
    if (isSketchOrder) {
      return {
        confirm: !isSketchConfirmed,
        pay: false,
        reorder: false,
        claim: false,
      };
    }

    return state;
  }, [order?.status, debtAmount, getButtonState, isSketchOrder, isSketchConfirmed]);

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
        return "text-WS---DarkBlueProfile";

      case "В обробці":
      case "Відмова":
        return "text-WS---MiddleGrey";

      case "Готовий":
        return "text-WS---DarkGreen";

      case "Відвантажений":
        return "text-WS---DarkPurple";

      default:
        return "text-WS---MiddleGrey";
    }
  }, []);

  const handleSaveAdditionalOrder = useCallback(
    async (formData) => {
      setLoading(true);

      try {
        const response = await axiosInstance.post(
          "/additional_orders/save_additional_order/",
          formData,
        );

        const result = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (result?.success === true || response.status === 201) {
          addNotification(
            t("reorder_modal.success_create"),
            "success",
          );

          setIsReorderModalOpen(false);
          setRefreshTrigger((prev) => prev + 1);

          if (onRefresh) {
            await onRefresh();
          }
        } else {
          addNotification(
            `${t("errors.error")} ${
              result?.message || t("errors.unknownError")
            }`,
            "error",
          );
        }
      } catch (error) {
        addNotification(
          `${t("errors.errorSendData")} ${
            error.response?.data?.message || error.message
          }`,
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [addNotification, onRefresh, t],
  );

  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order?.number || "");
    setClaimOrderGuid(order?.idGuid || "");
    setIsClaimModalOpen(true);
  }, [order?.number, order?.idGuid]);

  const openReorderModal = useCallback((event) => {
    event?.stopPropagation();
    setIsReorderModalOpen(true);
  }, []);

  const openConfirmModal = useCallback(
    (event) => {
      event.stopPropagation();

      /*
       * Для 34-* не перевіряємо відповідність кількості конструкцій.
       * Відразу відкриваємо підтвердження ескізу.
       */
      if (isSketchOrder) {
        setIsConfirmModalOpen(true);
        return;
      }

      const calculationCount = Number(
        calculationConstructionsCount,
      );
      const ordersTotal = Number(totalOrderConstructions);

      const hasComparableCounts =
        Number.isFinite(calculationCount) &&
        Number.isFinite(ordersTotal) &&
        calculationCount > 0;

      if (
        hasComparableCounts &&
        ordersTotal !== calculationCount
      ) {
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

  const openFilesModal = useCallback((event) => {
    event.stopPropagation();
    setIsFilesModalOpen(true);
  }, []);

  const openPaymentModal = useCallback((event) => {
    event.stopPropagation();
    setIsPaymentOpen(true);
  }, []);

  const handlePaymentConfirm = useCallback(
    async (contractID, amount) => {
      try {
        const response = await axiosInstance.post(
          "/payments/make_payment_from_advance/",
          {
            contract: contractID,
            order_id: order?.idGuid,
            amount: Number(amount),
          },
        );
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
        addNotification(
          t("errors.paymentError"),
          "error",
        );
      }
    },
    [order?.idGuid, addNotification, onOrderPaymentSuccess, onRefresh, t],
  );

  /*
   * Фронт передає тільки GUID та номер замовлення.
   * Backend сам визначає:
   * 34-* -> 000000017
   * інші -> 000000002
   */
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
          response.data?.error ||
            "Не вдалося змінити стан замовлення",
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
            : t(
                "order_mobile.notifications.order_confirmed",
                {
                  number: orderNumber,
                },
              )),
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
    orderNumber,
    isSketchOrder,
    onRefresh,
    onOrderConfirmationSuccess,
    addNotification,
    t,
  ]);

  const dateDiffStatus = useMemo(() => {
    if (!order?.date || !calculationDate) {
      return null;
    }

    const calculationDateValue = new Date(calculationDate);
    const orderDateValue = new Date(order.date);

    const diffInDays =
      (orderDateValue - calculationDateValue) /
      (1000 * 60 * 60 * 24);

    return diffInDays <= 1;
  }, [order?.date, calculationDate]);

  const translatedStatus = useMemo(() => {
    const statusMap = {
      Новий: t("order_status.new"),
      "В обробці": t("order_status.processing"),
      "Очікуємо підтвердження": t(
        "order_status.waiting_confirmation",
      ),
      "Очікуємо оплату": t(
        "order_status.waiting_payment",
      ),
      Підтверджений: t("order_status.confirmed"),
      Оплачено: t("order_status.paid"),
      "У виробництві": t("order_status.production"),
      Готовий: t("order_status.ready"),
      Відвантажений: t("order_status.shipped"),
      Відмова: t("order_status.rejected"),
    };

    return statusMap[order?.status] || order?.status;
  }, [order?.status, t]);

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
    <div className="order-item !border-b-0 flex flex-col w-full gap-0" style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
      <div
  className="order-item-summary order-grid"
  style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}
  onClick={
    isSketchOrder
      ? undefined
      : toggleExpand
  }
>
        {/* ICON */}
        <div className="summary-item row no-wrap !border-r-0 !pr-0" style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
          <AppIcon
            name="listCalc"
            className="order-summary-icon align-center mr-0.5 h-[35px]"
          />
        </div>

        {/* NUMBER + DATE */}
        <div className="text-WS---DarkGrey summary-item order-summary-date-block row no-wrap"  style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
          <div className="column items-start w-full">
            <div className="column border-bottom w-full pb-1">
              <span className="text-[10px] text-grey leading-none">
                {t("order_mobile.labels.order_number")}
              </span>

              <div className="text-[15px] text-bold mt-0.5">
                № {orderNumber}
              </div>

              {/* {order?.linkedOrderNumber && (
                <div className="text-[11px] text-grey mt-0.5 leading-tight">
                  → {order.linkedOrderNumber}
                </div>
              )} */}
            </div>

            <div className="text-start text-[11px] pt-1">
              {formatDateTimeShort_2(
                order?.date,
                locale,
              )}
            </div>
          </div>
        </div>

        {/* CONSTRUCTIONS */}
        <div className="summary-item flex items-center justify-center" style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
          <div className="column items-center w-full h-full">
            <span className="text-[10px] text-grey leading-none mb-2 mt-1">
              {t("order_mobile.labels.constructions")}
            </span>

            <div className="row gap-2 align-center">
              <AppIcon
                name="windows"
                className="order-summary-icon w-[25px] h-[25px] shrink-0"
              />

              <div className="text-[16px] font-bold text-WS---DarkBlue leading-none">
                {order?.count}
              </div>
            </div>
          </div>
        </div>

        {/* FILES */}
        <div
          className="summary-item flex items-start justify-start cursor-pointer w-full"
          onClick={openFilesModal}
        >
          <div className="row gap-1 align-center">
            <AppIcon
              name="file"
              className="order-summary-icon order-summary-icon--accent order-files-icon align-center mr-0.5 w-[20px] h-[25px]"
            />

            <div className="text-WS---DarkGrey text-[13px] underline">
              {t("order_mobile.labels.files")}
            </div>
          </div>
        </div>

      {/* FINANCE CELLS */}
<div className="summary-item flex flex-col h-full !justify-start" style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
  <div className="text-grey text-[10px] mb-1 w-full flex items-center justify-center">
    {t("order_mobile.labels.order_amount")}
  </div>

  <div className="flex items-center no-wrap">
    <AppIcon
      name="moneyGreen"
      className="order-summary-icon--money-green text-WS---DarkGreen mr-1.5 w-[20px] h-[18px] shrink-0"
    />

    <div className="text-WS---DarkGreen order-summary-amount-text font-bold text-[15px]">
      {formatMoney2(order?.amount, order?.currency)}
    </div>
  </div>
</div>

{isSketchOrder ? (
  <div className="summary-item flex flex-col h-full !justify-start" style={{
    cursor: "default",
  }}>
    <div className="text-grey text-[10px] mb-1 w-full flex items-center justify-center text-center">
      Основне замовлення
    </div>

    <div className="flex items-center justify-center w-full">
      <div className="text-WS---DarkBlue font-bold text-[15px] leading-tight text-center break-words">
        {order?.linkedOrderNumber
          ? `№ ${order.linkedOrderNumber}`
          : "Не прив’язано"}
      </div>
    </div>
  </div>
) : (
  <div className="summary-item flex flex-col h-full !justify-start" style={{
    cursor: isSketchOrder ? "default" : "pointer",
  }}>
    <div className="text-grey text-[10px] mb-1 w-full flex items-center justify-center">
      {t("order_mobile.labels.debt_amount")}
    </div>

    <div className="flex items-center no-wrap">
      <AppIcon
        name="moneyRed"
        className={"order-summary-icon--money-red " + debtColorClass + " mr-1.5 w-[20px] h-[18px] shrink-0"}
      />

      <div className={debtColorClass + " order-summary-debt-text font-bold text-[15px]"}>
        {formatMoney2(debtAmount, order?.currency)}
      </div>
    </div>
  </div>
)}

        {/* STATUS */}
        <div
          className="summary-item row justify-start"
          style={{ cursor: isSketchOrder ? "default" : "pointer" }}
        >
          <div className="row gap-1 align-center">
            <span
              className={"icon-info-with-circle font-size-20 order-status-icon " + getStatusClass(order?.status)}
            />
            <div className="flex flex-col">
              <div className={"text-[12px] order-status-text " + getStatusClass(order?.status)}>{translatedStatus}</div>
              {readyDeliveryTimeDisplay && (
                <div className="text-[9px] text-grey leading-tight mt-0.5">{readyDeliveryTimeDisplay}</div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div
          className={`summary-item row ${
    !isSketchOrder ? "grid-buttons" : ""
  }`}
          onClick={(event) => event.stopPropagation()}
        >
          {isSketchOrder ? (
            canConfirmOrder && (
              <button
                type="button"
                className={`column align-center button bg-WS---DarkGrey order-action-button order-action-button--confirm ${
                  !buttonState.confirm ? "disabled opacity-50" : ""
                }`}
                onClick={openConfirmModal}
                disabled={!buttonState.confirm}
              >
                <div className="text-[12px] font-bold font-['Inter']">
                  Підтвердити ескіз
                </div>
              </button>
            )
          ) : (
            <>
              {canConfirmOrder && (
                <>
                  <button
                    type="button"
                    className={`column align-center button bg-WS---DarkGrey order-action-button order-action-button--confirm ${
                      !buttonState.confirm
                        ? "disabled opacity-50"
                        : ""
                    }`}
                    disabled={!buttonState.confirm}
                    onClick={openConfirmModal}
                  >
                    <div className="text-[12px] font-bold font-['Inter']">
                      {t("order_mobile.buttons.confirm")}
                    </div>
                  </button>

                  {canViewFinance && (
              <button
                    type="button"
                    className={`column align-center button bg-WS---DarkGreen order-action-button order-action-button--pay ${
                      !buttonState.pay || !canViewFinance
                        ? "disabled opacity-50"
                        : ""
                    }`}
                    disabled={!buttonState.pay || !canViewFinance}
                    onClick={canViewFinance ? openPaymentModal : undefined}
                  >
                    <div className="text-[12px] font-bold font-['Inter'] mx-1">
                      {debtAmount <= 0 ? t("order_status.paid", { defaultValue: "Сплачено" }) : t("order_mobile.buttons.pay")}
                    </div>
                  </button>
              )}
                </>
              )}

              <button
                type="button"
                className={`column align-center button bg-WS---DarkBlue px-1 order-action-button order-action-button--reorder ${
                  !buttonState.reorder
                    ? "disabled opacity-50"
                    : ""
                }`}
                disabled={!buttonState.reorder}
                onClick={openReorderModal}
              >
                <div className="text-[12px] font-bold font-['Inter']">
                  {t("order_mobile.buttons.reorder")}
                </div>
              </button>

              <button
                type="button"
                className={`column align-center button bg-WS---DarkRed order-action-button order-action-button--claim ${
                  !buttonState.claim
                    ? "disabled opacity-50"
                    : ""
                }`}
                disabled={!buttonState.claim}
                onClick={openClaimModal}
              >
                <div className="text-[12px] font-bold font-['Inter']">
                  {t("order_mobile.buttons.claim")}
                </div>
              </button>
            </>
          )}
        </div>

        {/* FAST ORDER */}
        <div
          className="summary-item items-center justify-center"
          title={
            dateDiffStatus
              ? t("order_mobile.fast_order.fast")
              : t("order_mobile.fast_order.slow")
          }
          style={{
            cursor: isSketchOrder ? "default" : "pointer",
          }}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-center font-size-24 w-full">
            <span className="fast-order-text order-fast-label block max-w-[65px] text-[10px] font-medium leading-tight break-words">
              Швидке оформлення
            </span>

            {dateDiffStatus !== null && (
              <img
                src={speedIcon}
                alt="Speed Icon"
                style={{
                  width: "24px",
                  height: "24px",
                }}
                className={`shrink-0 order-fast-icon ${
                  dateDiffStatus
                    ? "order-fast-icon--positive"
                    : "order-fast-icon--negative"
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {!isSketchOrder && isExpanded && (
        <div className="separator-border w-full">
          <OrderDetailsDesktop order={order} />
        </div>
      )}

      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order?.idGuid}
          hideZkzFiles
          entityType="order"
          onClose={() => setIsFilesModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConstructionWarningModalOpen}
        onClose={() =>
          setIsConstructionWarningModalOpen(false)
        }
        onConfirm={handleConstructionWarningConfirm}
        title="Увага"
        message={
          `Сумарна кількість конструкцій у замовленнях (` +
          `${totalOrderConstructions}) не збігається з кількістю ` +
          `у прорахунку (${calculationConstructionsCount}).`
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
        initialOrderNumber={claimOrderNumber}
        initialOrderGUID={claimOrderGuid}
        initialContractorGuid={contractorGuid}
      />

      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        initialOrderNumber={orderNumber}
        initialContractorGuid={contractorGuid}
        onSave={handleSaveAdditionalOrder}
      />

      {canViewFinance && isPaymentOpen && !isSketchOrder && (
        <PaymentModal
          order={{
            OrderNumber: orderNumber,
            DebtAmount: debtAmount,
            OrderID: order?.id,
            OrderID_GUID: order?.idGuid,
            CurrencyName: order?.currency,
          }}
          contractorGuid={contractorGuid}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}

      {loading && (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
});
