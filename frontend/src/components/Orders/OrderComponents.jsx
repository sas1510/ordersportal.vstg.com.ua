// ================= CalculationItem.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import { formatMoney, formatMoney2} from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import CounterpartyInfoModal from "./CounterpartyInfoModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import OrderItemSummaryDesktop from "./OrderItemSummaryDesktop";
import {
  formatDateTimeShort, formatDateTimeShort_2
} from "../../utils/formatters";
import "./Orders.css";
import OrderFilesPreviewModal from "./OrderFilesPreviewModal";
import OrderNumbersListModal from "./OrderNumbersListModal";
import OrderRefusalModal from "./OrderRefusalModal";
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { useTranslation } from "react-i18next";
// import (useTranslation)




export const CalculationItem = React.memo(
  ({ calc, onDelete, onEdit, onMarkAsRead , reloadCalculations}) => {
    const { t, i18n } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [_selectedComments, setSelectedComments] = useState([]);
    const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false);
    const { addNotification } = useNotification();

    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [isOrderNumbersOpen, setIsOrderNumbersOpen] = useState(false);
    const [isOrderRefusalOpen, setIsOrderRefusalOpen] = useState(false);

    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";


    const {  role } = useAuthGetRole();
    const isAdmin = role === "admin";

    const isDealerRecipient = useMemo(() => {
      if (!calc.recipient || !calc.dealer) return false;

      return (
        calc.recipient.trim().toLowerCase() === calc.dealer.trim().toLowerCase()
      );
    }, [calc.recipient, calc.dealer]);

    const recipientIconClass = isDealerRecipient
      ? "text-success" // дилер = отримувач
      : "text-warning"; // менеджер / інший отримувач

    // const recipientLabel =
    //   ? "Отримувач"
    //   : calc.dealer || "Контрагент";


    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const handleEdit = useCallback(
      (updatedCalc) => {
        if (onEdit) onEdit(updatedCalc);
      },
      [onEdit],
    );

    const handleViewComments = useCallback(
      (comments) => {
        setSelectedComments(comments);
        setIsCommentsOpen(true);


        if (calc.hasUnreadMessages && onMarkAsRead) {
          onMarkAsRead(calc.id);
        }
      },
      [calc.id, calc.hasUnreadMessages, onMarkAsRead],
    );

    const handleDownload = useCallback(async () => {
      try {
        const fileName = calc.fileName;

        const response = await axiosInstance.get(
          `/calculations/${calc.id}/files/${calc.file}/download/`,
          {
            params: { filename: fileName },
            responseType: "blob",
          },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        link.setAttribute("download", fileName);

        document.body.appendChild(link);
        link.click();

        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        // console.error("Помилка при завантаженні файлу прорахунку:", error);
        addNotification(t('calc.error_download'), "error");
      }
    }, [calc.id, calc.fileGuid, calc.file, calc.number, addNotification, t]);

    const handleDelete = useCallback(async () => {
      if (onDelete) await onDelete(calc.id);
    }, [onDelete, calc.id]);

    const orderList = useMemo(() => {
      if (!Array.isArray(calc.orders)) return [];

    
      return calc.orders.filter(
        (order) => order.number && String(order.number).trim() !== "",
      );
    }, [calc.orders]);

    const totalOrderConstructions = useMemo(() => {
      return orderList.reduce((sum, order) => {
        const count = Number(order?.count ?? order?.constructionsQTY ?? 0);
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0);
    }, [orderList]);

    const refusableOrders = useMemo(() => {
      const allowedStatuses = new Set([
        "Новий",
        "Очікуємо підтвердження",
        "Очікуємо оплату",
      ]);

      return orderList.filter((order) => allowedStatuses.has(order.status));
    }, [orderList]);

    const orderNumbers = useMemo(() => {
      return orderList
        .map((order) => String(order.number).trim())
        .filter(Boolean);
    }, [orderList]);

    const visibleOrderNumbers = useMemo(() => {
      return orderNumbers.slice(0, 3);
    }, [orderNumbers]);

    const hiddenOrderNumbersCount = useMemo(() => {
      return Math.max(0, orderNumbers.length - visibleOrderNumbers.length);
    }, [orderNumbers.length, visibleOrderNumbers.length]);

    const statusEntries = useMemo(() => {
        const entries =
          calc.statuses && typeof calc.statuses === "object"
            ? Object.entries(calc.statuses)
            : [];

        // Якщо замовлень і статусів немає — це новий прорахунок
        if (entries.length === 0) {
          return [["Новий", null]];
        }

        return entries;
      }, [calc.statuses]);

    // const getStatusClass = useCallback((status) => {
    //     switch (status) {
    //       case "Новий":
    
    
    //         return "text-WS---DarkBlue";
            
    //       case "Очікуємо підтвердження":
    //         return "text-WS---Orange";
    //       case "Очікуємо оплату":
    //         return "text-WS---DarkRed";
    
    //       case "Підтверджений":
    //         return "text-WS---DarkGrey";
    
    //       case "У виробництві":
    //         return "text-WS---DarkBlueProfile"
    //       case "В обробці":
    
    
    //       case "Відмова":
    //         return "text-WS---MiddleGrey";
    
    //       case "Готовий":
    //         return "text-WS---DarkGreen";
    //       case "Відвантажений":
    //         return "text-WS---DarkPurple";
    
    //       default:
    //         return "text-WS---MiddleGrey ";
    //     }
    //   }, []);

    
    const getStatusClass = useCallback((status) => {
        switch (status) {
          case "Новий":
    
    
            return "text-WS-Yellow-Status";
            
          case "Очікуємо підтвердження":
            return "text-WS-Yellow-Status";
          case "Очікуємо оплату":
            return "text-WS-Yellow-Status";
    
          case "Підтверджений":
            return "text-WS-Yellow-Status";
    
          case "У виробництві":
            return "text-WS-Green-Status"
          case "В обробці":
    
    
          case "Відмова":
            return "text-WS---MiddleGrey";
    
          case "Готовий":
            return "text-WS-Green-Status";
          case "Відвантажений":
            return "text-WS-Green-Status";
    
          default:
            return "text-WS---MiddleGrey ";
        }
      }, []);

  

const mainStatus = statusEntries[0][0];
const iconColorClass = getStatusClass(mainStatus);

    return (
      <div
        className={`calc-item calc-item-soft column`}
        style={{
          borderLeft:
            calc.dealerId === calc.authorGuid
              ? "7px solid #BA523B"
              : "7px solid #6B98BF",

          paddingLeft: "12px",
        }}
      >
        {/* ============ CALC SUMMARY ============ */}
        <div className="item-summary justify-between row w-100" onClick={toggleExpanded}>
          {/* <div className="summary-item row no-wrap">
            <span className="icon icon-calculator font-size-24 text-success"></span>
          </div> */}

          <div
  className="summary-item justify-between row w-9 no-wrap"
  style={{ minWidth: "150px" }}
>
  <div className="column">
    {/* Блок Номера замовлення */}
    <div className="column border-bottom pb-0.5">
      {/* <span className="text-[10px] text-grey leading-none">{t("portal_calc.ui.calculation_number")}</span> */}
      <div className="text-[14px] m text-bold text-WS---DarkGrey mt-0.5 calc-primary-text">
        {formatDateTimeShort_2(calc.date, i18n.language)} 
      </div>
    </div>
    
    {/* Блок Дати створення */}
    <div className="column pt-1">
      {/* <span className="text-[10px] text-grey leading-none">Дата </span> */}
      <span className="text-[10px] text-grey leading-none">{t("portal_calc.ui.calculation_number")}</span>
      <div className="text-[13px] text-bold text-WS---DarkGrey mt-0.5 calc-primary-text">
        № {calc.number} 
      </div>
    </div>
  </div>
</div>

<div
  className="summary-item !gap-0 flex min-w-0 flex-col w-8 !p-0 overflow-hidden"
  style={{
    minWidth: "78px",
    flex: "0 0 78px",
  }}
  title={t("portal_calc.ui.orders")}
>
  <span className="text-grey text-[10px] mt-0.5">
    {t("portal_calc.ui.orders")}
  </span>

  {orderNumbers.length === 0 ? (
    <div className="flex items-center">
      <img
        src={listCalcIcon}
        alt={t("portal_calc.ui.orders")}
        className="mr-1 calc-summary-icon"
      />
      <div className="font-size-24 text-WS---DarkBlue font-bold calc-primary-text">
        0
      </div>
    </div>
  ) : (
    <div className="calc-orders-list flex w-full flex-col items-start overflow-hidden text-[12px] leading-tight text-WS---DarkBlue font-semibold">
      {visibleOrderNumbers.map((number) => (
        <div key={number} className="w-full truncate">
          {number}
        </div>
      ))}

      {hiddenOrderNumbersCount > 0 && (
        <button
          type="button"
          className="text-left text-[8px] font-bold text-[#6B98BF] underline underline-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsOrderNumbersOpen(true);
          }}
        >
          +{hiddenOrderNumbersCount} {t("portal_calc.ui.more_short")}
        </button>
      )}
    </div>
  )}
</div>

<div
  className="summary-item flex flex-col w-8"
       title={t("portal_calc.ui.constructions")}
>

  <span className="text-grey text-[10px] mb-1">
    {t("portal_calc.ui.constructions")}
  </span>
  

  <div className="flex items-center">
                  <img 
                  src={windowsIcon} 
     
                  className="align-center mr-1 calc-summary-icon" 
                
                />
    <div className="font-size-24 text-WS---DarkBlue font-bold calc-primary-text">
      {calc.constructionsQTY}
    </div>
  </div>
</div>

          {/* <div
            className="summary-item row w-8 no-wrap"
            title="Кількість конструкцій"
          >
              <img 
                  src={windowsIcon} 
     
                  className="align-center mr-2" 
                
                />

            <div className="font-size-24 text-WS---DarkBlue">
              {calc.constructionsQTY}
            </div>
          </div> */}


<div className="summary-item row w-16 no-wrap items-center">
  <div className="flex flex-row items-center gap-2"> 
    {/* Іконка монет */}
    <img 
      src={moneyCalcIcon} 
      alt="Іконка грошей" 
      className="w-[30px] h-[30px] mr-1 calc-summary-icon calc-summary-icon--money" 
    />
    
    {/* Контейнер для обох сум із мінімальним вертикальним відступом */}
    <div className="flex flex-col justify-center space-y-1">
      
      {/* Блок суми замовлення */}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-grey-400 mb-0.5">{t("order_mobile.labels.order_amount")}</span>
        <div className="text-[15px] text-WS---DarkGreen font-bold">
          { formatMoney2(calc.amount, calc.currency) }
        </div>
      </div>

      {/* Розділова лінія (за бажанням, тоненька і акуратна) */}
      <div className="border-bottom w-full"></div>

      {/* Блок суми боргу */}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-grey-400 mb-0.5">{t("order_mobile.labels.debt_amount")}</span>
        <div className="text-[15px] text-WS---DarkRed font-bold">
          { formatMoney2(calc.debt, calc.currency) }
        </div>
      </div>

    </div>
  </div>
</div>

          <div
            className="summary-item expandable row w-20 align-start space-between cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleViewComments(calc.comments || []);
            }}
            title={t('calc.comment_history')}
          >
            <div className="column" style={{ flex: 1, minWidth: 0 }}>
              <div className="comments-text-wrapper-last ">
               {calc.message || calc.firstMessage || t('calc.no_comments')}
              </div>
            </div>
          </div>

          <div className="summary-item row w-12 no-wrap">
            <div
              className="column gap-1 align-start mr-3"
            
            >
            
              <div className="row align-start" style={{ gap: 0 }}>
                <div
                  className="row file-download"
                  style={{
                    borderBottom: "1px dotted var(--grey-border-color)",
                    paddingBottom: "2px",
                    gap: "3px",
                    cursor:
                    calc.file && calc.file !== "" ? "pointer" : "default",
                    width: "100%",
                  }}
                 onClick={(e) => {
                    e.stopPropagation();
                    setIsFilesModalOpen(true); // Відкриваємо модалку замість прямого завантаження
                  }}
                >
                  {/* <div className="icon-document-file-numbers font-size-20 text-WS---DarkGrey mr-0" /> */}
                  <img 
                    src={fileIcon} 
                    // alt="Вікно" 
                    className="w-[16px] h-[20px] align-center mr-0.5 calc-summary-icon" 
                  
                  />
                  <div className="text-[12px] text-WS---DarkGrey ml-0">
                    <div className="order-number">
                      {calc.file && calc.file !== ""
                        ? t('nav.files')
                        : t('calc.no_file')}
                    </div>
                  </div>
                </div>
              </div>

              {calc.dealer && (
                <div className="text-WS---DarkGrey  row align-start gap-1">

                  {isAdmin ? (
                      <span></span>
                    ) : (
                       <img 
                    src={recipientIcon} 
                    alt="" 
                    className={`mr-0.5 object-contain inline-block align-middle calc-summary-icon ${recipientIconClass}`} 
                    title={
                      isDealerRecipient
                        ? t('calc.recipient_dealer') : t('calc.recipient_other')}
                  />

                    )}
                 
                  <span
                    className="text-dark text-[12px] dealer-wrap dealer-clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCounterpartyOpen(true);
                    }}
                  >
                    {isAdmin ? (
                      <span>{calc.dealer}</span>
                    ) : (
                      <span>{t('calc.recipient_label')}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

         <div className="summary-item row w-16 ">
          <div className="row gap-2 align-center">

            <div className={`icon-info-with-circle font-size-24 calc-status-icon ${iconColorClass}`}></div>

            <div className="column gap-3 text-[13px] flex-wrap scroll-y">
              {statusEntries.length > 0 ? (
                statusEntries.map(([status, count]) => (
                  <div
                    key={status}
                    className={`row gap-3 left  calc-status ${getStatusClass(status)}`}
                  >
                    <div>{t(`statuses.${status}`, status)}</div>
                    <div>({count})</div>
                  </div>
                ))
              ) : (
                <div className="row gap-3 left no-wrap calc-status text-warning">
                  <div>{t('statuses.Новий')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
          <div onClick={(e) => e.stopPropagation()}>
              <CalculationMenu
                calc={calc}
                onEdit={handleEdit}
                onDelete={handleDelete}
                hasOrders={orderList.length > 0}
                hasRefusableOrders={refusableOrders.length > 0}
                onRequestRefusal={() => setIsOrderRefusalOpen(true)}
              />
            </div>
        </div>

  
        {expanded && (
          <div className="item-details  column gap-14">
            {orderList.length === 0 ? (
              <div className="order-item !border-b-0 column gap-14 w-100 align-center">
                <div className="font-size-22 text-grey uppercase float-center">
                  {t('calc.no_orders_yet')}
                </div>
              </div>
            ) : (
              orderList.map((order) => (
                <OrderItemSummaryDesktop
                  key={order.number}
                  order={order}
                  calculationDate={calc.date}
                  calculationConstructionsCount={Number(calc.constructionsQTY ?? 0)}
                  totalOrderConstructions={totalOrderConstructions}
                  onRefresh={reloadCalculations}
                />
              ))
            )}
          </div>
        )}

        <CommentsModal
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          baseTransactionGuid={calc.id}
          transactionTypeId={1}
          manager={isAdmin ? calc.dealerId : calc.manager}
        />
        <OrderFilesPreviewModal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          orderGuid={calc.id}      // GUID розрахунку для запиту до API
          entityType="calculation"
          orderNumber={calc.number} // Номер для заголовка
        />
      <OrderNumbersListModal
        isOpen={isOrderNumbersOpen}
        onClose={() => setIsOrderNumbersOpen(false)}
        numbers={orderNumbers}
      />
      <OrderRefusalModal
        isOpen={isOrderRefusalOpen}
        onClose={() => setIsOrderRefusalOpen(false)}
        calculationGuid={calc.id}
        recipientGuid={isAdmin ? calc.dealerId : calc.manager}
        orders={refusableOrders}
        onSubmitted={() => {
          reloadCalculations?.();
        }}
      />

      <CounterpartyInfoModal
        isOpen={isCounterpartyOpen}
          onClose={() => setIsCounterpartyOpen(false)}
          data={{
            name: calc.recipient,
            phone: calc.recipientPhone,
            address: calc.deliveryAddresses,
            organizationName: calc.organizationName,
            recipientAdditionalInfo: calc.recipientAdditionalInfo,
          }}
        />
      </div>
    );
  },
);
