import React, { useState, useRef, useEffect } from "react";

// import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "../Orders/CommentsModal";
// import useWindowWidth from "../../hooks/useWindowWidth";
import DeleteConfirmModal from "../Orders/DeleteConfirmModal"; 
import { ComplaintItemDetailView } from "./ComplaintItemSummaryDesktop";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { formatDateHumanShorter } from "../../utils/formatters";


export const ReclamationItem = ({
  reclamation,
  onDelete,
  _onEdit,
  isExpanded,
  onToggle,
  onMarkAsRead,

}) => {

  const expanded = isExpanded;
  const toggleExpanded = onToggle;

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [_selectedComments, setSelectedComments] = useState([]);
//   const windowWidth = useWindowWidth();
//   const isMobile = windowWidth < 1024;


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const menuRef = useRef(null);
  const deleteIcon = "/assets/icons/DeleteIcon.png";
  const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
  const profileReclamation = "/assets/icons/ProfileReclamation.png";

  // const userRaw = localStorage.getItem("user");
  // const user = userRaw ? JSON.parse(userRaw) : null;

  // const writerGuid = user?.user_id_1c;


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


  // const getStatusClass = useCallback((status) => {
  //       switch (status) {
  //         case "Новий":
    
    
  //           return "text-WS---DarkBlue";
            
  //         case "Очікуємо підтвердження":
  //           return "text-WS---Orange";
  //         case "Очікуємо оплату":
  //           return "text-WS---DarkRed";
    
  //         case "Підтверджений":
  //           return "text-WS---DarkGrey";
    
  //         case "У виробництві":
  //           return "text-WS---DarkBlueProfile"
  //         case "В обробці":
    
    
  //         case "Відмова":
  //           return "text-WS---MiddleGrey";
    
  //         case "Готовий":
  //           return "text-WS---DarkGreen";
  //         case "Відвантажений":
  //           return "text-WS---DarkPurple";
    
  //         default:
  //           return "text-WS---MiddleGrey ";
  //       }
  //     }, []);

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

//   const responsibleManager = reclamation.manager || "Не вказано";
//   const deliveryDate = reclamation.deliveryDate || "Не вказано";
//   const actNumber = reclamation.actNumber || "Не вказано";

  return (
    <div
      className="reclamation-item column"
      style={{
        borderLeft:
          Number(reclamation.numberWEB) > 0
            ? "7px solid rgb(186, 82, 59)"
            : "7px solid rgb(107, 152, 191)",

        paddingLeft: "12px",
      }}
    >
      <div className="item-summary row w-100" onClick={toggleExpanded}>
        {/* <div className="summary-item row no-wrap" style={{ flexBasis: "3%" }}>
          <span className="icon icon-tools2 font-size-22 text-success"></span>
        </div> */}

        <div className="summary-item row no-wrap !pl-0 " style={{ flexBasis: "15%" }}>
          <div className="column !pl-0 w-full pr-3">
            <div className="text-base text-bold w-full text-WS---DarkGrey border-bottom">
              № {reclamation.id}
            </div>
            <div className="text-[13px] text-WS---DarkGrey">
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

<div className="summary-item expandable row w-30 align-start space-between !pt-0" >

  <div className="flex flex-col w-full h-full" style={{ flex: "2 1 0%", minWidth: 0 }}>


    <div 
      className="comments-text-wrapper-last font-['Inter'] overflow-hidden" 
      style={{ 
        flex: "2 1 0%", 
        minHeight: 0,
        display: "flex",
        alignItems: "flex-start" 
      }}
    >
      <div className="w-full text-[14px] leading-tight line-clamp-2">
        {reclamation.message || "Без коментарів"}
      </div>
    </div>


    <div 
      className="flex items-center justify-end" 
      style={{ flex: "1 1 0%", minHeight: 0 }}
    >
      <button
        className="btn-comments flex items-center bg-transparent border-none p-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleViewComments(reclamation.message || []);
        }}
      >
        <div className="relative flex items-center">
          <img 
            src={historyOfMessage} 
            alt="Історія" 
            className={`mr-1 w-[18px] h-[18px] object-contain ${
              reclamation.hasUnreadMessages ? "brightness-110" : ""
            }`} 
          />
          {reclamation.hasUnreadMessages && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-[var(--danger-color)] rounded-full border border-white" />
          )}
        </div>
        <span className="text-[13px] font-['Inter'] text-WS---DarkGrey pr-2">
          Історія коментарів
        </span>
      </button>
    </div>


  </div>
</div>

        <div
          className="summary-item flex items-center whitespace-normal"
          style={{ flexBasis: "15%" }}
        >
          {reclamation.dealer && (
            <div className="flex items-center gap-1 text-grey text-[13px] break-words">
              {/* <span className="icon icon-user text-dark shrink-0"></span> */}

                  <img 
                      src={profileReclamation} 
                      alt="Історія" 
                      className={`mr-1`} 
                    />
              <span className="text-dark leading-snug font-['Inter']">
                {reclamation.dealer}
              </span>
            </div>
          )}
        </div>

        <div className="summary-item row no-wrap" style={{ flexBasis: "15%" }}>
          <div className={`icon-info-with-circle font-size-24  ${getStatusClass(reclamation.status)}`}></div>
          <div
            className={`column gap-2 text-[13px] no-wrap calc-status font-['Inter'] ${getStatusClass(reclamation.status)}`}
          >
            <div className="text-[13px]">
              {reclamation.status}
            </div>
          </div>
        </div>


        <div
          className="summary-item row no-wrap gap-4 align-center"
          style={{ flexBasis: "4%" }}
          onClick={(e) => e.stopPropagation()}
        >


          <div
          className="summary-item row no-wrap gap-4 align-center"
          onClick={(e) => e.stopPropagation()}
        >

          <img
            src={deleteIcon}
            alt="Видалити"
            className={`transition-all ${
              !canDelete 
                ? "opacity-30 grayscale cursor-not-allowed" 
                : "icon-delete-red cursor-pointer active:scale-95"
            }`}
            title={
              !canDelete
                ? managerAssigned
                  ? "Неможливо видалити: призначено менеджера"
                  : "Недоступно для видалення"
                : "Видалити"
            }
            onClick={canDelete ? handleDeleteClick : undefined}
          />
        </div>


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

   

      {expanded && (
        <div className="item-details column gap-14 !w-full">
   
          <ComplaintItemDetailView
            key={reclamation.id}
            complaint={reclamation}
          />
        </div>
      )}


      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        baseTransactionGuid={reclamation.guid} 
        transactionTypeId={2} 
        // manager={reclamation.managerLink}
        manager={isCustomer ? reclamation.managerLink : reclamation.dealerId}
      />
    </div>
  );
};
