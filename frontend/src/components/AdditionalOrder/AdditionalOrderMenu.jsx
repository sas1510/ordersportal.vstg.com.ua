import './CalcMenu.css';
import { useState } from 'react';
// Припускаємо, що ці компоненти будуть оновлені, але імпорт залишаємо для синтаксичної коректності
import DeleteConfirmModal from './DeleteConfirmModal'; 
import EditCalculationModal from './EditCalculationModal'; // Фактично EditAdditionalOrderModal

// Перейменовуємо компонент з CalculationMenu на AdditionalOrderMenu
export const AdditionalOrderMenu = ({ calc, onEdit, onDelete }) => {
  // Змінна calc тепер представляє Additional Order (Додаткове Замовлення)
  const additionalOrder = calc;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Додаткове замовлення вважається незмінним, якщо в ньому є підпорядковані замовлення
  const hasOrders = Array.isArray(additionalOrder.orders) && additionalOrder.orders.length > 0;

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!hasOrders) setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedOrder) => { // updatedOrder замість updatedCalc
    setIsEditModalOpen(false);
    onEdit?.(updatedOrder);
  };


  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!hasOrders) setIsDeleteModalOpen(true);
  };

  const handleCancel = () => setIsDeleteModalOpen(false);
  const handleConfirm = async () => {
    if (onDelete) await onDelete(additionalOrder.id); // Видаляємо додаткове замовлення за його id
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
      {/* Кнопка Редагувати */}
      <div
        className={`icon icon-pencil2 font-size-16 ${hasOrders ? 'inactive' : 'clickable text-info'}`}
        title={hasOrders ? 'Неможливо редагувати, є підпорядковані замовлення' : 'Редагувати додаткове замовлення'}
        onClick={handleEdit}
      />
      {/* Кнопка Видалити */}
      <div
        className={`icon icon-trash font-size-18 ${hasOrders ? 'inactive' : 'clickable text-danger'}`}
        title={hasOrders ? 'Неможливо видалити, є підпорядковані замовлення' : 'Видалити додаткове замовлення'}
        onClick={handleDeleteClick}
      />

      {/* Модалка підтвердження видалення */}
      <DeleteConfirmModal
        key={additionalOrder.id}
        isOpen={isDeleteModalOpen}
        onClose={handleCancel}
        onDeleted={handleConfirm}
        itemData={additionalOrder} // Передаємо дані додаткового замовлення
        itemType="additionalOrder" // Змінюємо тип елемента для відображення в модалці
      />

      {/* Модалка редагування (має бути EditAdditionalOrderModal) */}
      <EditCalculationModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        calculation={additionalOrder} // Передаємо дані додаткового замовлення
        onSave={handleSaveEdit}
      />
    </div>
  );
};