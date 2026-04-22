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
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import CounterpartyInfoModal from "./CounterpartyInfoModal";

import DeleteConfirmModal from "./DeleteConfirmModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

// КРОК 1: Змінюємо експорт на React.memo
export const CalculationItemMobile = React.memo(
  ({ calc, onDelete, _onEdit, onMarkAsRead }) => {
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


    const {  role } = useAuthGetRole();
    const isAdmin = role === "admin";
    // Перевірка, чи є дилер отримувачем
    const isDealerRecipient = useMemo(() => {
      if (!calc.recipient || !calc.dealer) return false;
      return (
        calc.recipient.trim().toLowerCase() === calc.dealer.trim().toLowerCase()
      );
    }, [calc.recipient, calc.dealer]);

    // Клас для іконки залежно від типу отримувача
    const recipientIconClass = isDealerRecipient
      ? "text-success" // дилер = отримувач
      : "text-warning"; // менеджер / інший отримувач

    // 1. Мемоїзація функцій-обробників за допомогою useCallback
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

        // Якщо є непрочитані — викликаємо функцію "прочитано"
        if (calc.hasUnreadMessages && onMarkAsRead) {
          onMarkAsRead(calc.id);
        }
      },
      [calc.id, calc.hasUnreadMessages, onMarkAsRead],
    );

    // 2. Мемоїзація списку замовлень за допомогою useMemo
    const orderList = useMemo(() => {
      if (!Array.isArray(calc.orders)) return [];

      // Фільтруємо замовлення: залишаємо тільки ті, де номер не порожній
      // і не складається лише з пробілів.
      // Це відсікає об'єкти з "number": "" з вашого JSON.
      return calc.orders.filter(
        (order) => order.number && String(order.number).trim() !== "",
      );
    }, [calc.orders]);

    // КРОК 3: Мемоїзація Object.entries (не обов'язково, але корисно для великих об'єктів)
    const statusEntries = useMemo(() => {
      return calc.statuses ? Object.entries(calc.statuses) : [];
    }, [calc.statuses]);

    // 3. Мемоїзація функції, що повертає клас статусу, за допомогою useCallback
    const getStatusClass = useCallback((status) => {
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
    }, []); // Немає залежностей, оскільки логіка є статичною

    return (
      <div
        className="calc-item column"
        style={{
          borderTop:
            calc.dealerId === calc.authorGuid
              ? "4px solid #BA523B"
              : "4px solid #6B98BF",

          paddingLeft: "12px",
        }}
      >
        {/* ============ MOBILE VERSION (COMPACT) ============ */}
        <div
          className="md:hidden flex flex-col w-full"
          onClick={toggleExpanded}
        >
          {/* Header - Номер, дата і меню */}
<div className="flex items-stretch justify-between mb-1 w-full gap-3  pb-1 border-bottom">
  
  {/* 1. ЛІВА ЧАСТИНА: Номер та Дата + Бордюр справа */}
  <div className="flex items-center pr-1 border-right shrink-0">
    <div className="flex flex-col gap-0.5">
      <div className="text-base font-bold text-WS---DarkGrey border-bottom leading-tight">
        № {calc.number}
      </div>
      <div className="text-xs text-WS---DarkGrey">
        {formatDateTimeShort(calc.date)}
      </div>
    </div>
  </div>

  {/* 2. ЦЕНТРАЛЬНА ЧАСТИНА: Статуси (гнучка ширина) */}
<div className="flex-1 flex items-center min-w-0 border-right px-2">
    {statusEntries.length > 0 && (
      <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
        <span className="icon-info-with-circle font-size-14 text-info shrink-0"></span>
        {statusEntries.map(([status, count]) => (
          <div
            key={status}
            className={`font-size-10 ${getStatusClass(status)} whitespace-nowrap`}
          >
            {status} ({count})
          </div>
        ))}
      </div>
    )}
  </div>

  {/* 3. ПРАВА ЧАСТИНА: Кнопка видалення */}
  <div className="shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
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
  </div>

</div>


<div className="flex items-stretch justify-between mb-3 w-full border-bottom pb-1">
  
  {/* 1. Конструкції */}
  <div className="flex flex-col items-center justify-center pr-3 border-right flex-1">
    <div className="flex items-center gap-2">
      <img src={windowsIcon} className="align-center mr-2"  alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {calc.constructionsQTY}
      </span>
    </div>
    <span className="text-grey font-size-12 mt-1">Конструкції</span>
  </div>

  {/* 2. Замовлення */}
  <div className="flex flex-col items-center justify-center px-3 border-right flex-1">
    <div className="flex items-center gap-2">
      <img src={listCalcIcon} className="align-center mr-2"  alt="" />
      <span className="font-size-24 font-bold text-WS---DarkBlue">
        {orderList.length}
      </span>
    </div>
    <span className="text-grey font-size-12 mt-1">Замовлення</span>
  </div>

  {/* 3. Фінанси (Сума та Борг) */}
  <div className="flex items-center pl-3 flex-[1.5]">
    {/* Спільна іконка монет для обох значень */}
    <img src={moneyCalcIcon} className="w-10 h-10 object-contain mr-3" alt="" />
    
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


<div className="flex items-stretch justify-between mb-3 w-full border-bottom pb-2 gap-4">
  
  {/* ЛІВА ЧАСТИНА: Коментарі */}
  <div className="flex-1 pr-4 border-right" onClick={(e) => e.stopPropagation()}> 
    {/* Зупиняємо тут, щоб клік по тексту коментаря не розгортав картку */}
    <div className="flex flex-col h-full justify-between">
      <div className="comments-text-wrapper-last text-WS---DarkGrey font-size-14 mb-1">
        {calc.message || "Без коментарів"}
      </div>
      
      <button
        className="btn-comments flex items-center gap-1.5 p-0 bg-transparent border-0"
        onClick={(e) => {
          e.stopPropagation();
          handleViewComments(calc.comments || []);
        }}
      >
        <img src={historyOfMessage} className="w-5 h-5 object-contain" alt="" />
        <span className="font-size-13">Історія коментарів</span>
      </button>
    </div>
  </div>

  {/* ПРАВА ЧАСТИНА: Файл та Отримувач */}
  <div className="flex-1 pl-4">
    <div className="flex flex-col h-full gap-2 justify-center">
      
      {/* Рядок з Файлом */}
      <div 
        className="flex items-center gap-2 pb-1"
        style={{ 
          cursor: calc.file ? "pointer" : "default", 
          borderBottom: '1px dashed #ddd' 
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (calc.file) handleDownload(calc);
        }}
      >
        <img src={fileIcon} className="w-5 h-5 object-contain" alt="" />
        <div className="font-size-13 text-WS---DarkGrey">
          {calc.file ? `${calc.number}.zkz` : "Немає файлу"}
        </div>
      </div>

      {/* Рядок з Отримувачем */}
      {calc.dealer && (
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsCounterpartyOpen(true);
          }}
        >
          <img src={recipientIcon} className={`w-5 h-5 object-contain ${recipientIconClass}`} alt="" />
          <span className="font-size-13 text-WS---DarkGrey">
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

          {/* Коментар */}
        
          {/* Індикатор розкриття */}
          <div className="flex justify-center  ">
            <div className="flex items-center gap-1.5">
              <span className="text-WS---DarkBlue font-bold font-['Inter'] font-size-11">
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

        {/* ============ CALC DETAILS (для обох версій) ============ */}
        {expanded && (
          <div className="item-details column gap-2.5 mt-2">
            {orderList.length === 0 ? (
              <div className="order-item column gap-14 w-100 align-center p-3 md:p-8">
                <div className="font-size-16 md:font-size-22 text-center text-WS---DarkGrey  uppercase text-center">
                  Ще немає замовлень по цьому прорахунку
                </div>
              </div>
            ) : (
              orderList.map((order) => (
                <OrderItemSummaryMobile key={order.number} order={order} />
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
