import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus } from "react-icons/fa";
import axiosInstance from "../../api/axios";

// --- КОНСТАНТИ ДЛЯ ЗІСТАВЛЕННЯ ---
const ITEM_OPTIONS = [
  { id: "1", text: "Імпост" },
  { id: "2", text: "Молдінг" },
  { id: "3", text: "Поріг" },
  { id: "4", text: "HPL" },
  { id: "5", text: "LAMPRE" },
  { id: "6", text: "Армування" },
  { id: "7", text: "Допи" },
  { id: "8", text: "ЛИСТ сендвіч панель" },
  { id: "9", text: "М/П конструкція" },
  { id: "10", text: "Маркер Б/У" },
  { id: "11", text: "Москітна сітка" },
  { id: "12", text: "Набір фурнітури" },
  { id: "13", text: "Відлив" },
  { id: "14", text: "Пакет косметики" },
  { id: "15", text: "Рама" },
  { id: "16", text: "Сендвіч панель" },
  { id: "17", text: "Створка" },
  { id: "18", text: "Склопакет" },
  { id: "19", text: "Ущільнювач" },
  { id: "20", text: "Хлист профілю" },
  { id: "21", text: "Штапік" },
  { id: "22", text: "Штульп" },
];

const REASON_OPTIONS = [
  { id: "1", text: "замінити фурнітуру за рахунок замовника" },
  { id: "2", text: "переробка за рахунок замовника" },
  { id: "3", text: "дозамовлення за рахунок замовника" },
  { id: "4", text: "замінити пошкоджені матеріали за рахунок замовника" },
  { id: "5", text: "замінити склопакет за рахунок замовника" },
];

// API для створення дозамовлення
const API_URL = "/create_additional_orders/";

export default function AddReorderModal({ isOpen, onClose, onSave }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);

  const [itemName, setItemName] = useState(ITEM_OPTIONS[0].id);
  const [reason, setReason] = useState(REASON_OPTIONS[0].id);

  const [comment, setComment] = useState("");

  const [isSending, setIsSending] = useState(false);

  // 🔍 СТАН ПЕРЕВІРКИ ЗАМОВЛЕННЯ
  const [orderExists, setOrderExists] = useState(null); // null = не перевіряли, true/false
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  // 🔍 ПЕРЕВІРКА ЗАМОВЛЕННЯ (автоматично через 600 мс після вводу)
  useEffect(() => {
    if (noOrder || !orderNumber.trim()) {
      setOrderExists(null);
      return;
    }

    const delay = setTimeout(async () => {
      setIsChecking(true);

      try {
        const response = await axiosInstance.get(
          `/check_order/?order_number=${orderNumber}`
        );

        setOrderExists(response.data.order_exists);
      } catch (err) {
        setOrderExists(false);
      } finally {
        setIsChecking(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [orderNumber, noOrder]);

  const resetForm = () => {
    setOrderNumber("");
    setNoOrder(false);
    setItemName(ITEM_OPTIONS[0].id);
    setReason(REASON_OPTIONS[0].id);
    setComment("");
    setOrderExists(null);
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Якщо замовлення відсутнє — не надсилати
    if (!noOrder && orderExists === false) {
      alert("❌ Замовлення не знайдене!");
      return;
    }

    const selectedItem = ITEM_OPTIONS.find(opt => opt.id === itemName);
    const selectedReason = REASON_OPTIONS.find(opt => opt.id === reason);

    const payload = {
      orderNumber: noOrder ? null : orderNumber,
      noOrder,
      itemNameText: selectedItem.text,
      reasonText: selectedReason.text,
      comment,
      series: [],
      photos: [],
      issue: "",
      solution: "",
    };

    setIsSending(true);

    try {
      const response = await axiosInstance.post(API_URL, payload);
      alert("Успішно створено!");
    } catch (error) {
      alert("Помилка: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
      handleCloseWithReset();
    }
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
          
          {/* ---------------- НОМЕР ЗАМОВЛЕННЯ ---------------- */}
          <label className="reorder-label">
            <span>Номер замовлення:</span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              disabled={noOrder || isSending}
              className="reorder-input"
            />
          </label>

          {/* 🔍 ІНДИКАТОР */}
          {!noOrder && orderNumber.trim() && (
            <div style={{ fontSize: "14px", marginTop: "-10px" }}>
              {isChecking && <span>⏳ Перевірка...</span>}
              {!isChecking && orderExists === true && (
                <span style={{ color: "green" }}>✔ Замовлення існує</span>
              )}
              {!isChecking && orderExists === false && (
                <span style={{ color: "red" }}>❌ Не знайдено</span>
              )}
            </div>
          )}

          <label className="reorder-label reorder-row">
            <input
              type="checkbox"
              checked={noOrder}
              onChange={(e) => setNoOrder(e.target.checked)}
            />
            <span>Без замовлення:</span>
          </label>

          {/* -------------------------------------------- */}

          <label className="reorder-label">
            <span>Елемент на дозамовлення:</span>
            <select
              className="reorder-select"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={isSending}
            >
              {ITEM_OPTIONS.map(item => (
                <option key={item.id} value={item.id}>{item.text}</option>
              ))}
            </select>
          </label>

          <label className="reorder-label">
            <span>Причина дозамовлення:</span>
            <select
              className="reorder-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSending}
            >
              {REASON_OPTIONS.map(r => (
                <option key={r.id} value={r.id}>{r.text}</option>
              ))}
            </select>
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
              disabled={isSending}
            >
              <FaTimes /> Відмінити
            </button>

            <button
              type="submit"
              className="reorder-btn-save"
              disabled={
                isSending ||
                (!noOrder && orderExists === false) // ❌ Заборонити, якщо замовлення не існує
              }
            >
              {isSending ? "Відправка..." : <><FaPlus /> Додати дозамовлення</>}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
