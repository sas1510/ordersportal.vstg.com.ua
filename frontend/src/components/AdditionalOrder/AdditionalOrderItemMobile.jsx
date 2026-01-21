// ================= CalculationItem.jsx =================
import React, { useState } from "react";
import AdditionalOrderItemSummaryMobile from './AdditionalOrderItemSummaryMobile';
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "../Orders/CommentsModal";
import { AdditionalOrderMenu } from "./AdditionalOrderMenu";
import axiosInstance from "../../api/axios";

export const AdditionalOrderItemMobile = ({ calc, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  // const writerGuid = user?.user_id_1c;
  const toggleExpanded = () => setExpanded((prev) => !prev);

  const handleEdit = (updatedCalc) => {
    if (onEdit) onEdit(updatedCalc);
  };

  const handleDownload = async () => {
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
  };

  const handleDelete = async () => {
    if (onDelete) await onDelete(calc.id);
  };

  const handleViewComments = (comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  const orderList = Array.isArray(calc.orders) ? calc.orders : [];

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
          borderTop: calc.numberWEB
          ? "4px solid #f38721ff" 
          : "4px solid #5e83bf",

          paddingLeft: "12px"}}>

      {/* ============ MOBILE VERSION (COMPACT) ============ */}
      <div className="md:hidden flex flex-col w-full p-3 bg-white rounded-lg shadow-md border border-gray-200"
        onClick={toggleExpanded}>
        
        {/* Header - Номер, дата і меню */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-calculator font-size-24 text-success"></span>
            <div className="column gap-0.5">
              <div className="font-size-20 text-info font-weight-bold border-bottom">№ {calc.number}</div>
              <div className="text-danger font-size-11">{calc.date}</div>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <AdditionalOrderMenu calc={calc} onEdit={onEdit} onDelete={handleDelete} />
          </div>
        </div>

        {/* Дилер якщо є */}
        {calc.dealer && (
          <div className="mb-2 pb-1.5 border-b border-gray-200">
            <div className="text-grey font-size-11">Дилер: {calc.dealer}</div>
            {/* <div className="text-dark font-size-13 font-weight-medium">{calc.dealer}</div> */}
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
            {/* <div className="font-size-18 text-danger font-weight-bold">
              {calc.constructionsQTY}
            </div> */}
          </div>

          {/* Замовлення (з урахуванням, що його може не бути) */}
          <div className="flex flex-col p-1.5 bg-blue-50 rounded">
            {calc.mainOrderNumber ? (
              // Варіант 1: Основне замовлення існує
              <div className="flex items-center gap-1 mb-0.5" title="Номер Основного Замовлення">
                <span className="font-size-22 text-info">№</span>
                <span className="font-size-22 text-danger font-weight-bold">{calc.mainOrderNumber}</span>
              </div>
            ) : (
              // Варіант 2: Основне замовлення відсутнє
              <div className="flex items-center justify-center h-full mb-0.5">
                <span className="font-size-16 text-grey font-weight-bold">Без замовлення</span>
              </div>
            )}
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
        {calc.statuses && Object.keys(calc.statuses).length > 0 && (
          <div className="mb-2 p-1.5 bg-gray-50 rounded">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="icon-info-with-circle font-size-14 text-info"></span>
              <span className="text-grey font-size-11">Статуси:</span>
            </div>
            <div className="flex flex-wrap gap-1.2">
              {Object.entries(calc.statuses).map(([status, count]) => (
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
            <div className="text-grey font-size-11">Коментар: </div>

            <button
                className="text-info font-size-11 underline flex items-center"
                onClick={(e) => {
                e.stopPropagation();
                handleViewComments(calc.message || []);
                }}>
                💬 Переглянути
            </button>
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
        // Зменшено mt- (margin-top) і gap-
        <div className="item-details column gap-2.5 mt-2">
          {orderList.length === 0 ? (
            <div className="order-item column gap-14 w-100 align-center p-3 md:p-8">
              <div className="font-size-16 md:font-size-22 text-grey uppercase text-center">
                Ще немає замовлень по цьому прорахунку
              </div>
            </div>
          ) : (
            orderList.map((order) => (
              <AdditionalOrderItemSummaryMobile key={order.number} order={order} />
            ))
          )}
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}

        baseTransactionGuid={calc.guid}      // 🔑 GUID з 1С
        transactionTypeId={3}                       // 🔑 ID типу "Рекламація"
        activePersonId={additionalOrder.dealerId }
        // writerGuid={writerGuid} // або з context
        />
    </div>
  );
};