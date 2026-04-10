import React, { useState, useRef, useEffect } from "react";

// import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "../Orders/CommentsModal";
// import useWindowWidth from "../../hooks/useWindowWidth";
import DeleteConfirmModal from "../Orders/DeleteConfirmModal"; // Додаємо, оскільки це використовується всередині вбудованого меню
import { ComplaintItemDetailView } from "./ComplaintItemSummaryDesktop"; // Використовуємо новий DetailView
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { formatDateHumanShorter } from "../../utils/formatters";
import { User, ClipboardCheck, LayoutGrid, Calendar } from "lucide-react"; // Імпорт іконок

export const ReclamationItem = ({
  reclamation,
  onDelete,
  _onEdit,
  isExpanded,
  onToggle,
  onMarkAsRead,
  // expandedIssueId та onIssueToggle більше не потрібні, якщо немає вкладеності,
  // але ми залишаємо їх у пропсах для сумісності, якщо потрібно.
}) => {
  // === ВЛАСТИВОСТІ КОМПОНЕНТА RECLAMATION ITEM ===
  const expanded = isExpanded;
  const toggleExpanded = onToggle;

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]);
//   const windowWidth = useWindowWidth();
//   const isMobile = windowWidth < 1024;

  // === ЛОГІКА RECLAMATION MENU (ВБУДОВАНА) ===
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const menuRef = useRef(null);
  // const userRaw = localStorage.getItem("user");
  // const user = userRaw ? JSON.parse(userRaw) : null;

  // const writerGuid = user?.user_id_1c;

  // Закриття меню при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);


  // ДЛЯ ТЕСТУ: Встановлюємо в true
  // const canDelete = true;

  const handleDeleteClick = (e) => {
    e.stopPropagation();

    // Для тесту прибираємо або коментуємо перевірку статусу тут:
    // if (reclamation.status !== 'Нова') return;

    console.log("Клік по кошику! Відкриваємо модалку...");
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

//   const confirmDelete = async () => {
//     try {
//       console.log("Відправляємо запит на видалення GUID:", reclamation.guid);

//       // Виклик API
//       await axiosInstance.delete(
//         `/complaints/delete_complaint/${reclamation.guid}/`,
//       );

//       setIsDeleteModalOpen(false);

//       if (onDelete) {
//         await onDelete(reclamation.id);
//       }
//     } catch (error) {
//       console.error("Помилка при видаленні:", error);
//       const serverError = error.response?.data?.error || "Помилка сервера";
//       alert(serverError);
//       setIsDeleteModalOpen(false);
//     }
//   };

  const { role } = useAuthGetRole();

  const isCustomer = role === "customer";


  const managerAssigned =
    reclamation.manager &&
    reclamation.manager !== "N/A" &&
    reclamation.manager !== "Не вказано";
    const canDelete =  !managerAssigned;
  // const canDelete = true;

//   const handleDownload = async () => {
//     try {
//       const response = await axiosInstance.get(
//         `/complaints/${reclamation.id}/download/file/`,
//         {
//           responseType: "blob",
//         },
//       );

//       const url = window.URL.createObjectURL(response.data);
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `${reclamation.number}_File.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Помилка при завантаженні файлу рекламації:", error);
//     }
//   };

  const handleViewComments = (comments) => {
    if (onMarkAsRead) {
      onMarkAsRead(reclamation.id);
    }

    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  const getStatusClass = (status) => {
    if (status && status.includes("Виробництво")) {
      return "text-factory";
    }

    switch (status) {
      case "Новий":
        return "text-danger";
      case "На складі":
        return "text-warning";
      case "В роботі":
        return "text-info";
      case "Потребує узгодження":
        return "text-info";
      case "Очікує запчастин":
        return "text-info";
      case "Вирішено":
        return "text-success";
      case "Закрита":
        return "text-success";
      case "Виробництво":
        return "text-factory";
      case "Відмова":
        return "text-grey";
      default:
        return "text-grey";
    }
  };

//   const responsibleManager = reclamation.manager || "Не вказано";
//   const deliveryDate = reclamation.deliveryDate || "Не вказано";
//   const actNumber = reclamation.actNumber || "Не вказано";

  return (
    <div
      className="reclamation-item column"
      style={{
        borderLeft:
          Number(reclamation.numberWEB) > 0
            ? "4px solid #f38721ff"
            : "4px solid #5e83bf",

        paddingLeft: "12px",
      }}
    >
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        <div className="summary-item row no-wrap" style={{ flexBasis: "3%" }}>
          <span className="icon icon-tools2 font-size-22 text-success"></span>
        </div>

        <div className="summary-item row no-wrap" style={{ flexBasis: "15%" }}>
          <div className="column">
            <div className="font-size-18 text-info border-bottom">
              № {reclamation.id}
            </div>
            <div className="text-danger">
              {formatDateHumanShorter(reclamation.dateRaw)}
            </div>
          </div>
        </div>

        {/* 2. Статус (основний) */}

        {/* 3. Сума (якщо є фінансова оцінка рекламації) */}
        {/*                 <div className="summary-item row no-wrap" style={{ flexBasis: '15%' }} title="Орієнтовна вартість">
                    <span className="icon icon-coin-dollar font-size-24 text-info"></span>
                    <div className="column">
                        <div className="font-size-18 text-info border-bottom">**{formatMoney(reclamation.amount)}**</div>
                        <div className="font-size-14 text-grey">Вартість</div>
                    </div>
                </div>
                 */}
        {/* 4. Коментар/Опис та Додаткові Деталі */}

        {/* 4. Коментар/Опис та Додаткові Деталі */}
        {/* 4. Коментар/Опис та Додаткові Деталі */}

        <div className="summary-item expandable row w-30 align-start space-between">
          <div className="column w-full" style={{ flex: 1, minWidth: 0 }}>
            <div className="comments-text-wrapper-last">
              {reclamation.message || "Без коментарів"}
            </div>
            <button
              className="btn-comments self-end"
              style={{ alignSelf: "flex-end", position: "relative" }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(reclamation.message || []);
              }}
            >
              <i
                className="fas fa-comments"
                style={{
                  color: reclamation.hasUnreadMessages
                    ? "var(--danger-color)"
                    : "inherit",
                  transition: "color 0.3s",
                  marginRight: "3px",
                }}
              ></i>
              Історія коментарів
            </button>
          </div>
        </div>

        <div
          className="summary-item flex items-center whitespace-normal"
          style={{ flexBasis: "15%" }}
        >
          {reclamation.dealer && (
            <div className="flex items-center gap-1 text-grey font-size-14 break-words">
              {/* <span className="icon icon-user text-dark shrink-0"></span> */}

              <User className="w-10 h-10 text-dark shrink-0" />
              <span className="text-dark leading-snug">
                {reclamation.dealer}
              </span>
            </div>
          )}
        </div>

        <div className="summary-item row no-wrap" style={{ flexBasis: "15%" }}>
          <div className="icon-info-with-circle font-size-24 text-info"></div>
          <div
            className={`column gap-3 font-size-12 no-wrap calc-status ${getStatusClass(reclamation.status)}`}
          >
            <div className="font-size-16 font-semibold">
              {reclamation.status}
            </div>
          </div>
        </div>

        {/* 6. Меню дій (зразу іконки без випадаючого меню) */}
        <div
          className="summary-item row no-wrap gap-4 align-center"
          style={{ flexBasis: "5%" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 🗑️ Видалити */}

          <div
            className={`icon icon-trash font-size-18 ${!canDelete ? "inactive" : "clickable text-danger"}`}
            title={
              !canDelete
                ? managerAssigned
                  ? "Неможливо видалити: призначено менеджера"
                  : "Недоступно для видалення"
                : "Видалити"
            }
            onClick={canDelete ? handleDeleteClick : undefined} // Додаємо запобіжник на клік
          />

          {/* Модальне вікно підтвердження видалення */}
          {isDeleteModalOpen && (
            <DeleteConfirmModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              itemData={reclamation}
              itemType="reclamation"
              onDeleted={onDelete}
            />
          )}
        </div>
      </div>

      {/* ============ RECLAMATION DETAILS (ВИКОРИСТОВУЄМО ТІЛЬКИ ОДИН КОМПОНЕНТ) ============ */}

      {expanded && (
        <div className="item-details column gap-14">
          {/* Відображаємо деталі самої рекламації/завдання */}
          <ComplaintItemDetailView
            key={reclamation.id}
            complaint={reclamation}
          />
        </div>
      )}

      {/* Модалка для коментарів */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        baseTransactionGuid={reclamation.guid} // 🔑 GUID з 1С
        transactionTypeId={2} // 🔑 ID типу "Рекламація"
        // manager={reclamation.managerLink}
        manager={isCustomer ? reclamation.managerLink : reclamation.dealerId}
      />
    </div>
  );
};
