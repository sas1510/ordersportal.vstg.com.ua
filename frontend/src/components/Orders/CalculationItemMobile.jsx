// ================= CalculationItemMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo, useEffect } from "react";
import OrderItemSummaryMobile from './OrderItemSummaryMobile';
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import {formatDateHumanShorter} from '../../utils/formatters'
import { useNotification } from "../notification/Notifications.jsx";
import CounterpartyInfoModal from "./CounterpartyInfoModal";

import DeleteConfirmModal from './DeleteConfirmModal';


// КРОК 1: Змінюємо експорт на React.memo
export const CalculationItemMobile = React.memo(({ calc, onDelete, onEdit, onMarkAsRead }) => {
//                                 
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { addNotification } = useNotification();


    const user = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    }, []);

    const isAdmin = user?.role === "admin";

    // Перевірка, чи є дилер отримувачем
    const isDealerRecipient = useMemo(() => {
      if (!calc.recipient || !calc.dealer) return false;
      return calc.recipient.trim().toLowerCase() === calc.dealer.trim().toLowerCase();
    }, [calc.recipient, calc.dealer]);

    // Клас для іконки залежно від типу отримувача
    const recipientIconClass = isDealerRecipient
      ? "text-success"   // дилер = отримувач
      : "text-warning";  // менеджер / інший отримувач

  // 1. Мемоїзація функцій-обробників за допомогою useCallback
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  const handleEdit = useCallback((updatedCalc) => {
    if (onEdit) onEdit(updatedCalc);
  }, [onEdit]);

  const hasOrders = useMemo(() => 
      Array.isArray(calc.orders) && calc.orders.some(o => o.number && String(o.number).trim() !== ""),
      [calc.orders]
    );



  const handleDownload = useCallback(
    async () => {
      try {
        
        const fileName = calc.fileName;

       
        const response = await axiosInstance.get(
          `/calculations/${calc.id}/files/${calc.file}/download/`,
          {
            params: { filename: fileName }, 
            responseType: "blob",           
          }
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
        addNotification("Не вдалося завантажити файл. Можливо, він відсутній на сервері.");
      }
    },
    [calc.id, calc.fileGuid, calc.file, calc.number] 
  );





  
  const handleDelete = useCallback(async () => {
    if (onDelete) await onDelete(calc.id);
  }, [onDelete, calc.id]);

   const handleViewComments = useCallback((comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
    
    // Якщо є непрочитані — викликаємо функцію "прочитано"
    if (calc.hasUnreadMessages && onMarkAsRead) {
      onMarkAsRead(calc.id);
    }
  }, [calc.id, calc.hasUnreadMessages, onMarkAsRead]);


  // 2. Мемоїзація списку замовлень за допомогою useMemo
  const orderList = useMemo(() => {
    if (!Array.isArray(calc.orders)) return [];

    // Фільтруємо замовлення: залишаємо тільки ті, де номер не порожній 
    // і не складається лише з пробілів. 
    // Це відсікає об'єкти з "number": "" з вашого JSON.
    return calc.orders.filter(
      (order) => order.number && String(order.number).trim() !== ""
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
      <div className="calc-item column"
        style={{
            borderTop: calc.dealerId === calc.authorGuid
            ? "4px solid #f38721ff" 
            : "4px solid #5e83bf",

            paddingLeft: "12px"
        }}>

      {/* ============ MOBILE VERSION (COMPACT) ============ */}
      <div className="md:hidden flex flex-col w-full p-3 bg-white rounded-lg shadow-md border border-gray-200"
        onClick={toggleExpanded}>
        
        {/* Header - Номер, дата і меню */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-calculator font-size-24 text-success"></span>
            <div className="column gap-0.5">
              <div className="font-size-20 text-info font-weight-bold border-bottom">№ {calc.number}</div>
              <div className="text-danger font-size-11">{formatDateHumanShorter(calc.date)}</div>
            </div>
          </div>

{/* <button
  type="button"
  className={`icon icon-trash font-size-18 bg-transparent border-0 
    ${hasOrders ? 'inactive' : 'clickable text-danger'}`}
  title={hasOrders ? 'Недоступно для видалення' : 'Видалити'}
  onClick={handleDeleteClick}
/> */}

          <div onClick={(e) => e.stopPropagation()}>
            <button
            className={`btn-delete-mobile ${hasOrders ? 'opacity-20' : 'text-danger'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasOrders) setIsDeleteModalOpen(true);
            }}
            disabled={hasOrders}
          >
            <span className="icon icon-trash font-size-20"></span>
          </button>
          </div>
        </div>

        {/* Дилер якщо є */}
        {calc.dealer && (
          <div className="mb-2 pb-1.5 border-b border-gray-200">
            <div 
              className="text-dark font-size-18 flex items-center gap-2 dealer-clickable" 
              onClick={(e) => {
                e.stopPropagation();
                setIsCounterpartyOpen(true);
              }}
            >
              <i 
                className={`fa fa-address-card mr-1 ${recipientIconClass}`} 
                title={isDealerRecipient ? "Отримувач — дилер" : "Отримувач — інший контрагент"}
              />
              <span className="font-weight-bold">
                {isAdmin ? calc.dealer : "Отримувач"}
              </span>
            </div>
          </div>
        )}

        {/* Статистика - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Конструкції */}
          <div className="flex flex-col p-1.5 bg-blue-50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon-layout5 font-size-22 text-info"></span>
              <span className="font-size-22 text-danger font-weight-bold">{calc.constructionsQTY}</span>
            </div>
          </div>

          {/* Замовлення */}
          <div className="flex flex-col p-1.5 bg-blue-50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon-news font-size-22 text-info"></span>
              <span className="font-size-22 text-danger font-weight-bold">{orderList.length}</span>
            </div>
          </div>

          {/* Сума */}
          <div className="flex flex-col p-1.5 bg-green-50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon icon-coin-dollar font-size-14 text-success"></span>
              <span className="text-grey font-size-10">Сума</span>
            </div>
            <div className="font-size-15 text-success font-weight-bold">
              {formatMoney(calc.amount)}
            </div>
          </div>

        {/* Борг */}
          <div className="flex flex-col p-1.5 bg-red-50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="icon icon-coin-dollar font-size-14 text-danger"></span>
              <span className="text-grey font-size-10">Борг</span>
            </div>
            <div className="font-size-15 text-danger font-weight-bold">
              {formatMoney(calc.debt)}
            </div>
          </div>
        </div>

        {/* Статуси замовлень */}
        {statusEntries.length > 0 && (
          <div className="mb-2 p-1.5 bg-gray-50 rounded">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="icon-info-with-circle font-size-14 text-info"></span>
              <span className="text-grey font-size-11">Статуси:</span>
            </div>
            <div className="flex flex-wrap gap-1.2">
              {statusEntries.map(([status, count]) => (
                <div key={status} 
                  className={`px-2 py-1 rounded font-size-10 ${getStatusClass(status)} bg-white border`}>
                  {status} ({count})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Коментар */}
        <div className="mb-2 p-1.5 bg-yellow-50 rounded flex items-center justify-between">
            <div className="text-grey font-size-11">Коментар:</div>

           <button
                className="text-info font-size-11 underline flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewComments(calc.comments || []);
                }}
              >
                <i
                  className="fas fa-comments"
                  style={{
                    color: calc.hasUnreadMessages ? 'var(--danger-color)' : 'inherit',
                    transition: 'color 0.3s'
                  }}
                />
                Переглянути
              </button>

            </div>


        {/* Файл ZKZ */}
        <div className="flex items-center justify-between p-1.5 bg-green-50 rounded border border-green-200"
          style={{
                  cursor: calc.file && calc.file !== '' ? "pointer" : "default",
                  width: "100%"
                }}
          onClick={(e) => {
            e.stopPropagation();
            if (!calc.file || calc.file === '') return;
            handleDownload(); 
          }}>
          <div className="flex items-center gap-1.5">
            <div className="icon-document-file-numbers font-size-18 text-success"></div>
            <div className="font-size-13 text-dark">{calc.file && calc.file !== '' ? `${calc.number}.zkz` : 'Немає файлу'}</div>
          </div>

          {calc.file && calc.file !== '' ? <span className="icon-download font-size-16 text-success"></span> : ''}
        </div>

        {/* Індикатор розкриття */}
        <div className="flex justify-center mt-2 pt-1.5 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <span className="text-grey font-size-11">
              {expanded ? 'Приховати замовлення' : `Показати замовлення (${orderList.length})`}
            </span>
            <span className={`icon ${expanded ? 'icon-chevron-up' : 'icon-chevron-down'} font-size-12 text-grey`}></span>
          </div>
        </div>
      </div>

      {/* ============ CALC DETAILS (для обох версій) ============ */}
      {expanded && (
        <div className="item-details column gap-2.5 mt-2">
          {orderList.length === 0 ? (
            <div className="order-item column gap-14 w-100 align-center p-3 md:p-8">
              <div className="font-size-16 md:font-size-22 text-grey uppercase text-center">
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
        activePersonId={calc.dealerId}
        
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

)});