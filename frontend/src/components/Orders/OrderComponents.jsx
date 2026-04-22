// ================= CalculationItem.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
import { formatMoney, formatMoney2} from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import CounterpartyInfoModal from "./CounterpartyInfoModal";
import { CalculationMenu } from "./CalculationMenu";
import axiosInstance from "../../api/axios";
import OrderItemSummaryDesktop from "./OrderItemSummaryDesktop";
import {
  formatDateTimeShort,
} from "../../utils/formatters";
import "./Orders.css";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

// КРОК 1: Обгортаємо функціональний компонент у React.memo
export const CalculationItem = React.memo(
  ({ calc, onDelete, onEdit, onMarkAsRead , reloadCalculations}) => {
    const [expanded, setExpanded] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [_selectedComments, setSelectedComments] = useState([]);
    const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false);
    const { addNotification } = useNotification();

    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";


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

    // const recipientLabel =
    //   ? "Отримувач"
    //   : calc.dealer || "Контрагент";

    // 1. Мемоїзація простих обробників
    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const handleEdit = useCallback(
      (updatedCalc) => {
        if (onEdit) onEdit(updatedCalc);
      },
      [onEdit],
    );

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
    // 2. Мемоїзація асинхронних обробників
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

    const handleDelete = useCallback(async () => {
      if (onDelete) await onDelete(calc.id);
    }, [onDelete, calc.id]);

    // 3. Мемоїзація даних/списків
    const orderList = useMemo(() => {
      if (!Array.isArray(calc.orders)) return [];

      // Фільтруємо замовлення: залишаємо тільки ті, де номер не порожній
      // і не складається лише з пробілів.
      // Це відсікає об'єкти з "number": "" з вашого JSON.
      return calc.orders.filter(
        (order) => order.number && String(order.number).trim() !== "",
      );
    }, [calc.orders]);

    // КРОК 2: Мемоїзація масиву статусів
    const statusEntries = useMemo(() => {
      return calc.statuses && Object.keys(calc.statuses).length > 0
        ? Object.entries(calc.statuses)
        : [];
    }, [calc.statuses]);

    // === ПІДСВІЧУВАННЯ WEB CALC ===
    // const isWebCalc = useMemo(
    //   () => !!(calc.webNumber && String(calc.webNumber).trim() !== ""),
    //   [calc.webNumber],
    // );
    // ===============================

    // 4. Мемоїзація статичної функції
    const getStatusClass = useCallback((status) => {
      switch (status) {
        case "Новий":
        // case "В обробці":
        case "У виробництві":
        case "Підтверджений":
          return "text-WS---DarkBlue";
        case "Очікуємо оплату":
        case "Очікуємо підтвердження":
        case "Відмова":
          return "text-WS---DarkRed";
        case "Готовий":
        case "Відвантажений":
          return "text-WS---DarkGreen";
        default:
          return "text-WS---DarkGrey";
      }
    }, []);

    // Беремо статус першого запису, якщо він є, інакше — 'warning' для "Новий"
    const mainStatus = statusEntries.length > 0 ? statusEntries[0][0] : null;
    const iconColorClass = mainStatus ? getStatusClass(mainStatus) : "text-warning";

    return (
      <div
        className={`calc-item column`}
        style={{
          borderLeft:
            calc.dealerId === calc.authorGuid
              ? "7px solid #BA523B"
              : "7px solid #6B98BF",

          paddingLeft: "12px",
        }}
      >
        {/* ============ CALC SUMMARY ============ */}
        <div className="item-summary justify-between row w-100" onClick={toggleExpanded}>
          {/* <div className="summary-item row no-wrap">
            <span className="icon icon-calculator font-size-24 text-success"></span>
          </div> */}

          <div
            className="summary-item justify-between row w-9 no-wrap"
            style={{ minWidth: "150px" }}
          >
            <div className="column">
              <div className="text-base text-bold text-WS---DarkGrey border-bottom">
                № {calc.number}
              </div>
              <div className="text-xs text-WS---DarkGrey">
                {formatDateTimeShort(calc.date)}
              </div>
            </div>
          </div>

          <div
            className="summary-item row w-8 no-wrap"
            title="Кількість конструкцій"
          >
              <img 
                  src={windowsIcon} 
                  // alt="Вікно" 
                  className="align-center mr-2" 
                
                />
            {/* <span className="icon-layout5 font-size-24 text-info"></span> */}
            <div className="font-size-24 text-WS---DarkBlue">
              {calc.constructionsQTY}
            </div>
          </div>

          <div
            className="summary-item row w-8 no-wrap"
            title="Кількість замовлень"
          >
                <img 
                  src={listCalcIcon} 
                  // alt="Вікно" 
                  className="align-center mr-2" 
                
                />
            <div className="font-size-24 text-WS---DarkBlue">{orderList.length}</div>
          </div>

          <div className="summary-item row w-16 no-wrap">
            <div className="row gap-14 align-center">
               <img 
                  src={moneyCalcIcon} 
                  // alt="Вікно" 
                  className="align-center mr-0.5" 
                
                />
              <div className="column">
                <div className="font-size-16  text-WS---DarkGreen font-bold border-bottom">
                  { formatMoney2(calc.amount, calc.currency) }
                </div>
                <div className="font-size-16  text-WS---DarkRed font-bold">
                  {formatMoney2(calc.debt, calc.currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="summary-item expandable row w-23 align-start space-between">
            <div className="column" style={{ flex: 1, minWidth: 0 }}>
              <div className="comments-text-wrapper-last ">
                {calc.message || "Без коментарів"}
              </div>
              <button
                className="btn-comments row"
                style={{ position: "relative" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewComments(calc.comments || []);
                }}
              >
                  <img 
                  src={historyOfMessage} 
      
                  className="align-center mr-0.5" 
                
                />
                Історія коментарів
              </button>
            </div>
          </div>

          <div className="summary-item row w-12 no-wrap">
            <div
              className="column gap-1 align-start mr-3"
            
            >
              {/* 📄 Файл — ЗАВАНТАЖЕННЯ */}
              <div className="row align-start" style={{ gap: 0 }}>
                <div
                  className="row file-download"
                  style={{
                    borderBottom: "1px dashed #ddd",
                    paddingBottom: "2px",
                    gap: "3px",
                    cursor:
                      calc.file && calc.file !== "" ? "pointer" : "default",
                    width: "100%",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!calc.file || calc.file === "") return;
                    handleDownload(calc);
                  }}
                >
                  {/* <div className="icon-document-file-numbers font-size-20 text-WS---DarkGrey mr-0" /> */}
                  <img 
                    src={fileIcon} 
                    // alt="Вікно" 
                    className="align-center mr-0.5" 
                  
                  />
                  <div className="font-size-12 text-WS---DarkGrey ml-0">
                    <div className="order-number">
                      {calc.file && calc.file !== ""
                        ? `${calc.number}.zkz`
                        : "Немає файлу"}
                    </div>
                  </div>
                </div>
              </div>

              {calc.dealer && (
                <div className="text-WS---DarkGrey  row align-start gap-1">
                  <img 
                    src={recipientIcon} 
                    alt="" 
                    className={`mr-0.5 object-contain inline-block align-middle ${recipientIconClass}`} 
                    title={
                      isDealerRecipient
                        ? "Отримувач — дилер"
                        : "Отримувач — інший контрагент"
                    }
                  />

                  <span
                    className="text-dark font-size-12 dealer-wrap dealer-clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCounterpartyOpen(true);
                    }}
                  >
                    {isAdmin ? (
                      <span>{calc.dealer}</span>
                    ) : (
                      <span>Отримувач</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

         <div className="summary-item row w-16 no-wrap">
          <div className="row gap-14 align-center">
            {/* Іконка тепер отримує клас кольору від статусу */}
            <div className={`icon-info-with-circle font-size-24 ${iconColorClass}`}></div>

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
            <CalculationMenu
              calc={calc}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* ============ CALC DETAILS ============ */}
        {expanded && (
          <div className="item-details  column gap-14">
            {orderList.length === 0 ? (
              <div className="order-item column gap-14 w-100 align-center">
                <div className="font-size-22 text-grey uppercase float-center">
                  Ще немає замовлень по цьому прорахунку
                </div>
              </div>
            ) : (
              orderList.map((order) => (
                <OrderItemSummaryDesktop
                  key={order.number}
                  order={order}
                  calculationDate={calc.date}
                  onRefresh={reloadCalculations}
                />
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
