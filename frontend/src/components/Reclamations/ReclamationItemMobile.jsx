// import React, { useState } from "react";
// import axiosInstance from "../../api/axios";
// import { formatMoney } from "../../utils/formatMoney";
// import CommentsModal from "../Orders/CommentsModal";
// // Для вбудованого меню потрібен модал підтвердження:
// import DeleteConfirmationModal from "../Orders/DeleteConfirmModal";
// import { ComplaintItemDetailViewMobile } from "./ComplaintItemSummaryMobile";
// import { useAuth } from "../../hooks/useAuth";

// export const ReclamationItemMobile = ({
//   reclamation,
//   onDelete,
//   onEdit,
//   isExpanded,
//   onToggle,
//   expandedIssueId,
//   onIssueToggle,
//   onMarkAsRead,
// }) => {
//   // === 🚨 ВИПРАВЛЕННЯ: ЗАХИСТ ВІД UNDEFINED 🚨 ===
//   if (!reclamation) {
//     return null;
//   }
//   // ======================================

//   // === ВЛАСТИВОСТІ І ЛОГІКА ITEM ===
//   const expanded = isExpanded;
//   const toggleExpanded = onToggle;

//   const [isCommentsOpen, setIsCommentsOpen] = useState(false);
//   const [selectedComments, setSelectedComments] = useState([]);

//   // === ЛОГІКА ДІЙ ===
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

//   const { user, role } = useAuth();

//   const isCustomer = role === "customer";

//   const canEdit = !isCustomer && reclamation.status !== "Закрита";
//   const canDelete = reclamation.status === "Нова";

//   // Функції дій
//   const handleEditClick = (e) => {
//     e.stopPropagation();
//     if (!canEdit) return;
//     if (onEdit) onEdit(reclamation);
//   };

//   const handleDeleteClick = (e) => {
//     e.stopPropagation();
//     if (!canDelete) return;
//     setIsDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     setIsDeleteModalOpen(false);
//     if (onDelete) {
//       await onDelete(reclamation.id);
//     }
//   };
//   // === КІНЕЦЬ ЛОГІКИ ДІЙ ===

//   // Функції для решти дій
//   const handleDownload = async (e) => {
//     e.stopPropagation();
//     if (!reclamation.file) return;
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
//       link.setAttribute("download", `${reclamation.number}_Claim.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Помилка при завантаженні файлу рекламації:", error);
//     }
//   };

//   const handleViewComments = (e, comments) => {
//     e.stopPropagation();

//     if (onMarkAsRead) {
//       onMarkAsRead(reclamation.id);
//     }
//     setSelectedComments(comments);
//     setIsCommentsOpen(true);
//   };

//   const issueList = Array.isArray(reclamation.issues) ? reclamation.issues : [];

//   // Функція для визначення CSS класу на основі статусу рекламації
//   const getStatusClass = (status) => {
//     if (status && status.includes("Виробництво")) {
//       return "text-factory";
//     }
//     switch (status) {
//       case "Новий":
//         return "text-danger";
//       case "На складі":
//         return "text-warning";
//       case "В роботі":
//         return "text-info";
//       case "Потребує узгодження":
//         return "text-info";
//       case "Очікує запчастин":
//         return "text-info";
//       case "Вирішено":
//         return "text-success";
//       case "Закрита":
//         return "text-success";
//       case "Виробництво":
//         return "text-factory";
//       case "Відмова":
//         return "text-grey";
//       default:
//         return "text-grey";
//     }
//   };

//   return (
//     <div
//       className="reclamation-item column"
//       style={{
//         borderTop:
//           Number(reclamation.numberWEB) > 0
//             ? "4px solid #f38721ff"
//             : "4px solid #5e83bf",

//         paddingLeft: "12px",
//       }}
//     >
//       {/* ============ MOBILE SUMMARY ============ */}
//       <div
//         className="flex flex-col w-full p-3 bg-white rounded-lg shadow-md border border-gray-200"
//         onClick={toggleExpanded}
//       >
//         {/* Header - Номер, дата та ДІЇ/ДИЛЕР/СТАТУС */}
//         <div className="flex items-start justify-between mb-2">
//           {/* ЛІВА ЧАСТИНА: Номер і Дата */}
//           <div className="flex items-center gap-1.5">
//             {/* Іконка рекламації */}
//             <span className="icon icon-tools2 font-size-24 text-success"></span>
//             <div className="column gap-0.5">
//               <div className="font-size-20 text-info font-weight-bold border-bottom">
//                 № {reclamation.id}
//               </div>
//               <div className="text-grey font-size-11">
//                 від {reclamation.date}
//               </div>
//             </div>
//           </div>

//           {/* ПРАВА ЧАСТИНА: Дилер, Статус та Дії (в одному блоці) */}
//           <div
//             className="flex flex-col items-end flex-shrink-0"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* 1. Дилер (зверху) */}
//             {reclamation.dealer && (
//               <div className="text-grey font-size-10 mb-0 text-right max-w-[200px] whitespace-normal">
//                 <span className="text-dark font-weight-medium">
//                   {reclamation.dealer}
//                 </span>
//               </div>
//             )}

//             {/* 3. Дії (Редагувати/Видалити) - В ОДНОМУ РЯДКУ, ЗБІЛЬШЕНІ */}
//             <div className="flex items-center gap-0 mt-0">
//               {/* 🗑️ Видалити */}
//               <button
//                 className={`p-0 -mr-1 ml-0 ${!canDelete ? "opacity-30 cursor-not-allowed" : "text-danger hover:text-dark"}`}
//                 title={!canDelete ? "Недоступно для видалення" : "Видалити"}
//                 onClick={handleDeleteClick}
//                 disabled={!canDelete}
//                 aria-label="Видалити рекламацію"
//               >
//                 <span className="icon icon-trash font-size-20" />{" "}
//                 {/* Збільшено до 24 */}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* === БЛОК СТАТИСТИКИ (Залишаємо внизу, але оновлюємо) === */}

//         <div className="flex items-center justify-between p-1.5 bg-green-50 rounded border border-green-200 mb-1">
//           <div className="text-grey font-size-10">Поточний статус:</div>
//           <div
//             className={`font-size-15 font-weight-bold mt-0.5 ${getStatusClass(reclamation.status)}`}
//           >
//             {reclamation.status}
//           </div>
//         </div>

//         {/* Коментар / Історія коментарів */}
//         <div className="mb-2 p-1.5 bg-yellow-50 rounded flex items-center justify-between border border-yellow-200">
//           <div className="text-grey font-size-11 text-truncate">
//             {reclamation.message || "Детальний опис відсутній"}
//           </div>
//           <button
//             className="text-info font-size-11 underline flex items-center flex-shrink-0 ml-2"
//             onClick={(e) => handleViewComments(e, reclamation.comments || [])}
//           >
//             <i
//               className="fas fa-comments"
//               style={{
//                 color: reclamation.hasUnreadMessages
//                   ? "var(--danger-color)"
//                   : "inherit",
//                 transition: "color 0.3s",
//                 marginRight: "3px",
//               }}
//             ></i>
//             Переглянути
//           </button>
//         </div>

//         {/* Індикатор розкриття */}
//         <div className="flex justify-center mt-2 pt-1.5 border-t border-gray-200">
//           <div className="flex items-center gap-1.5">
//             <span className="text-grey font-size-11">
//               {expanded ? "Приховати деталі" : `Показати деталі`}
//             </span>
//             <span
//               className={`icon ${expanded ? "icon-chevron-up" : "icon-chevron-down"} font-size-12 text-grey`}
//             ></span>
//           </div>
//         </div>
//       </div>

//       {/* ============ RECLAMATION ISSUES DETAILS ============ */}
//       {expanded && (
//         <div className="item-details column gap-2.5 mt-2">
//           <ComplaintItemDetailViewMobile complaint={reclamation} />
//         </div>
//       )}

//       {/* Модальне вікно коментарів */}
//       <CommentsModal
//         isOpen={isCommentsOpen}
//         onClose={() => setIsCommentsOpen(false)}
//         baseTransactionGuid={reclamation.guid} // 🔑 GUID з 1С
//         transactionTypeId={2} // 🔑 ID типу "Рекламація"
//         // writerGuid={localStorage.getItem("user_id_1C")} // або з context
//         manager={isCustomer ? reclamation.managerLink : reclamation.dealerId}
//       />

//       {/* Модальне вікно підтвердження видалення (залишаємо тут для контексту) */}
//       {isDeleteModalOpen && (
//         <DeleteConfirmationModal
//           isOpen={isDeleteModalOpen}
//           onClose={() => setIsDeleteModalOpen(false)}
//           onConfirm={confirmDelete}
//           title="Підтвердження видалення"
//           message={`Ви впевнені, що хочете видалити рекламацію №${reclamation.number}? Це незворотна дія.`}
//         />
//       )}
//     </div>
//   );
// };
import React, { useState } from "react";

// Видалено formatMoney, бо він не використовується
import CommentsModal from "../Orders/CommentsModal";
import DeleteConfirmationModal from "../Orders/DeleteConfirmModal";
import { ComplaintItemDetailViewMobile } from "./ComplaintItemSummaryMobile";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import DeleteConfirmModal from "../Orders/DeleteConfirmModal";

export const ReclamationItemMobile = ({
  reclamation,
  onDelete,
  onEdit,
  isExpanded,
  onToggle,
  _expandedIssueId, // Додано підкреслення, щоб лінтер не сварився
  _onIssueToggle,    // Додано підкреслення
  onMarkAsRead,
}) => {
  // 1. УСІ ХУКИ МАЮТЬ БУТИ ТУТ (ДО ПЕРЕВІРКИ RECLAMATION)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]); // Додано _
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { role } = useAuthGetRole(); // Видалено user, бо він не використовується

  // 2. ТЕПЕР МОЖНА РОБИТИ ПЕРЕВІРКУ
  if (!reclamation) {
    return null;
  }

  // === ЛОГІКА ===
  const expanded = isExpanded;
  const toggleExpanded = onToggle;
  const isCustomer = role === "customer";
  const canEdit = !isCustomer && reclamation.status !== "Закрита";


  
  const managerAssigned =
    reclamation.manager &&
    reclamation.manager !== "N/A" &&
    reclamation.manager !== "Не вказано";


  const canDelete =  !managerAssigned;

  // Функції дій
  const handleEditClick = (e) => { // Тепер ви можете підключити це до кнопки редагування
    e.stopPropagation();
    if (!canEdit) return;
    if (onEdit) onEdit(reclamation);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!canDelete) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    if (onDelete) {
      await onDelete(reclamation.id);
    }
  };

  const handleViewComments = (e, comments) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(reclamation.id);
    }
    setSelectedComments(comments);
    setIsCommentsOpen(true);
  };

  // Видалено handleDownload та issueList, бо вони не використовуються в JSX нижче

  const getStatusClass = (status) => {
    if (status && status.includes("Виробництво")) return "text-factory";
    const classes = {
      "Новий": "text-danger",
      "На складі": "text-warning",
      "В роботі": "text-info",
      "Вирішено": "text-success",
      "Закрита": "text-success",
      "Відмова": "text-grey"
    };
    return classes[status] || "text-grey";
  };

  return (
    <div
      className="reclamation-item column"
      style={{
        borderTop: Number(reclamation.numberWEB) > 0 ? "4px solid #f38721ff" : "4px solid #5e83bf",
        paddingLeft: "12px",
      }}
    >
      <div
        className="flex flex-col w-full p-3 bg-white rounded-lg shadow-md border border-gray-200"
        onClick={toggleExpanded}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-tools2 font-size-24 text-success"></span>
            <div className="column gap-0.5">
              <div className="font-size-20 text-info font-weight-bold border-bottom">
                № {reclamation.id}
              </div>
              <div className="text-grey font-size-11">від {reclamation.date}</div>
            </div>
          </div>

          <div className="flex flex-col items-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {reclamation.dealer && (
              <div className="text-grey font-size-10 mb-0 text-right max-w-[200px] whitespace-normal">
                <span className="text-dark font-weight-medium">{reclamation.dealer}</span>
              </div>
            )}
            <div className="flex items-center gap-2"> 
              {/* Додано кнопку редагування, щоб використати handleEditClick */}
              {canEdit && (
                <button className="text-info" onClick={handleEditClick}>
                  <span className="icon icon-pencil font-size-20" />
                </button>
              )}
              <button
                className={`p-0 ${!canDelete ? "opacity-30 cursor-not-allowed" : "text-danger"}`}
                onClick={handleDeleteClick}
                disabled={!canDelete}
              >
                <span className="icon icon-trash font-size-20" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-1.5 bg-green-50 rounded border border-green-200 mb-1">
          <div className="text-grey font-size-10">Статус:</div>
          <div className={`font-size-15 font-weight-bold ${getStatusClass(reclamation.status)}`}>
            {reclamation.status}
          </div>
        </div>

        <div className="mb-2 p-1.5 bg-yellow-50 rounded flex items-center justify-between border border-yellow-200">
          <div className="text-grey font-size-11 text-truncate">
            {reclamation.message || "Детальний опис відсутній"}
          </div>
          <button
            className="text-info font-size-11 underline ml-2"
            onClick={(e) => handleViewComments(e, reclamation.comments || [])}
          >
            <i className="fas fa-comments" style={{ color: reclamation.hasUnreadMessages ? "red" : "inherit", marginRight: "3px" }}></i>
          </button>
        </div>

        <div className="flex justify-center mt-2 pt-1.5 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <span className="text-grey font-size-11">{expanded ? "Приховати" : "Деталі"}</span>
            <span className={`icon ${expanded ? "icon-chevron-up" : "icon-chevron-down"} font-size-12 text-grey`}></span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="item-details column gap-2.5 mt-2">
          <ComplaintItemDetailViewMobile complaint={reclamation} />
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        baseTransactionGuid={reclamation.guid}
        transactionTypeId={2}
        manager={isCustomer ? reclamation.managerLink : reclamation.dealerId}
      />

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
  );
};