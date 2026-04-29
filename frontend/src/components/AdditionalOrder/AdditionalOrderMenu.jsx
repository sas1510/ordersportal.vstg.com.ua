// import "./CalcMenu.css";
// import { useState } from "react";
// import DeleteConfirmModal from "../Orders/DeleteConfirmModal";

// export const AdditionalOrderMenu = ({ calc, _onEdit, onDelete }) => {
//   const additionalOrder = calc;
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

//   const managerAssigned =
//     additionalOrder.managerName &&
//     additionalOrder.managerName.trim() !== "" &&
//     additionalOrder.managerName !== "Не вказано";

//   const handleDeleteClick = (e) => {
//     e.stopPropagation();

//     if (managerAssigned) return;
//     setIsDeleteModalOpen(true);
//   };

//   return (
//     <div className="summary-item small row no-wrap gap-10 align-center">
//       <div
//         className={`icon icon-trash font-size-18 ${managerAssigned ? "inactive" : "clickable text-danger"}`}
//         title={
//           managerAssigned
//             ? `Неможливо видалити: призначено менеджера (${additionalOrder.managerName})`
//             : "Видалити додаткове замовлення"
//         }
//         onClick={handleDeleteClick}
//       />

//       {/* Універсальна модалка підтвердження видалення */}
//       {isDeleteModalOpen && (
//         <DeleteConfirmModal
//           isOpen={isDeleteModalOpen}
//           onClose={() => setIsDeleteModalOpen(false)}
//           itemData={additionalOrder}
//           itemType="additionalOrder"
//           onDeleted={onDelete}
//         />
//       )}
//     </div>
//   );
// };
import "./CalcMenu.css";
import { useState } from "react";
import DeleteConfirmModal from "../Orders/DeleteConfirmModal";

export const AdditionalOrderMenu = ({ calc, _onEdit, onDelete }) => {
  const additionalOrder = calc;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Шлях до іконки
  const deleteIcon = "/assets/icons/DeleteIcon.png";

  const managerAssigned =
    additionalOrder.managerName &&
    additionalOrder.managerName.trim() !== "" &&
    additionalOrder.managerName !== "Не вказано";

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (managerAssigned) return;
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center" onClick={(e) => e.stopPropagation()}>
      <img
        src={deleteIcon}
        alt="Видалити"
        title={
          managerAssigned
            ? `Неможливо видалити: призначено менеджера (${additionalOrder.managerName})`
            : "Видалити додаткове замовлення"
        }
        onClick={handleDeleteClick}
        className={` object-contain transition-all ${
          managerAssigned 
            ? "opacity-20 grayscale cursor-not-allowed" 
            : "icon-delete-red cursor-pointer active:scale-95"
        }`}
      />

      {/* Універсальна модалка підтвердження видалення */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          itemData={additionalOrder}
          itemType="additionalOrder"
          onDeleted={onDelete}
        />
      )}
    </div>
  );
};