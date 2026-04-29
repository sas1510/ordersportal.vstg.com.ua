// ================= CalculationItem.jsx =================
import React, { useStateб, useMemo, useState } from "react";
import AdditionalOrderItemSummaryMobile from "./AdditionalOrderItemSummaryMobile";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import CommentsModal from "../Orders/CommentsModal";
import { AdditionalOrderMenu } from "./AdditionalOrderMenu";
import {
  formatDateTimeShort, formatDateHumanShorter 
} from "../../utils/formatters";


export const AdditionalOrderItemMobile = ({
  calc,
  onDelete,
  onEdit,
  onMarkAsRead,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]);
      const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";
    const deleteIcon  = "/assets/icons/DeleteIcon.png";

    const profileReclamation = "/assets/icons/ProfileReclamation.png";


  // const writerGuid = user?.user_id_1c;
  const toggleExpanded = () => setExpanded((prev) => !prev);

  const handleDelete = async () => {
    if (onDelete) await onDelete(calc.id);
  };

    const getStatusClass = (status) => {
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
          case "В роботі":
             return "text-WS---MiddleGreen";
    
    
          case "Відмова":
            return "text-WS---MiddleGrey";
    
          case "Готовий":
            return "text-WS---DarkGreen";
          case "Відвантажено":
            return "text-WS---DarkPurple";
    
          default:
            return "text-WS---MiddleGrey ";
        }
  };

  const handleViewComments = (comments) => {
    if (onMarkAsRead) {
      onMarkAsRead(calc.id);
    }

    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };
  const statusEntries = useMemo(() => {
    return calc.statuses && Object.keys(calc.statuses).length > 0
      ? Object.entries(calc.statuses)
      : [];
  }, [calc.statuses]);


  const hasMainOrder = !!calc.mainOrderNumber;

  const mainStatus = statusEntries.length > 0 ? statusEntries[0][0] : null;
  const iconColorClass = mainStatus ? getStatusClass(mainStatus) : "text-warning";

  const orderList = Array.isArray(calc.orders) ? calc.orders : [];
  const ordersWithNumbers = orderList.filter((order) => order.number);


  return (
    <div
      className="calc-item font-['Inter'] column"
      style={{
        borderTop: calc.numberWEB ? "7px solid #BA523B" : "7px solid #6B98BF",

        paddingLeft: "12px",
      }}
    >
      <div
        className="md:hidden flex flex-col w-full  "
        onClick={toggleExpanded}
      >
        {/* Header - Номер, дата і меню */}
<div className="flex items-stretch justify-between mb-1 w-full gap-3 min-h-[70px] pb-1 border-bottom">
  
  {/* 1. ЛІВА ЧАСТИНА: Номер та Дата + Бордюр справа */}
<div className="basis-2/5  flex flex-col justify-center items-center pr-2 border-right shrink-0">
  <div className="flex flex-col w-full text-start gap-[6px] no-wrap ">
    
    {/* Додано items-center та text-center */}
    <div className="text-base font-bold w-full text-start pb-1 text-WS---DarkGrey border-bottom leading-tight w-fit no-wrap">
      № {calc.number}
    </div>
    
    <div className="text-xs test-start text-WS---DarkGrey no-wrap">
      {formatDateTimeShort(calc.date)}
    </div>

  </div>
</div>


<div className="basis-2/5 flex flex-col items-center min-w-0 border-right px-2">
  {/* 2. ЦЕНТРАЛЬНА ЧАСТИНА: Статуси (гнучка ширина) */}

    <div className="flex items-start gap-1 pb-1 pt-2.5  border-bottom w-full">

  <div className={`icon-info-with-circle mr-1 font-size-24 shrink-0 mt-0.5 ${iconColorClass}`}></div>

 <div className="flex flex-col gap-1 text-[12px] mt-1 overflow-y-auto max-h-[60px] w-full">
      {calc.statuses && Object.keys(calc.statuses).length > 0 ? (
        Object.entries(calc.statuses).map(([status, count]) => (
          <div
            key={status}
            className={`flex items-center gap-2 leading-tight ${getStatusClass(status)}`}
          >
            <div className="truncate">{status}</div>
            <div className="">({count})</div>
          </div>
        ))
      ) : (
        <div className="flex items-center gap-2 text-warning leading-tight">
          <div>Новий</div>
        </div>
      )}
    </div>
  </div>

  {/* ДРУГИЙ БЛОК: Дилер */}
  <div className="flex items-center gap-1 pt-1.5 w-full">
    {/* Іконка профілю (ширина 24px, щоб співпадати з іконкою зверху для симетрії) */}
    <div className="w-[24px] flex justify-center shrink-0">
      <img 
        src={profileReclamation} 
        alt="Дилер" 
        className="mr-1" 
      />
    </div>
    
    <span className="text-[13px] text-WS---DarkGrey truncate leading-tight font-medium">
      {calc.dealer || "Без дилера"}
    </span>
  </div>

</div>
  {/* 3. ПРАВА ЧАСТИНА: Кнопка видалення */}
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
  onTouchEnd={(e) => e.stopPropagation()}
  onPointerDown={(e) => e.stopPropagation()}

>
  
            <AdditionalOrderMenu
              calc={calc}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
 
</div>

</div>
<div className="flex items-stretch justify-between mb-3 w-full min-h-[70px] border-bottom pb-1">
  
  {/* 1. Конструкції */}
  <div className="basis-1/5 flex flex-col items-center justify-center  border-right">
    <div className="flex items-center gap-2">
      <img src={windowsIcon} className="align-center mr-2"  alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {calc.constructionsQTY}
      </span>
    </div>
    <span className="text-grey text-[10px] mt-1">Конструкції</span>
  </div>






  {/* 2. Замовлення */}
  <div className="basis-2/5 flex flex-col w-full items-center justify-center border-right ">
           <div
             className="text-WS---DarkGrey pl-2 text-[16px] w-full row  no-wrap"
            //  style={{ minWidth: "120px" }}
             title="Номер Основного Замовлення"
           >
             <div className="column">
               {hasMainOrder ? (
                 <>
                   <div className="text-[14px] w-full text-bold border-bottom w-full ">
                     № {calc.mainOrderNumber}
                   </div>
                   <div className="text-start text-[13px]  mb-1">
                     {formatDateHumanShorter(calc.mainOrderDate)}
                   </div>
                 </>
               ) : (
                 <div
                   className="text-[16px] text-grey"
                   style={{ whiteSpace: "normal" }}
                 >
                   Без основного замовлення
                 </div>
               )}
             </div>
           </div>
   
  </div>





  {/* 3. Фінанси (Сума та Борг) */}
  <div className="flex items-center pl-3 flex-[2.5]">
    {/* Спільна іконка монет для обох значень */}
    <img src={moneyCalcIcon} className="mr-1" alt="" />
    
    <div className="flex flex-col w-full">
      {/* Сума */}
      <div className="font-size-18 text-WS---DarkGreen font-bold border-bottom pb-1 mb-1">
        {formatMoney2(calc.amount, calc.currency)}
      </div>
      
      {/* Борг */}
      <div className="font-size-18 text-WS---DarkRed font-bold">
        {formatMoney2(calc.debt, calc.currency)}
      </div>
    </div>
  </div>

</div>



  <div className="flex items-stretch justify-between  w-full min-h-[70px] border-bottom pb-1">

<div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div
              className="comments-text-wrapper-last"
              title="Останній коментар / Опис"
            >
              {calc.message || "Без опису / коментарів"}
            </div>
            {/* <ClampedText text={additionalOrder.message || "Без опису / коментарів"} lines={2} /> */}
            <button
              className="btn-comments row"
              style={{ 
                position: "relative", 
                alignSelf: "flex-end", // ПРИТИСКАЄ ТІЛЬКИ КНОПКУ
                marginTop: "auto"     // Опціонально: притисне кнопку до низу, якщо колонка висока
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(calc.comments || []);
              }}
            > <img 
                  src={historyOfMessage} 

                  className="align-center mr-0.5" 
                
                />
              Історія коментарів
            </button>
          </div>

  </div>





  

        {/* Індикатор розкриття */}
        <div className="flex justify-center mt-1 mb-1 pt-1.5">
          <div className="flex items-center gap-1.5">
             <span className="text-WS---DarkBlue font-bold border-b-[2px] border-WS---DarkBlue font-['Inter'] font-size-11">
              {expanded
                ? "Приховати замовлення"
                : `Показати замовлення (${ordersWithNumbers.length})`}
            </span>
            <span
              className={`icon ${expanded ? "icon-chevron-up" : "icon-chevron-down"} font-size-12 text-grey`}
            ></span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="item-details column gap-2.5 mt-2 ">
          {ordersWithNumbers.length === 0 ? (
            <div className="order-item column gap-14 w-100 align-center p-3 md:p-8 !border-0">
              <div className="text-[16px] md:font-size-22 text-grey uppercase text-center">
                Це дозамовлення не містить підпорядкованих замовлень
              </div>
            </div>
          ) : (
            ordersWithNumbers.map((order) => (
              <AdditionalOrderItemSummaryMobile
                key={order.number}
                order={order}
              />
            ))
          )}
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        baseTransactionGuid={calc.guid} // 🔑 GUID з 1С
        transactionTypeId={3} // 🔑 ID типу "Рекламація"
        activePersonId={calc.dealerId}
        // writerGuid={writerGuid} // або з context
      />
    </div>
  );
};
