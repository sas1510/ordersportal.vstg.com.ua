import React, { useEffect } from 'react';
import axiosInstance from '../../api/axios.js';
import './DeleteConfirmModal.css';
import { useNotification } from '../notification/Notifications.jsx';
import { FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

const DeleteConfirmModal = ({ isOpen, onClose, itemData, itemType: propItemType, onDeleted }) => {
  const { addNotification } = useNotification();
  const itemName =
    itemData.number || itemData.title || itemData.orderNumber || itemData.id || 'цей запис';

  const mapType = {
    order: 'замовлення',
    calculation: 'прорахунок',
    client: 'клієнта',
    product: 'товар'
  };

  const itemType = mapType[propItemType] || mapType[itemData.type] || 'запис';

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [isOpen]);

  const handleDelete = async () => {
    try {
      let endpoint = '';

      switch (propItemType || itemData.type) {
        case 'calculation':
          endpoint = `/calculations/${itemData.id}/delete/`;
          break;
        case 'order':
          endpoint = `/orders/${itemData.id}/delete/`;
          break;
        case 'client':
          endpoint = `/clients/${itemData.id}/delete/`;
          break;
        case 'product':
          endpoint = `/products/${itemData.id}/delete/`;
          break;
        default:
          console.warn('Невідомий тип елемента для видалення:', itemData);
          addNotification('Невідомий тип елемента ❌', 'error');
          return;
      }

      await axiosInstance.delete(endpoint);

      if (onDeleted) onDeleted(itemData.id);

      addNotification(`${itemType} "${itemName}" успішно видалено ✅`, 'success'); // ✅ сповіщення про успіх
      onClose();
    } catch (error) {
      console.error('Помилка при видаленні:', error);
      const msg = error.response?.data?.error || `Не вдалося видалити ${itemType}`;
      addNotification(msg, 'error'); // ✅ сповіщення про помилку
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-square" onClick={(e) => e.stopPropagation()}>
        <div className="modal-border-top" />
        <div className="modal-header">
          <div className="header-icon">
            <FaExclamationTriangle size={50} color="#e74c3c" />
          </div>
          <h2>Підтвердження видалення</h2>
        </div>
        <div className="modal-body">
          <p>
            Ви дійсно бажаєте видалити {itemType} "<strong>{itemName}</strong>"?
          </p>
          <p className="description">
            Ця дія є незворотною. Всі пов'язані дані будуть також видалені.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-grey" onClick={onClose}>
            <FaTimes style={{ marginRight: 6 }} /> Скасувати
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <FaTrash style={{ marginRight: 6 }} /> Видалити
          </button>
        </div>
        <div className="modal-border-bottom" />
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
