import './CalcMenu.css';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditCalculationModal from './EditCalculationModal';

export const CalculationMenu = ({ calc, onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasOrders = Array.isArray(calc.orders) && calc.orders.length > 0;

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!hasOrders) setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedCalc) => {
    setIsEditModalOpen(false);
    onEdit?.(updatedCalc); // optional chaining безпечніше
  };


  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!hasOrders) setIsDeleteModalOpen(true);
  };

  const handleCancel = () => setIsDeleteModalOpen(false);
  const handleConfirm = async () => {
    if (onDelete) await onDelete(calc.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
      <div
        className={`icon icon-pencil2 font-size-16 ${hasOrders ? 'inactive' : 'clickable text-info'}`}
        title={hasOrders ? 'Недоступно для редагування' : 'Редагувати'}
        onClick={handleEdit}
      />
      <div
        className={`icon icon-trash font-size-18 ${hasOrders ? 'inactive' : 'clickable text-danger'}`}
        title={hasOrders ? 'Недоступно для видалення' : 'Видалити'}
        onClick={handleDeleteClick}
      />

      <DeleteConfirmModal
        key={calc.id}
        isOpen={isDeleteModalOpen}
        onClose={handleCancel}
        onDeleted={handleConfirm}
        itemData={calc}
        itemType="calculation"
      />

      <EditCalculationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        calculation={calc}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
