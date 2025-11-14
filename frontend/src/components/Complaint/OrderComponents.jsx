// ================= CalculationItem.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import OrderItemSummaryDesktop from "./OrderItemSummaryDesktop";
import { formatDateHumanShorter } from "../../utils/formatters";

// КРОК 1: Обгортаємо функціональний компонент у React.memo
export const CalculationItem = React.memo(({ calc, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);

  // 1. Мемоїзація простих обробників
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
  const handleEdit = useCallback(
    (updatedCalc) => {
      if (onEdit) onEdit(updatedCalc);
    },
    [onEdit]
  );
  const handleViewComments = useCallback((comments) => {
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  }, []);

  // 2. Мемоїзація асинхронних обробників
  const handleDownload = useCallback(
    async () => {
      try {
        const response = await axiosInstance.get(
          `/calculations/${calc.id}/download/`,
          { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${calc.number}.zkz`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Помилка при завантаженні файлу:", error);
      }
    },
    [calc.id, calc.number]
  );

  const handleDelete = useCallback(
    async () => {
      if (onDelete) await onDelete(calc.id);
    },
    [onDelete, calc.id]
  );

  // 3. Мемоїзація даних/списків
  const orderList = useMemo(() => {
    return Array.isArray(calc.orders) ? calc.orders : [];
  }, [calc.orders]);

  // КРОК 2: Мемоїзація масиву статусів
  const statusEntries = useMemo(() => {
    return calc.statuses && Object.keys(calc.statuses).length > 0
      ? Object.entries(calc.statuses)
      : [];
  }, [calc.statuses]);

  // 4. Мемоїзація статичної функції
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
  }, []);

  // 5. Додавання коментаря
  const handleAddComment = useCallback(
    async (text) => {
      try {
        await axiosInstance.post(
          `/calculations/${calc.number}/add-comment/`,
          { message: text }
        );
        const res = await axiosInstance.get(
          `/calculations/${calc.number}/comments/`
        );
        setSelectedComments(res.data);
      } catch (err) {
        console.error("Помилка при додаванні коментаря:", err);
      }
    },
    [calc.number]
  );

  return (
    <div className="calc-item column">
      {/* ============ CALC SUMMARY ============ */}
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        <div className="summary-item row no-wrap">
          <span className="icon icon-calculator font-size-24 text-success"></span>
        </div>

        <div className="summary-item row w-9 no-wrap" style={{ minWidth: "150px" }}>
          <div className="column">
            <div className="font-size-18 text-info border-bottom">№ {calc.number}</div>
            <div className="text-danger">{formatDateHumanShorter(calc.date)}</div>
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
              <div className="font-size-18 text-success border-bottom">
                {formatMoney(calc.amount)}
              </div>
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
          className="summary-item row w-10 no-wrap "
          style={{ minWidth: "150px", flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          <div className="column gap-1 align-top" >
            <div className="row gap-14 align-top">
              <div className="icon-document-file-numbers ml-0 font-size-24 text-success"></div>
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
              {statusEntries.length > 0 ? (
                statusEntries.map(([status, count]) => (
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
          <CalculationMenu calc={calc} onEdit={handleEdit} onDelete={handleDelete} />
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
              <OrderItemSummaryDesktop key={order.number} order={order} />
            ))
          )}
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={selectedComments}
        orderId={calc.id}
        onAddComment={handleAddComment}
      />
    </div>
  );
});

