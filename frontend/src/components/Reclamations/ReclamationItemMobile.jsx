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
import { ComplaintItemDetailView } from "./ComplaintItemSummaryDesktop";

export const ReclamationItemMobile = ({
  reclamation,
  onDelete,
  onEdit,
  isExpanded,
  onToggle,
  _expandedIssueId, 
  _onIssueToggle,   
  onMarkAsRead,
}) => {

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { role } = useAuthGetRole();

  if (!reclamation) {
    return null;
  }


  const expanded = isExpanded;
  const toggleExpanded = onToggle;
  const isCustomer = role === "customer";
  const canEdit = !isCustomer && reclamation.status !== "Закрита";
  const deleteIcon  = "/assets/icons/DeleteIcon.png";

  const profileReclamation = "/assets/icons/ProfileReclamation.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";


  
  const managerAssigned =
    reclamation.manager &&
    reclamation.manager !== "N/A" &&
    reclamation.manager !== "Не вказано";


  const canDelete =  !managerAssigned;

 
  const handleEditClick = (e) => { 
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




  const getStatusClass = (status) => {
    if (status && status.includes("Виробництво")) {
      return "text-WS---DarkBlueProfile";
    }

    switch (status) {
          case "Новий":

            return "text-WS---DarkRed";

          case "В роботі":
            return "text-WS---DarkBlue";
            
          case "Виробництво":
            return "text-WS---DarkBlueProfile"

              
          case "На складі":
            return "text-WS---DarkGrey";

          case "Відвантажений":
          case "Підтверджено" :
            return "text-WS---DarkPurple";
          case "Вирішено":
            return "text-WS---DarkGreen";


          case "Відмова":
            return "text-WS---MiddleGrey";

          default:
            return "text-WS---MiddleGrey ";
        }




  };

  return (
    <div
      className="reclamation-item column font-['Inter']"
      style={{
        borderTop: Number(reclamation.numberWEB) > 0   ? "7px solid rgb(186, 82, 59)"
            : "7px solid rgb(107, 152, 191)",

        paddingLeft: "12px",
      }}
    >


     <div
  className="flex flex-col w-full  font-['Inter']"
  onClick={toggleExpanded}
>
 
  <div className="flex items-stretch justify-between mb-1 w-full gap-3 min-h-[60px] pb-1 border-bottom">
    

    <div className="basis-2/5 flex flex-col justify-center items-start pr-2 border-right shrink-0">
      <div className="flex flex-col w-full text-start gap-[6px] no-wrap">
        <div className="text-base font-bold w-full text-start pb-1 text-WS---DarkGrey border-bottom leading-tight no-wrap">
          № {reclamation.id}
        </div>
        <div className="text-xs pt-0.5 text-start text-WS---DarkGrey no-wrap">
          від {reclamation.date}
        </div>
      </div>
    </div>


<div className="basis-2/5 font-['Inter'] flex flex-col justify-center items-start min-w-0 border-right px-2 gap-1">
  

  <div className={`flex items-center gap-1  pb-1  border-bottom w-full  ${getStatusClass(reclamation.status)}`}>
    <span className="icon-info-with-circle text-[18px] shrink-0 mr-1"></span>
    <span className="text-[13px] leading-tight truncate">
      {reclamation.status}
    </span>
  </div>


  <div className="flex items-center gap-1 pt-0.5 text-WS---DarkGrey w-full ">

      <img 
        src={profileReclamation} 
        alt="Історія" 
        className={`mr-1`} 
      />
    <span className="text-[13px]  text-WS---DarkGrey truncate leading-tight">
      {reclamation.dealer || "Без дилера"}
    </span>
  </div>

</div>

    <div 
      className="flex-1 shrink-0 ml-auto flex flex-col justify-center items-center gap-2" 
      onClick={(e) => e.stopPropagation()}
    >
      {canEdit && (
        <button 
          className="text-info active:scale-95 transition-transform" 
          onClick={handleEditClick}
        >
          <span className="icon icon-pencil font-size-20" />
        </button>
      )}
      
      <img 
        src={deleteIcon} 
        alt="Видалити" 
        onClick={handleDeleteClick}
        className={`transition-all 
          ${!canDelete 
            ? "opacity-20 grayscale cursor-not-allowed" 
            : "icon-delete-red cursor-pointer active:scale-95"
          }`} 
        title={!canDelete ? "Немає прав на видалення" : "Видалити рекламацію"}
      />
    </div>
  </div>

 <div 
  className="flex flex-col w-full h-full rounded pb-2 border-bottom" 
  style={{ flex: "2 1 0%", minWidth: 0 }}
>

  <div 
    className="font-['Inter'] overflow-hidden" 
    style={{ 
      flex: "2 1 0%", 
      minHeight: 0,
      display: "flex",
      alignItems: "flex-start" 
    }}
  >
    <div className="w-full text-[13px] leading-tight text-gray-700 line-clamp-2">
      {reclamation.message || "Детальний опис відсутній"}
    </div>
  </div>

 
  <div 
    className="flex items-center justify-end pt-2" 
    style={{ flex: "1 1 0%", minHeight: 0 }}
  >
    <button
      className="flex items-center bg-transparent border-none p-0 cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation(); 
        handleViewComments(e, reclamation.comments || []);
      }}
    >
      <div className="relative flex items-center">
       
        <img 
          src={historyOfMessage} 
          alt="Історія" 
          className={`mr-1 ${
            reclamation.hasUnreadMessages ? "brightness-110" : ""
          }`} 
        />
        
       
        {reclamation.hasUnreadMessages && (
          <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-600 rounded-full border border-white" />
        )}
      </div>

      <span className="text-[13px] font-['Inter'] text-WS---DarkGrey  ml-1">
        Історія коментарів
      </span>
    </button>
  </div>
</div>




  

  


      
      

        <div className="flex justify-center mt-1.5 pb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-WS---DarkBlue font-bold border-b-[2px] border-WS---DarkBlue font-['Inter'] font-size-11">{expanded ? "Приховати" : "Деталі"}</span>
            <span className={`icon ${expanded ? "icon-chevron-up" : "icon-chevron-down"} font-size-12 text-grey`}></span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="item-details !border-t-0 column gap-2.5 mt-2">
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