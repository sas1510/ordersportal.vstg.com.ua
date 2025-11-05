// ================= OrderItemSummary.jsx =================
import React, { useState } from "react";
// import OrderDetails from "./OrderDetailsDesktop";
import { formatMoney } from "../../utils/formatMoney"; // окремий файл utils.js для форматування
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./CalculationMenu";
import AddClaimModal from "./AddClaimModal";
import AddReorderModal from "./AddReorderModal"; // шлях до твого нового компоненту
import axiosInstance from "../../api/axios";
import OrderDetailsDesktop from './OrderDetailsDesktop';
import OrderDetailsMobile from './OrderDetailsMobile';
import OrderItemSummaryDesktop from './OrderItemSummaryDesktop';
import OrderItemSummaryMobile from './OrderItemSummaryMobile';
import useWindowWidth from '../../hooks/useWindowWidth';




// ================= CalculationItem.jsx =================

export const CalculationItem = ({ calc, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const handleEdit = (updatedCalc) => {
    if (onEdit) onEdit(updatedCalc); // викликаємо метод з PortalOriginal
  };
  
  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(`/calculations/${calc.id}/download/`, {
        responseType: 'blob', // важливо для файлів
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
  if (onDelete) await onDelete(calc.id); // ✅ передаємо id
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
    <div className="calc-item column">
      {/* ============ CALC SUMMARY ============ */}
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        <div className="summary-item row  no-wrap">
          <span className="icon icon-calculator font-size-24 text-success"></span>
        </div>

        <div className="summary-item row w-9 no-wrap">
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calc.number}</div>
            <div className="text-danger">{calc.date}</div>

            {/* 👇 Додаємо ім'я дилера, якщо воно є */}
            {/* {calc.dealer && (
              <div className="text-grey font-size-14">
                 <span className="text-dark">{calc.dealer}</span>
              </div>
            )} */}
          </div>
        </div>

        <div className="summary-item row w-6 no-wrap" title="Кількість конструкцій">
          <span className="icon-layout5 font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{calc.constructionsQTY}</div>
        </div>

        <div className="summary-item row w-5 no-wrap" title="Кількість замовлень">
          <span className="icon-news font-size-24 text-info"></span>
          <div className="font-size-24 text-danger">{orderList.length}</div>
        </div>

        <div className="summary-item row w-14 no-wrap">
          <div className="row gap-14 align-center">
            <span className="icon icon-coin-dollar font-size-24 text-success"></span>
            <div className="column">
              <div className="font-size-18 text-success border-bottom">{formatMoney(calc.amount)}</div>
              <div className="font-size-16 text-danger">{formatMoney(calc.debt)}</div>
            </div>
          </div>
        </div>

      <div className="summary-item expandable row w-30 align-start space-between">
          <div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div className="comments-text-wrapper-last">
              {calc.message || "Без коментарів"}
            </div>
            <button
              className="btn-comments"
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(calc.comments || []);
              }}
            >
              💬 Історія коментарів
            </button>
          </div>
        </div>


        <div
        className="summary-item row w-10 no-wrap"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          <div className="column gap-1 align-start">
            <div className="row gap-14 align-center">
              <div className="icon-document-file-numbers font-size-24 text-success"></div>
              <div>{calc.number}.zkz</div>
            </div>

            {calc.dealer && (
              <div className="text-grey font-size-14">
                <span className="text-dark">{calc.dealer}</span>
              </div>
            )}
          </div>
        </div>



        <div className="summary-item row w-15 no-wrap">
          <div className="row gap-14 align-center">
            <div className="icon-info-with-circle font-size-24 text-info"></div>

            <div className="column gap-3 font-size-12 no-wrap scroll-y">
              {calc.statuses && Object.keys(calc.statuses).length > 0 ? (
                Object.entries(calc.statuses).map(([status, count]) => (
                  <div
                    key={status}
                    className={`row gap-3 left no-wrap calc-status ${getStatusClass(status)}`}
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
       

      <div onClick={(e) => e.stopPropagation()}>
        <CalculationMenu
          calc={calc}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      </div>



      </div>

      {/* ============ CALC DETAILS ============ */}

    {expanded && (
       <div className="item-details column gap-14 mt-2">
          {orderList.length === 0 ? (
             <div className="order-item column gap-14 w-100 align-center">
               <div className="font-size-22 text-grey uppercase float-center">
                 Ще немає замовлень по цьому прорахунку
                </div>
            </div>
        ) : (
           orderList.map((order) => (
              // 1. Прибрано зайві фігурні дужки { }
              // 2. Змінено на OrderItemSummaryMobile
            isMobile ? (
              <OrderItemSummaryMobile key={order.number} order={order} />
            ) : (
              <OrderItemSummaryDesktop key={order.number} order={order} />
            )
            ))
        )}
        </div>
       )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={selectedComments} // можна передавати пустий масив, модалка сама підвантажить
        orderId={calc.id}            // або calc.PortalOrderId
        onAddComment={async (text) => {
          try {
            await axiosInstance.post(`/calculations/${calc.number}/add-comment/`, { message: text });
            // оновити локальний стан коментарів
            const res = await axiosInstance.get(`/calculations/${calc.number}/comments/`);
            setSelectedComments(res.data);
          } catch (err) {
            console.error("Помилка при додаванні коментаря:", err);
          }
        }}
      />

    </div>
  );
};
