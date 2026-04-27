import React, { useState, useMemo } from "react";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "../Orders/CommentsModal";
import { AdditionalOrderMenu } from "./AdditionalOrderMenu"; // Використовуємо перейменоване меню
// Компоненти для замовлень, які можуть бути вкладені
import AdditionalOrderItemSummaryDesktop from "./AdditionalOrderItemSummaryDesktop";
// import AdditionalOrderItemSummaryMobile from './AdditionalOrderItemSummaryMobile';


import { User, ClipboardCheck, LayoutGrid, Calendar } from "lucide-react"; // Імпорт іконок
import { formatDateHumanShorter } from "../../utils/formatters"; // Припускаємо, що це ваша утиліта
import "./AdditionalOrderItem.css";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

export const AdditionalOrderItem = ({
  calc,
  onDelete,
  onEdit,
  onMarkAsRead,
  reloadCalculations
}) => {
  const additionalOrder = calc;

  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]);

  const windowsIcon = "/assets/icons/WindowsIconCalc.png";
  const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";

  const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const profileReclamation = "/assets/icons/ProfileReclamation.png";




  // const windowWidth = useWindowWidth();
  // const isMobile = windowWidth < 1024;

  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";

  const hasMainOrder = !!additionalOrder.mainOrderNumber;

  const handleEdit = (updatedOrder) => {
    if (onEdit) onEdit(updatedOrder);
  };

  // const handleDownload = async () => {
  //   try {
  //     const response = await axiosInstance.get(
  //       `/additional-orders/${additionalOrder.id}/download/file/`,
  //       {
  //         responseType: "blob",
  //       },
  //     );

  //     const url = window.URL.createObjectURL(response.data);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", `${additionalOrder.number}_file.zip`);
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Помилка при завантаженні файлу Дод. Замовлення:", error);
  //   }
  // };

  const handleDelete = async () => {
    if (onDelete) await onDelete(additionalOrder.id);
  };

  const handleViewComments = (comments) => {
    if (onMarkAsRead) {
      onMarkAsRead(additionalOrder.id);
    }

    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  const orderList = Array.isArray(additionalOrder.orders)
    ? additionalOrder.orders
    : [];
  const ordersWithNumbers = orderList.filter((order) => order.number);


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

  const statusEntries = useMemo(() => {
    return additionalOrder.statuses && Object.keys(additionalOrder.statuses).length > 0
      ? Object.entries(additionalOrder.statuses)
      : [];
  }, [additionalOrder.statuses]);


  const mainStatus = statusEntries.length > 0 ? statusEntries[0][0] : null;
  const iconColorClass = mainStatus ? getStatusClass(mainStatus) : "text-warning";


  return (
    <div
      className="calc-item column"
      style={{
        borderLeft: additionalOrder.numberWEB
          ? "7px solid #BA523B"
          : "7px solid #6B98BF",

        paddingLeft: "12px",
      }}
    >
      {/* ============ ADDITIONAL ORDER SUMMARY ============ */}
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        {/* 1. Іконка та номер Дод. Замовлення */}
        {/* <div className="summary-item row  no-wrap">
          <span
            className="font-size-24 icon-add-to-list text-success"
            title="Додаткове Замовлення"
          />
        </div> */}

        <div
          className="summary-item row w-9 no-wrap"
          style={{ minWidth: "130px" }}
        >
          <div className="column">
            <div className="text-[16px] text-bold text-WS---DarkGrey border-bottom">
              № {additionalOrder.number}
            </div>
            <div className="text-[13px] text-WS---DarkGrey">
              {formatDateHumanShorter(additionalOrder.dateRaw)}
            </div>
          </div>
        </div>

        {/* 2. Кількість конструкцій */}
        <div
          className="summary-item row w-8 no-wrap"
          title="Кількість конструкцій в дозамовленні"
        >
           <img 
              src={windowsIcon} 
              // alt="Вікно" 
              className="align-center mr-0.5" 
            
            />
          <div className="font-size-24 text-WS---DarkBlue">
            {additionalOrder.constructionsQTY}
          </div>
        </div>

        {/* 3. Номер Основного Замовлення (з перевіркою) */}
        <div
          className="text-WS---DarkGrey summary-item row w-10 no-wrap"
          style={{ minWidth: "120px" }}
          title="Номер Основного Замовлення"
        >
          <div className="column">
            {hasMainOrder ? (
              <>
                <div className="text-[16px]  text-bold border-bottom w-full ">
                  № {additionalOrder.mainOrderNumber}
                </div>
                <div className="text-start text-[13px]  mb-1">
                  {formatDateHumanShorter(additionalOrder.mainOrderDate)}
                </div>
              </>
            ) : (
              <div
                className="text-[15px] text-grey"
                style={{ whiteSpace: "normal" }}
              >
                Без основного замовлення
              </div>
            )}
          </div>
        </div>

        {/* 4. Сума / Борг */}
        <div className="summary-item row w-16 no-wrap">
          <div className="row gap-2 align-center">
            <img 
                  src={moneyCalcIcon} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
            <div className="column">
              <div className="text-[16px] w-full text-WS---DarkGreen font-bold border-bottom">
                {formatMoney2(additionalOrder.amount, additionalOrder.currency)}
              </div>
             <div className="text-[16px]  text-WS---DarkRed font-bold">
                {formatMoney2(additionalOrder.debt, additionalOrder.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Коментарі / Опис Рекламації */}
        <div className="summary-item expandable row w-24 align-start space-between">
          <div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div
              className="comments-text-wrapper-last"
              title="Останній коментар / Опис"
            >
              {additionalOrder.message || "Без опису / коментарів"}
            </div>
            {/* <ClampedText text={additionalOrder.message || "Без опису / коментарів"} lines={2} /> */}
            <button
              className="btn-comments row"
              style={{ position: "relative", alignSelf: "flex-end", 
                marginTop: "auto"    }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(additionalOrder.comments || []);
              }}
            > <img 
                  src={historyOfMessage} 

                  className="align-center mr-0.5" 
                
                />
              Історія коментарів
            </button>
          </div>
        </div>

        {/* 6. Дилер */}
        <div className="summary-item flex flex-col w-[200px] shrink-0 font-['Inter']">
  
  {/* ПЕРШИЙ БЛОК: Статуси */}
  <div className="flex items-start gap-1 pb-1 pt-1 border-bottom w-full">
    {/* Іконка статусу (тепер зліва від усього списку статусів) */}
    <div className={`icon-info-with-circle mr-1 text-[24px] shrink-0 mt-0.5 ${iconColorClass}`}></div>

    {/* Список статусів у стовпчик */}
    <div className="flex flex-col gap-1 text-[12px] mt-1 overflow-y-auto max-h-[60px] w-full">
      {additionalOrder.statuses && Object.keys(additionalOrder.statuses).length > 0 ? (
        Object.entries(additionalOrder.statuses).map(([status, count]) => (
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
      {additionalOrder.dealer || "Без дилера"}
    </span>
  </div>

</div>
        {/* 7. Статуси */}
        

        {/* 8. Меню */}
        <div onClick={(e) => e.stopPropagation()}>
          <AdditionalOrderMenu
            calc={additionalOrder}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* ============ ORDER DETAILS (Якщо є підпорядковані замовлення) ============ */}

      {/* ============ ORDER DETAILS (Якщо є підпорядковані замовлення) ============ */}

      {/* ============ ORDER DETAILS (Якщо є підпорядковані замовлення) ============ */}

      {expanded && (
        <div className="item-details column gap-14">
          {/* 🔥 Використовуємо ordersWithNumbers для перевірки */}
          {ordersWithNumbers.length === 0 ? (
            <div className="order-item column gap-14 w-100 align-center !border-0 !p-0">
              <div className="font-size-22 text-grey uppercase float-center">
                Це дозамовлення не містить підпорядкованих замовлень
              </div>
            </div>
          ) : (
            ordersWithNumbers.map((order) => (
              <AdditionalOrderItemSummaryDesktop
                key={order.number}
                order={order}
                onRefresh={reloadCalculations}
              />
            ))
          )}
        </div>
      )}

      {/* Модалка коментарів */}
      {/*       <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={selectedComments}
        orderId={additionalOrder.id}
        onAddComment={async (text) => {
          try {
            await axiosInstance.post(`/additional-orders/${additionalOrder.number}/add-comment/`, { message: text }); 
            
            const res = await axiosInstance.get(`/additional-orders/${additionalOrder.number}/comments/`);
            setSelectedComments(res.data);
          } catch (err) {
            console.error("Помилка при додаванні коментаря:", err);
          }
        }}
      /> */}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        baseTransactionGuid={additionalOrder.guid} // 🔑 GUID з 1С
        transactionTypeId={3}
        // activePersonId={additionalOrder.dealerId}

        manager={
          isAdmin ? additionalOrder.dealerId : additionalOrder.managerLink
        }

        // 🔑 ID типу "Рекламація"
        // writerGuid={writerGuid} // або з context
      />
    </div>
  );
};
 