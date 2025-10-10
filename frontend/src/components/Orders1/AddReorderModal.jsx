import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./AddReorderModal.css";

export default function AddReorderModal({ isOpen, onClose, onSave }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);
  const [itemName, setItemName] = useState("1"); // за замовчуванням перший option
  const [reason, setReason] = useState("1"); // за замовчуванням перший option
  const [impost, setImpost] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  const resetForm = () => {
    setOrderNumber("");
    setNoOrder(false);
    setItemName("1");
    setReason("1");
    setImpost("");
    setComment("");
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      orderNumber: noOrder ? null : orderNumber,
      noOrder,
      itemName,
      impost,
      reason,
      comment,
    };

    console.log("Дані дозамовлення:", formData);
    onSave?.(formData);
    handleCloseWithReset();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="reorder-modal-overlay" onClick={handleCloseWithReset}>
      <div className="reorder-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="reorder-modal-header">
          <div className="reorder-header-content">
            <span className="reorder-icon"><FaPlus /></span>
            <h3>Дозамовлення</h3>
          </div>
          <FaTimes className="reorder-close-btn" onClick={handleCloseWithReset} />
        </div>

        <form className="reorder-form" onSubmit={handleSubmit}>
          <label className="reorder-label">
            <span>Номер замовлення:</span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              disabled={noOrder}
              className="reorder-input"
            />
          </label>
            <label className="reorder-label reorder-row">
            <input
                type="checkbox"
                checked={noOrder}
                onChange={(e) => setNoOrder(e.target.checked)}
            />
            <span>Без замовлення:</span>
       
            </label>



          <label className="reorder-label">
            <span>Елемент на дозамовлення:</span>
            <select
              className="reorder-select"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            >
              <option value="1">Імпост</option>
              <option value="2">Молдінг</option>
              <option value="3">Поріг</option>
              <option value="4">HPL</option>
              <option value="5">LAMPRE</option>
              <option value="6">Армування</option>
              <option value="7">Допи</option>
              <option value="8">ЛИСТ сендвіч панель</option>
              <option value="9">М/П конструкція</option>
              <option value="10">Маркер Б/У</option>
              <option value="11">Москітна сітка</option>
              <option value="12">Набір фурнітури</option>
              <option value="13">Відлив</option>
              <option value="14">Пакет косметики</option>
              <option value="15">Рама</option>
              <option value="16">Сендвіч панель</option>
              <option value="17">Створка</option>
              <option value="18">Склопакет</option>
              <option value="19">Ущільнювач</option>
              <option value="20">Хлист профілю</option>
              <option value="21">Штапік</option>
              <option value="22">Штульп</option>
            </select>
          </label>

          <label className="reorder-label">
            <span>Причина дозамовлення:</span>
            <select
              className="reorder-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="1">замінити фурнітуру за рахунок замовника</option>
              <option value="2">переробка за рахунок замовника</option>
              <option value="3">дозамовлення за рахунок замовника</option>
              <option value="4">замінити пошкоджені матеріали за рахунок замовника</option>
              <option value="5">замінити склопакет за рахунок замовника</option>
            </select>
          </label>

          <label className="reorder-label">
            <span>Імпост:</span>
            <input
              type="text"
              value={impost}
              onChange={(e) => setImpost(e.target.value)}
              className="reorder-input"
            />
          </label>

          <label className="reorder-label">
            <span>Коментар контрагента:</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="reorder-textarea"
            />
          </label>

          <div className="reorder-modal-footer">
            <button
              type="button"
              className="reorder-btn-cancel"
              onClick={handleCloseWithReset}
            >
              <FaTimes /> Відмінити
            </button>
            <button type="submit" className="reorder-btn-save">
              <FaPlus /> Додати дозамовлення
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
