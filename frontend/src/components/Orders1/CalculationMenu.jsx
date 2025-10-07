import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CalcMenu.css';
import DeleteCalcModal from './DeleteCalcModal';

export const CalculationMenu = ({ calc, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const hasOrders = Array.isArray(calc.orders) && calc.orders.length > 0;

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (hasOrders) return;

    if (!isMenuOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isLeftMenu = buttonRef.current.classList.contains('calc-menu-left');

      const left = isLeftMenu
        ? rect.left - 180 - 5
        : rect.right + 5;

      setMenuPosition({ top: rect.top + window.scrollY, left });
    }
    setIsMenuOpen(prev => !prev);
  };

  const handleClickOutside = () => setIsMenuOpen(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    if (hasOrders) return;
    setIsMenuOpen(false);
    onEdit && onEdit(calc);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (hasOrders) return;
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirm = () => {
    onDelete && onDelete(calc.internals.uuid);
    setIsDeleteModalOpen(false);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className="summary-item row w-2 no-wrap calc-menu-left" ref={buttonRef}>
      <div
        className={`icon icon-menu font-size-20 calc-menu-btn ${
          !hasOrders ? (isMenuOpen ? 'active' : 'text-blue') : 'text-grey'
        }`}
        onClick={handleMenuToggle}
        style={{ cursor: !hasOrders ? 'pointer' : 'not-allowed' }}
        title={!hasOrders ? `Меню прорахунку №${calc.number}` : 'Прорахунок неактивний'}
      />

      {isMenuOpen && (!hasOrders) &&
        createPortal(
          <>
            <div className="calc-menu-overlay" />
            <div
              className="calc-menu column gap-7"
              style={{ top: menuPosition.top, left: menuPosition.left, position: 'absolute' }}
            >
              <div className="calc-menu-item row gap-5 align-center w-100 text-grey" onClick={handleEdit}>
                <span className="icon-pencil2 font-size-12 text-info"></span>
                <span className="font-size-14">Редагувати</span>
              </div>
              <div
                className="calc-menu-item row gap-5 align-center w-100 text-grey"
                onClick={handleDeleteClick}
              >
                <span className="icon-trash font-size-14 text-danger"></span>
                <span className="font-size-14">Видалити</span>
              </div>

              {isDeleteModalOpen && (
                <DeleteCalcModal
                  calc={calc}
                  onCancel={handleCancel}
                  onConfirm={handleConfirm}
                />
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
