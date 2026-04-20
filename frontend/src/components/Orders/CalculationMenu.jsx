import "./CalcMenu.css";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
// import EditCalculationModal from "./EditCalculationModal";

export const CalculationMenu = ({ calc, _onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteIcon = "/assets/icons/DeleteIcon.png";

  
  const hasOrders =
    Array.isArray(calc.orders) &&
    calc.orders.some(
      (order) => order.number && String(order.number).trim() !== "",
    );

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Щоб не спрацював клік по самому рядку (accordion)
    if (!hasOrders) {
      setIsDeleteModalOpen(true);
    } else {
      // Можна додати сповіщення, чому не можна видалити
    }
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
<img 
  src={deleteIcon} 
  alt="Видалити" 
  onClick={!hasOrders ? handleDeleteClick : undefined}
  className={`w-[18px] h-[18px] object-contain transition-all
    ${hasOrders 
      ? "icon-delete-disabled cursor-not-allowed" 
      : "icon-delete-red cursor-pointer active:scale-95"
    }`} 
  title={hasOrders ? "Неможливо видалити: є замовлення" : "Видалити прорахунок"}
/>

      {/* Модалка видалення */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)} // Чітке закриття
        onDeleted={onDelete} // Передаємо функцію видалення з пропсів
        itemData={calc}
        itemType="calculation"
      />

      {/* Модалка редагування
      <EditCalculationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        calculation={calc}
        onSave={(updated) => {
          setIsEditModalOpen(false);
          onEdit?.(updated);
        }}
      /> */}
    </div>
  );
};
