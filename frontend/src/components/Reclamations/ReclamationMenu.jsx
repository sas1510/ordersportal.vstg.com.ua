import './ReclamationMenu.css';
import { useState } from 'react';
import DeleteConfirmationModal from '../Orders/DeleteConfirmModal';
// import EditReclamationModal from './EditReclamationModal'; // якщо згодом буде потрібно
import { useAuth } from '../../hooks/useAuth';

export const ReclamationMenu = ({ reclamation, onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!reclamation) return null;

  // 🔐 Ролі користувачів
  const { user, role } = useAuth();
 
  const isCustomer = role === 'customer';

  // ⚙️ Доступ до дій
  const canEdit = !isCustomer && reclamation.status !== 'Закрита';
  const canDelete = reclamation.status === 'Нова';

  // ✏️ Редагування
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (!canEdit) return;
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedReclamation) => {
    setIsEditModalOpen(false);
    onEdit?.(updatedReclamation);
  };

  // 🗑️ Видалення
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!canDelete) return;
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => setIsDeleteModalOpen(false);
  const handleConfirmDelete = async () => {
    if (onDelete) await onDelete(reclamation.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
      {/* ✏️ Редагувати */}
      <div
        className={`icon icon-pencil2 font-size-16 ${!canEdit ? 'inactive' : 'clickable text-info'}`}
        title={!canEdit ? 'Недоступно для редагування' : 'Редагувати'}
        onClick={handleEditClick}
      />

      {/* 🗑️ Видалити */}
      <div
        className={`icon icon-trash font-size-18 ${!canDelete ? 'inactive' : 'clickable text-danger'}`}
        title={!canDelete ? 'Недоступно для видалення' : 'Видалити'}
        onClick={handleDeleteClick}
      />

      {/* 🧾 Модальне вікно підтвердження видалення */}
      <DeleteConfirmationModal
        key={reclamation.id}
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Підтвердження видалення"
        message={`Ви впевнені, що хочете видалити рекламацію №${reclamation.number}? Це незворотна дія.`}
      />

      {/* 🛠️ Модальне вікно редагування (якщо згодом додаси)
      {isEditModalOpen && (
        <EditReclamationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          reclamation={reclamation}
          onSave={handleSaveEdit}
        />
      )} */}
    </div>
  );
};

export default ReclamationMenu;
