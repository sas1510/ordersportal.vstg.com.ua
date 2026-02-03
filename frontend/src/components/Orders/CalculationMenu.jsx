import './CalcMenu.css';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditCalculationModal from './EditCalculationModal';

export const CalculationMenu = ({ calc, onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const hasOrders = Array.isArray(calc.orders) && 
    calc.orders.some(order => order.number && String(order.number).trim() !== "");

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
      <div
        className={`icon icon-trash font-size-18 ${hasOrders ? 'inactive' : 'clickable text-danger'}`}
        onClick={handleDeleteClick}
      />

      {/* Модалка видалення */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)} // Чітке закриття
        onDeleted={onDelete} // Передаємо функцію видалення з пропсів
        itemData={calc}
        itemType="calculation"
      />

      {/* Модалка редагування */}
      <EditCalculationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        calculation={calc}
        onSave={(updated) => {
          setIsEditModalOpen(false);
          onEdit?.(updated);
        }}
      />
    </div>
  );
};