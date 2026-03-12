import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus, FaSpinner } from "react-icons/fa";
import axiosInstance from "../../api/axios"; 
import CustomSelect from "./CustomSelect"; 
import "./AddReorderModal.css";

export default function AddReorderModal({ isOpen, onClose, onSave, initialOrderNumber }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);
  const [nomenclature, setNomenclature] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [quantity, setQuantity] = useState(1); // 🔥 Новий стан для кількості
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
        axiosInstance.get("/additional_orders/get_issue_additional_order/") 
      ]);

      const nomData = nomRes.data?.nomenclature || []; 
      const formattedNom = nomData.map(item => ({
        ...item,
        Link: item.Link || item.URL,
        Name: item.Name
      }));

      const reasonData = reasonRes.data?.issues || [];
      const formattedReasons = reasonData.map(r => ({
        ...r,
        Link: r.Link,
        Name: r.Наименование || r.Name
      }));

      setNomenclature(formattedNom);
      setReasons(formattedReasons);

      if (formattedNom.length > 0) setSelectedItem(formattedNom[0].Link); 
      if (formattedReasons.length > 0) setSelectedReason(formattedReasons[0].Link);
      
    } catch (err) {
      console.error("Помилка завантаження довідників:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOrderNumber("");
    setNoOrder(false);
    setSelectedItem(nomenclature.length > 0 ? nomenclature[0].Link : "");
    setSelectedReason(reasons.length > 0 ? reasons[0].Link : "");
    setQuantity(1); // 🔥 Скидання кількості
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
      noOrder: noOrder,
      nomenclatureLink: selectedItem,
      // issueLink: selectedReason,
      quantity: Number(quantity), 
      comment: comment,
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
            <span>Номер замовлення:</span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              disabled={noOrder}
              className="reorder-input"
              placeholder="Введіть номер..."
            />
          </div>

          <label className="reorder-label reorder-row">
            <input
              type="checkbox"
              checked={noOrder}
              onChange={(e) => setNoOrder(e.target.checked)}
            />
            <span>Без замовлення</span>
          </label>

          <CustomSelect
            label="Елемент на дозамовлення:"
            options={nomenclature}
            value={selectedItem}
            onChange={setSelectedItem}
            disabled={loading}
            placeholder={loading ? "Завантаження..." : "-- Оберіть елемент --"}
          />

          {/* 🔥 НОВЕ ПОЛЕ: Кількість */}
          <div className="reorder-label">
            <span>Кількість:</span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="reorder-input"
              placeholder="1"
              required
            />
          </div>

          {/* <CustomSelect
            label="Причина дозамовлення:"
            options={reasons}
            value={selectedReason}
            onChange={setSelectedReason}
            disabled={loading}
            placeholder={loading ? "Завантаження..." : "-- Оберіть причину --"}
          /> */}

          <label className="reorder-label">
            <span>Коментар контрагента:</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="reorder-textarea"
              placeholder="Ваш коментар..."
            />
          </label>

          <div className="reorder-modal-footer">
            <button type="button" className="reorder-btn-cancel" onClick={handleCloseWithReset}>
              <FaTimes /> Відмінити
            </button>
            <button type="submit" className="reorder-btn-save" disabled={loading || (!noOrder && !orderNumber)}>
              {loading ? <FaSpinner className="spinner" /> : <FaPlus />} Додати
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}