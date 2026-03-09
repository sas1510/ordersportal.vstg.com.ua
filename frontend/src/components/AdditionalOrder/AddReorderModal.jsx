import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus, FaSpinner } from "react-icons/fa";
import axiosInstance from "../../api/axios"; 
import "./AddReorderModal.css";

export default function AddReorderModal({ isOpen, onClose, onSave, initialOrderNumber }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);
  const [nomenclature, setNomenclature] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrderNumber(initialOrderNumber || "");
      fetchDropdownData();
    }
  }, [isOpen, initialOrderNumber]);

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const [nomRes, reasonRes] = await Promise.all([
        axiosInstance.get("/additional_orders/additional_order_nomenclature/"),
        axiosInstance.get("/complaints/issues/") 
      ]);

      // 1. Перевіряємо сиру відповідь від сервера
      console.log("Full response from API (nomRes):", nomRes);

      // 2. Перевіряємо вміст nomenclature
      const nomData = nomRes.data?.nomenclature || []; 
      console.log("Extracted nomenclature data:", nomData);

      const reasonData = reasonRes.data?.issues || [];
      console.log("Extracted reasons data:", reasonData);

      setNomenclature(nomData);
      setReasons(reasonData);

      if (nomData.length > 0) setSelectedItem(nomData[0].URL); 
      if (reasonData.length > 0) setSelectedReason(reasonData[0].Link);
      
    } catch (err) {
      console.error("Помилка завантаження довідників:", err);
      // Перевіряємо деталі помилки, якщо запит не пройшов
      if (err.response) {
         console.log("Server error data:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setOrderNumber("");
    setNoOrder(false);
    // Захист від помилок при порожніх списках
    setSelectedItem(nomenclature.length > 0 ? nomenclature[0].Link : "");
    setSelectedReason(reasons.length > 0 ? reasons[0].Link : "");
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
      itemLink: selectedItem, 
      reasonLink: selectedReason, 
      comment,
    };
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
          <div className="reorder-label">
            <div className="reorder-row">
              <span>Номер замовлення:</span>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={noOrder}
                className="reorder-input"
              />
            </div>
          </div>

          <label className="reorder-label reorder-row">
            <input
              type="checkbox"
              checked={noOrder}
              onChange={(e) => setNoOrder(e.target.checked)}
            />
            <span>Без замовлення</span>
          </label>

        <label className="reorder-label">
            <span>Елемент на дозамовлення:</span>
            <select
              className="reorder-select "
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              disabled={loading}
            >
              {loading ? (
                <option>Завантаження...</option>
              ) : (
                nomenclature.map((item) => (
                  // ВИПРАВЛЕНО: Використовуємо item.Name згідно з вашим JSON
                  <option key={item.URL} value={item.URL}>
                    {item.Name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="reorder-label">
            <span>Причина дозамовлення:</span>
            <select
              className="reorder-select "
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={loading}
            >
              {loading ? (
                <option>Завантаження...</option>
              ) : (
                reasons.map((reason) => (
                  // Перевірка на назву поля (Наименование або Name)
                  <option style={{maxWidth : '600px'}} key={reason.Link} value={reason.Link}>
                    {reason.Наименование || reason.Name}
                  </option>
                ))
              )}
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
            <button type="button" className="reorder-btn-cancel" onClick={handleCloseWithReset}>
              <FaTimes /> Відмінити
            </button>
            <button type="submit" className="reorder-btn-save" disabled={loading}>
              {loading ? <FaSpinner className="spinner" /> : <FaPlus />} Додати дозамовлення
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}