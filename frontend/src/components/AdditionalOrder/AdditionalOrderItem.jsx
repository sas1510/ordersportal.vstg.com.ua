import React, { useState } from "react";
import { formatMoney } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "./CommentsModal";
import { AdditionalOrderMenu } from "./AdditionalOrderMenu"; // Використовуємо перейменоване меню
// Компоненти для замовлень, які можуть бути вкладені
import AdditionalOrderItemSummaryDesktop from './AdditionalOrderItemSummaryDesktop';
// import AdditionalOrderItemSummaryMobile from './AdditionalOrderItemSummaryMobile';
import useWindowWidth from '../../hooks/useWindowWidth';
import axiosInstance from "../../api/axios";
import { User, ClipboardCheck, LayoutGrid, Calendar } from 'lucide-react'; // Імпорт іконок
import { formatDateHumanShorter } from "../../utils/formatters"; // Припускаємо, що це ваша утиліта
import "./AdditionalOrderItem.css"
// ================= AdditionalOrderItem.jsx (Замість CalculationItem.jsx) =================

export const AdditionalOrderItem = ({ calc, onDelete, onEdit }) => {
  // calc тепер представляє Additional Order (Додаткове Замовлення)
  const additionalOrder = calc; 
  
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;


  // Перевірка наявності даних про основне замовлення
  const hasMainOrder = !!additionalOrder.mainOrderNumber;

  const handleEdit = (updatedOrder) => { 
    if (onEdit) onEdit(updatedOrder);
  };
  
  // ... handleDownload, handleDelete, handleViewComments (логіка залишається незмінною) ...
  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(`/additional-orders/${additionalOrder.id}/download/file/`, { 
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${additionalOrder.number}_file.zip`); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Помилка при завантаженні файлу Дод. Замовлення:", error);
    }
  };

  const handleDelete = async () => {
    if (onDelete) await onDelete(additionalOrder.id);
  };

  const handleViewComments = (comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  const orderList = Array.isArray(additionalOrder.orders) ? additionalOrder.orders : [];
const ordersWithNumbers = orderList.filter(order => order.number);
  const getStatusClass = (status) => {
    switch (status) {
      case "Новий":
      case "В обробці":
      case "У виробництві":
      case "Підтверджений":
        return "text-info";
      case "Очікуємо оплату":
      case "Очікуємо підтвердження":
      case "Відмова":
        return "text-danger";
      case "Готовий":
      case "Відвантажений":
        return "text-success";
      default:
        return "text-grey";
    }
  };

  return (
    <div className="calc-item column"
      style={{
          borderLeft: additionalOrder.numberWEB
          ? "4px solid #f38721ff" 
          : "4px solid #5e83bf",

          paddingLeft: "12px"}}>
      {/* ============ ADDITIONAL ORDER SUMMARY ============ */}
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        
        {/* 1. Іконка та номер Дод. Замовлення */}
        <div className="summary-item row  no-wrap">
          <ClipboardCheck className="font-size-24 text-success" title="Додаткове Замовлення" />
        </div>

        <div className="summary-item row w-9 no-wrap" style={{ minWidth: '130px' }}>
          <div className="column">
            <div className="font-size-18 text-info border-bottom" >№ {additionalOrder.number}</div>
            <div className="text-danger">{formatDateHumanShorter(additionalOrder.dateRaw)}</div>
          </div>
        </div>

        {/* 2. Кількість конструкцій */}
        <div className="summary-item row w-6 no-wrap" title="Кількість конструкцій в дозамовленні">
          <LayoutGrid className="font-size-24 text-info" />
          <div className="font-size-24 text-danger">{additionalOrder.constructionsQTY}</div>
        </div>

        {/* 3. Номер Основного Замовлення (з перевіркою) */}
        <div className="summary-item row w-9 no-wrap" style={{ minWidth: '120px' }} title="Номер Основного Замовлення">
          <div className="column">
            {hasMainOrder ? (
              <>
                <div className="font-size-18 text-info border-bottom">№ {additionalOrder.mainOrderNumber}</div>
                <div className="text-danger">
                  {formatDateHumanShorter(additionalOrder.mainOrderDate)}
                </div>
              </>
            ) : (
              <div className="font-size-14 text-grey" style={{whiteSpace: 'normal'}}>Без основного замовлення</div>
            )}
          </div>
        </div>

        {/* 4. Сума / Борг */}
        <div className="summary-item row w-14 no-wrap">
          <div className="row gap-14 align-center">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="column">
              <div className="font-size-18 text-success border-bottom">{formatMoney(additionalOrder.amount)}</div>
              <div className="font-size-16 text-danger">{formatMoney(additionalOrder.debt)}</div>
            </div>
          </div>
        </div>

        {/* 5. Коментарі / Опис Рекламації */}
        <div className="summary-item expandable row w-30 align-start space-between">
          <div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div className="comments-text-wrapper-last" title="Останній коментар / Опис">
              {additionalOrder.message || "Без опису / коментарів"}
            </div>
  {/* <ClampedText text={additionalOrder.message || "Без опису / коментарів"} lines={2} /> */}
            <button
              className="btn-comments"
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(additionalOrder.comments || []);
              }}
            >
              💬 Історія коментарів
            </button>
          </div>
        </div>

        {/* 6. Дилер */}
        <div
  className="summary-item flex items-center w-[200px] shrink-0"
  title={additionalOrder.dealer}
>
  {additionalOrder.dealer && (
    <div className="flex items-center gap-1 text-grey font-size-14 whitespace-normal break-words">
      <User className="w-4 h-4 text-dark shrink-0" />
      <span className="text-dark leading-snug">
        {additionalOrder.dealer}
      </span>
    </div>
  )}
</div>


        {/* 7. Статуси */}
        <div className="summary-item row w-15 ">
          <div className="row gap-1 align-center">
            <div className="icon-info-with-circle font-size-24 text-info"></div>

            <div className="column gap-3 font-size-12  scroll-y">
              {additionalOrder.statuses && Object.keys(additionalOrder.statuses).length > 0 ? (
                Object.entries(additionalOrder.statuses).map(([status, count]) => (
                  <div
                    key={status}
                    className={`row gap-3 left  calc-status ${getStatusClass(status)}`}
                  >
                    <div>{status}</div>
                    <div>({count})</div>
                  </div>
                ))
              ) : (
                <div className="row gap-3 left no-wrap calc-status text-warning">
                  <div>Новий</div>
                </div>
              )}
            </div>
          </div>
        </div>
        

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
            <div className="order-item column gap-14 w-100 align-center">
              <div className="font-size-22 text-grey uppercase float-center">
                Це дозамовлення не містить підпорядкованих замовлень
              </div>
            </div>
          ) : (

            ordersWithNumbers.map((order) => (

                <AdditionalOrderItemSummaryDesktop key={order.number} order={order} />
              
            ))
          )}
        </div>
      )}

      {/* Модалка коментарів */}
      <CommentsModal
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
      />

    </div>
  );
};