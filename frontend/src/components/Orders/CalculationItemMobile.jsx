// ================= CalculationItemMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderItemSummaryMobile from "./OrderItemSummaryMobile";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import axiosInstance from "../../api/axios";
import {
  formatDateTimeShort_2,
} from "../../utils/formatters";

import { useNotification } from "../../hooks/useNotification";
import CounterpartyInfoModal from "./CounterpartyInfoModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { useTranslation } from "react-i18next";
import OrderFilesPreviewModal from "./OrderFilesPreviewModal";
import OrderNumbersListModal from "./OrderNumbersListModal";
import OrderRefusalModal from "./OrderRefusalModal";

export const CalculationItemMobile = React.memo(
  ({ calc, onDelete, onEdit, onMarkAsRead, reloadCalculations }) => {
    //
    const {t, i18n} = useTranslation();
    const locale = i18n.language;
    const [expanded, setExpanded] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [_selectedComments, setSelectedComments] = useState([]);
    const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [isOrderNumbersOpen, setIsOrderNumbersOpen] = useState(false);
    const [isOrderRefusalOpen, setIsOrderRefusalOpen] = useState(false);
    

    const { addNotification } = useNotification();


    
    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";
    const deleteIcon  = "/assets/icons/DeleteIcon.png";


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

    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

    // const handleEdit = useCallback(
    //   (updatedCalc) => {
    //     if (onEdit) onEdit(updatedCalc);
    //   },
    //   [onEdit],
    // );

    const hasOrders = useMemo(
      () =>
        Array.isArray(calc.orders) &&
        calc.orders.some((o) => o.number && String(o.number).trim() !== ""),
      [calc.orders],
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
        addNotification(
          t("calc.error_download"), "warning"
        );
      }
    }, [calc.id, calc.fileGuid, calc.file, calc.number]);

    // const handleDelete = useCallback(async () => {
    //   if (onDelete) await onDelete(calc.id);
    // }, [onDelete, calc.id]);

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

      if (entries.length === 0) {
        return [["Новий", null]];
      }

      return entries;
    }, [calc.statuses]);


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

    return (
      <div
        className="calc-item column"
        style={{
          borderTop:
            calc.dealerId === calc.authorGuid
              ? "7px solid #BA523B"
              : "7px solid #6B98BF",

          paddingLeft: "12px",
        }}
      >

        <div
          className="md:hidden flex flex-col w-full"
          onClick={toggleExpanded}
        >

<div className="flex items-stretch justify-between mb-1 w-full gap-3 min-h-[70px] pb-1 border-bottom">
  

<div className="basis-2/5  flex flex-col justify-center items-center pr-2 border-right shrink-0">
  <div className="flex flex-col w-full text-start gap-[6px]">
    <div className="w-full text-start pb-1 text-[12px] font-semibold text-WS---DarkGrey border-bottom leading-none whitespace-nowrap overflow-hidden text-ellipsis">
      {formatDateTimeShort_2(calc.date, locale)}
    </div>

    <div className="flex flex-col pt-0.5">
      <span className="text-[10px] text-grey leading-none">
        {t("portal_calc.ui.calculation_number")}
      </span>
      <div
        className="text-[13px] font-bold text-start text-WS---DarkGrey leading-tight"
        style={{
          maxWidth: "120px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          whiteSpace: "normal",
          wordBreak: "break-all",
        }}
        title={`№ ${calc.number}`}
      >
        № {calc.number}
      </div>
    </div>
  </div>
</div>


<div className="basis-2/5 flex items-center min-w-0 border-right px-2">
  {statusEntries.length > 0 && (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {statusEntries.map(([status, count]) => {
        const statusClass = getStatusClass(status); 
        
        return (
          <div key={status} className={`flex items-center gap-1 ${statusClass}`}>

            <span className="icon-info-with-circle text-[20px] shrink-0 mr-1"></span>
            
            <span className="text-[12px] font-normal">
              {count == null
                ? t(`statuses.${status}`, status)
                : `${t(`statuses.${status}`, status)} (${count})`}
            </span>
          </div>
        );
      })}
    </div>
  )}
</div>


  {/* <div className="flex-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
    <button
      className={`btn-delete-mobile flex items-center justify-center ${hasOrders ? "opacity-20 grayscale" : "text-danger"}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasOrders) setIsDeleteModalOpen(true);
      }}
      disabled={hasOrders}
      style={{ background: 'transparent', border: 'none', padding: '4px' }}
    >
      <span className="icon icon-trash font-size-20"></span>
    </button>
  </div> */}

<div 
  className="flex-1 shrink-0 ml-auto flex justify-center items-center" 
  onClick={(e) => e.stopPropagation()}
>
  <img 
    src={deleteIcon} 
    alt={
      !hasOrders
        ? t("portal_calc.ui.delete_calc_allowed")
        : refusableOrders.length > 0
          ? t("portal_calc.ui.request_order_refusal")
          : t("portal_calc.ui.order_refusal_unavailable")
    }
    onClick={(e) => {
      e.stopPropagation();
      if (!hasOrders) {
        setIsDeleteModalOpen(true);
        return;
      }

      if (refusableOrders.length > 0) {
        setIsOrderRefusalOpen(true);
      }
    }}
    className={` transition-all
      ${hasOrders && refusableOrders.length === 0
        ? "opacity-20 grayscale cursor-not-allowed" 
        : "cursor-pointer active:scale-95 hover:brightness-110 icon-calc-delete"
      }`} 
    title={
      !hasOrders
        ? t("portal_calc.ui.delete_calc_allowed")
        : refusableOrders.length > 0
          ? t("portal_calc.ui.request_order_refusal")
          : t("portal_calc.ui.order_refusal_unavailable")
    }
  />

</div>

</div>


<div className="flex items-stretch justify-between mb-3 w-full min-h-[70px] border-bottom pb-1">
  

<div className="basis-1/5 flex min-w-0 flex-col items-center justify-center overflow-hidden border-right">
  {orderNumbers.length === 0 ? (
    <div className="flex items-center gap-2">
      <img src={listCalcIcon} className="mr-1 calc-summary-icon" alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        0
      </span>
    </div>
  ) : (
    <div className="flex w-full flex-col items-center overflow-hidden text-[10px] leading-tight text-WS---DarkBlue font-bold">
      {visibleOrderNumbers.map((number) => (
        <span
          key={number}
          className="block w-full overflow-hidden break-all text-center leading-[1.1]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={number}
        >
          {number}
        </span>
      ))}

      {hiddenOrderNumbersCount > 0 && (
        <button
          type="button"
          className="text-[8px] font-bold text-[#6B98BF] underline underline-offset-2"
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

  <span className="text-grey text-[10px]">
    {t("portal_calc.ui.orders")}
  </span>
</div>

  <div className="basis-1/5 flex flex-col items-center justify-center border-right">
    <div className="flex items-center gap-2">
      <img src={windowsIcon} className="align-center mr-2 calc-summary-icon" alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {calc.constructionsQTY}
      </span>
    </div>
    <span className="text-grey text-[10px] mt-1">{t("portal_calc.ui.constructions")}</span>
  </div>


  <div className="flex items-center pl-3 flex-[2.5]">
    
    <img src={moneyCalcIcon} className="mr-1 calc-summary-icon calc-summary-icon--money-green" alt="" />
    
    <div className="flex flex-col w-full">
 
      <div className="font-size-18 text-WS---DarkGreen font-bold border-bottom pb-1 mb-1">
        {formatMoney2(calc.amount, calc.currency)}
      </div>
      

      <div className="font-size-18 text-WS---DarkRed font-bold">
        {formatMoney2(calc.debt, calc.currency)}
      </div>
    </div>
  </div>

</div>




<div className="flex items-stretch justify-between mb-3 w-full min-h-[70px] border-bottom pb-2 gap-4">
  

  <div
    className="flex pr-4 border-right flex-[1.9] cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      handleViewComments(calc.comments || []);
    }}
    title={t("calc.comment_history")}
  > 

    <div className="flex flex-col h-full justify-between">
      <div className="comments-text-wrapper-last text-WS---DarkGrey text-[13px] mb-1">
        {calc.message || calc.firstMessage ||  t("calc.no_comments")}
      </div>
    </div>
  </div>

  <div className="flex-1 pl-1">
    <div className="flex flex-col h-full gap-2 justify-center">
      
  
      <div 
        className="flex items-center gap-2 pb-1"
        style={{ 
          cursor: calc.file ? "pointer" : "default", 
          borderBottom: '1px dotted var(--grey-border-color)' 
        }}
         onClick={(e) => {
          e.stopPropagation();
          setIsFilesModalOpen(true); // Відкриваємо модалку замість прямого завантаження
        }}
      >
        <img src={fileIcon} className="w-[16px] h-[20px] mr-1.5 calc-summary-icon" alt="" />
        <div className="text-[13px] text-WS---DarkGrey">
          {calc.file ? t('nav.files')
                        : t('calc.no_file')}
        </div>
      </div>


      {calc.dealer && (
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsCounterpartyOpen(true);
          }}
        >
          <img src={recipientIcon} className={`mr-1 calc-summary-icon ${recipientIconClass}`} alt="" />
          <span className="text-[13px] text-WS---DarkGrey">
            {isAdmin ? calc.dealer : t("calc.recipient_label")}
          </span>
        </div>
      )}
    </div>
  </div>
</div>
      

          {/* Статистика - Grid 2x2 */}


          {/* Статуси замовлень */}
          {/* {statusEntries.length > 0 && (
            <div className="mb-2 p-1.5 bg-gray-50 rounded">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="icon-info-with-circle font-size-14 text-info"></span>
                <span className="text-grey font-size-11">Статуси:</span>
              </div>
              <div className="flex flex-wrap gap-1.2">
                {statusEntries.map(([status, count]) => (
                  <div
                    key={status}
                    className={`px-2 py-1 rounded font-size-10 ${getStatusClass(status)} bg-white border`}
                  >
                    {status} ({count})
                  </div>
                ))}
              </div>
            </div>
          )} */}


          <div className="flex justify-center mb-2 ">
            <div className="flex items-center gap-1.5">
              <span className="text-WS---DarkBlue font-bold border-b-[2px] border-WS---DarkBlue font-['Inter'] font-size-11">
                {expanded
                  ? t("portal_calc.ui.hide_orders") 
                  : t("portal_calc.ui.show_orders", { count: orderList.length })}
              </span>
              <span
                className={`icon text-WS---DarkBlue  ${expanded ? "icon-chevron-up" : "icon-chevron-down"} font-size-12 text-grey`}
              ></span>
            </div>
          </div>
        </div>


        {expanded && (
          <div className="item-details column gap-2.5 mt-2">
            {orderList.length === 0 ? (
              <div className="order-item column gap-14 w-100 align-center !pt-3 md:!pt-8 !border-b-0">
                <div className="font-size-16 md:font-size-22 text-center text-WS---DarkGrey  uppercase text-center">
                  {t("calc.no_orders_yet")}
                </div>
              </div>
            ) : (
              orderList.map((order) => (
                <OrderItemSummaryMobile
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

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            onDelete(calc.id);
            setIsDeleteModalOpen(false);
          }}
          itemData={calc}
          itemType="calculation"
        />

        <OrderFilesPreviewModal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          orderGuid={calc.id}      // GUID розрахунку для запиту до API
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
