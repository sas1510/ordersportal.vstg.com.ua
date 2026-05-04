// ================= CalculationItemMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderItemSummaryMobile from "./OrderItemSummaryMobile";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import {
  formatDateTimeShort,
} from "../../utils/formatters";

import { useNotification } from "../../hooks/useNotification";
import CounterpartyInfoModal from "./CounterpartyInfoModal";

import DeleteConfirmModal from "./DeleteConfirmModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";


export const CalculationItemMobile = React.memo(
  ({ calc, onDelete, _onEdit, onMarkAsRead, reloadCalculations }) => {
    //
    const [expanded, setExpanded] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [_selectedComments, setSelectedComments] = useState([]);
    const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { addNotification } = useNotification();


    
    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
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
        console.error("Помилка при завантаженні файлу прорахунку:", error);
        addNotification(
          "Не вдалося завантажити файл. Можливо, він відсутній на сервері.",
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


    const statusEntries = useMemo(() => {
      return calc.statuses ? Object.entries(calc.statuses) : [];
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
  <div className="flex flex-col w-full text-start gap-[6px] no-wrap ">
    

    <div className="text-base font-bold w-full text-start pb-1 text-WS---DarkGrey border-bottom leading-tight w-fit no-wrap">
      № {calc.number}
    </div>
    
    <div className="text-xs test-start text-WS---DarkGrey no-wrap">
      {formatDateTimeShort(calc.date)}
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

            <span className="icon-info-with-circle text-[20px] shrink-0 mr-2"></span>
            
            <span className="text-[13px] font-normal">
              {status} ({count})
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
    alt="Видалити" 
    onClick={(e) => {
      e.stopPropagation();
      if (!hasOrders) setIsDeleteModalOpen(true);
    }}
    className={` transition-all
      ${hasOrders 
        ? "opacity-20 grayscale cursor-not-allowed" 
        : "cursor-pointer active:scale-95 hover:brightness-110 icon-calc-delete"
      }`} 
    title={hasOrders ? "Неможливо видалити: є замовлення" : "Видалити прорахунок"}
  />
</div>

</div>


<div className="flex items-stretch justify-between mb-3 w-full min-h-[70px] border-bottom pb-1">
  

  <div className="basis-1/5 flex flex-col items-center justify-center  border-right">
    <div className="flex items-center gap-2">
      <img src={windowsIcon} className="align-center mr-2"  alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {calc.constructionsQTY}
      </span>
    </div>
    <span className="text-grey text-[10px] mt-1">Конструкції</span>
  </div>

 
  <div className="basis-1/5 flex flex-col items-center justify-center border-right ">
    <div className="flex items-center gap-2">
      <img src={listCalcIcon} className="align-center mr-2"  alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {orderList.length}
      </span>
    </div>
    <span className="text-grey text-[10px] mt-1">Замовлення</span>
  </div>


  <div className="flex items-center pl-3 flex-[2.5]">
    
    <img src={moneyCalcIcon} className="mr-1" alt="" />
    
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
  

  <div className="flex pr-4 border-right flex-[1.9]" onClick={(e) => e.stopPropagation()}> 

    <div className="flex flex-col h-full justify-between">
      <div className="comments-text-wrapper-last text-WS---DarkGrey text-[13px] mb-1">
        {calc.message || "Без коментарів"}
      </div>
      
      <button
        className="btn-comments flex items-center gap-1.5 p-0 bg-transparent border-0"
        onClick={(e) => {
          e.stopPropagation();
          handleViewComments(calc.comments || []);
        }}
      >
        <img src={historyOfMessage} className="mr-1" alt="" />
        <span className="text-[13px]">Історія коментарів</span>
      </button>
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
          if (calc.file) handleDownload(calc);
        }}
      >
        <img src={fileIcon} className="w-[16px] h-[20px] mr-1.5" alt="" />
        <div className="text-[13px] text-WS---DarkGrey">
          {calc.file ? `${calc.number}.zkz` : "Немає файлу"}
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
          <img src={recipientIcon} className={`mr-1 ${recipientIconClass}`} alt="" />
          <span className="text-[13px] text-WS---DarkGrey">
            {isAdmin ? calc.dealer : "Отримувач"}
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
                  ? "Приховати замовлення"
                  : `Показати замовлення (${orderList.length})`}
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
                  Ще немає замовлень по цьому прорахунку
                </div>
              </div>
            ) : (
              orderList.map((order) => (
                <OrderItemSummaryMobile key={order.number} order={order} calculationDate={calc.date}
                  onRefresh={reloadCalculations} />
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
