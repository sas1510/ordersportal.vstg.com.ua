import React from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import './ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Підтвердження дії",
  message = "Ви впевнені, що хочете виконати цю дію?",
  confirmText = "Підтвердити",
  cancelText = "Скасувати",
  type = "warning" // warning, danger, success, info
}) => {
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const getTypeColor = () => {
    switch(type) {
      case 'danger': return '#e74c3c';
      case 'success': return '#76b448';
      case 'info': return '#4a90e2';
      case 'warning':
      default: return '#f39c12';
    }
  };

  const getTypeIcon = () => {
    switch(type) {
      case 'danger': return <FaExclamationTriangle size={40} />;
      case 'success': return <FaCheck size={40} />;
      case 'info': return <FaExclamationTriangle size={40} />;
      case 'warning':
      default: return <FaExclamationTriangle size={40} />;
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-window" onClick={(e) => e.stopPropagation()}>
        <div 
          className="confirm-modal-border-top" 
          style={{ backgroundColor: getTypeColor() }}
        >
          <div className="confirm-modal-header">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {getTypeIcon()}
            </span>
            <h3>{title}</h3>
            <span className="icon icon-cross confirm-close-btn" onClick={onClose}></span>
          </div>
        </div>

        <div className="confirm-modal-body">
          <div className="confirm-icon-wrapper" style={{ backgroundColor: `${getTypeColor()}15` }}>
            <div style={{ color: getTypeColor() }}>
              {getTypeIcon()}
            </div>
          </div>
          <p className="confirm-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button className="confirm-btn-cancel" onClick={onClose}>
            <FaTimes size={16} color="#fff" /> {cancelText}
          </button>

          <button
            className="confirm-btn-confirm"
            onClick={handleConfirm}
            style={{ backgroundColor: getTypeColor() }}
          >
            <FaCheck size={16} color="#fff" /> {confirmText}
          </button>
        </div>

        <div 
          className="confirm-modal-border-bottom"
          style={{ backgroundColor: getTypeColor() }}
        />
      </div>
    </div>
  );
};

export default ConfirmModal;
