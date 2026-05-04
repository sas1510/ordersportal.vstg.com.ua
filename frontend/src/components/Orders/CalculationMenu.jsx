import "./CalcMenu.css";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";


export const CalculationMenu = ({ calc, _onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteIcon = "/assets/icons/DeleteIcon.png";

  
  const hasOrders =
    Array.isArray(calc.orders) &&
    calc.orders.some(
      (order) => order.number && String(order.number).trim() !== "",
    );

  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    if (!hasOrders) {
      setIsDeleteModalOpen(true);
    } else {

    }
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
<img 
  src={deleteIcon} 
  alt="Видалити" 
  onClick={!hasOrders ? handleDeleteClick : undefined}
  className={` transition-all
    ${hasOrders 
      ? "icon-delete-disabled cursor-not-allowed" 
      : "icon-delete-red cursor-pointer active:scale-95"
    }`} 
  title={hasOrders ? "Неможливо видалити: є замовлення" : "Видалити прорахунок"}
/>

   
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)} 
        onDeleted={onDelete} 
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
