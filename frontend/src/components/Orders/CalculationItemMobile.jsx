// ================= CalculationItemMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import OrderItemSummaryMobile from './OrderItemSummaryMobile';
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import {formatDateHumanShorter} from '../../utils/formatters'

// КРОК 1: Змінюємо експорт на React.memo
export const CalculationItemMobile = React.memo(({ calc, onDelete, onEdit }) => {
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);

  // 1. Мемоїзація функцій-обробників за допомогою useCallback
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  const handleEdit = useCallback((updatedCalc) => {
    if (onEdit) onEdit(updatedCalc);
  }, [onEdit]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/calculations/${calc.id}/download/`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${calc.number}.zkz`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Помилка при завантаженні файлу:", error);
    }
  }, [calc.id, calc.number]);

  const handleDelete = useCallback(async () => {
    if (onDelete) await onDelete(calc.id);
  }, [onDelete, calc.id]);

  const handleViewComments = useCallback((comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  }, []);

  // 2. Мемоїзація списку замовлень за допомогою useMemo
  const orderList = useMemo(() => {
      return Array.isArray(calc.orders) ? calc.orders : [];
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

  // 4. Мемоїзація функції додавання коментаря для Modal
  const handleAddComment = useCallback(async (text) => {
    try {
      await axiosInstance.post(`/calculations/${calc.number}/add-comment/`, { message: text });
      // Після успішного додавання, оновлюємо список коментарів
      const res = await axiosInstance.get(`/calculations/${calc.number}/comments/`);
      setSelectedComments(res.data);
    } catch (err) {
      console.error("Помилка при додаванні коментаря:", err);
    }
  }, [calc.number]); 

  return (
    <div className="calc-item column">

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
          <div onClick={(e) => e.stopPropagation()}>
            <CalculationMenu calc={calc} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </div>

        {/* Дилер якщо є */}
        {calc.dealer && (
          <div className="mb-2 pb-1.5 border-b border-gray-200">
            <div className="text-grey font-size-11">Дилер: {calc.dealer}</div>
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
                className="text-info font-size-11 underline flex items-center"
                onClick={(e) => {
                e.stopPropagation();
                handleViewComments(calc.comments || []);
                }}>
                💬 Переглянути
            </button>
            </div>


        {/* Файл ZKZ */}
        <div className="flex items-center justify-between p-1.5 bg-green-50 rounded border border-green-200"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(); 
          }}>
          <div className="flex items-center gap-1.5">
            <div className="icon-document-file-numbers font-size-18 text-success"></div>
            <div className="font-size-13 text-dark">{calc.number}.zkz</div>
          </div>
          <span className="icon-download font-size-16 text-success"></span>
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

      {/* Модальне вікно (без змін) */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={selectedComments}
        orderId={calc.id}
        onAddComment={handleAddComment}
      />
    </div>

)});