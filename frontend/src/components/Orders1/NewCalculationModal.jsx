import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaUpload, FaTrash } from "react-icons/fa";
import { useNotification } from "../notification/Notifications.jsx";
import "./NewCalculationModal.css";

const NewCalculationModal = ({ isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [orderNumber, setOrderNumber] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не обрано");
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Отримати останній номер замовлення при відкритті модалки
  useEffect(() => {
    if (isOpen) fetchLastOrderNumber();
  }, [isOpen]);

  const fetchLastOrderNumber = async () => {
    try {
      const response = await axiosInstance.get("/last-order-number/");
      const lastNumber = response.data?.LastOrderNumber || 0;
      setOrderNumber(lastNumber + 1);
    } catch (error) {
      console.error("Не вдалося отримати останній номер замовлення:", error);
      addNotification("Не вдалося отримати останній номер замовлення ❌", "error");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setFileName(selected ? selected.name : "Файл не обрано");
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("Файл не обрано");
    const input = document.getElementById("new-calc-file");
    if (input) input.value = "";
  };

  const resetForm = () => {
    setOrderNumber("");
    setFile(null);
    setFileName("Файл не обрано");
    setItemsCount(1);
    setComment("");
  };

  // Закриття модалки через кнопки × або Відмінити
  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber || !file || !itemsCount || !comment.trim()) {
      addNotification("Будь ласка, заповніть усі поля та оберіть файл ❌", "error");
      return;
    }

    const formData = new FormData();
    formData.append("OrderNumber", orderNumber);
    formData.append("ConstructionsCount", itemsCount);
    formData.append("file", file);
    formData.append("Comment", comment);

    setLoading(true);
    try {
      const response = await axiosInstance.post("/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      addNotification(`Прорахунок №${orderNumber} успішно створено ✅`, "success");
      if (onSave) onSave(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Помилка при створенні:", error);
      addNotification("Помилка при збереженні замовлення ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
      <div 
        className="new-calc-modal-overlay" 
        onClick={() => onClose()} // клік поза модалкою закриває, форма не очищається
      >
        <div 
          className="new-calc-modal-window" 
          onClick={(e) => e.stopPropagation()} // зупиняємо клік всередині модалки
        >
          <div className="new-calc-modal-border-top">
            <div className="new-calc-modal-header">
              <span className="icon icon-calculator"></span>
              <h3>Створити новий прорахунок</h3>
              <span
                className="icon icon-cross new-calc-close-btn"
                onClick={handleCloseWithReset} // очищає + закриває
              ></span>
            </div>
          </div>
          
        <div className="new-calc-modal-body">
          <form className="new-calc-form" onSubmit={handleSubmit}>
            {/* Номер замовлення */}
            <label className="new-calc-label-row">
              <span>№:</span>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Номер замовлення"
                className="new-calc-input"
              />
            </label>

            {/* Завантаження файлу */}
            <div className="new-calc-file-upload">
              <label htmlFor="new-calc-file" className="new-calc-upload-label">
                <FaUpload size={20} />
                <span>Завантажити файл прорахунку (.zkz)</span>
                <input
                  type="file"
                  id="new-calc-file"
                  accept=".zkz"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <div className="new-calc-file-name">
                <span className={file ? "text-danger" : "text-grey"}>{fileName}</span>
                {file && (
                  <button
                    type="button"
                    className="new-calc-clear-file"
                    onClick={handleClearFile}
                    title="Очистити файл"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Кількість конструкцій */}
            <label className="new-calc-label-row">
              <span>Кількість конструкцій:</span>
              <input
                type="number"
                value={itemsCount}
                min="1"
                onChange={(e) => setItemsCount(e.target.value)}
                className="new-calc-input-number"
              />
            </label>

            {/* Коментар */}
            <label className="new-calc-label">
              <span>Коментар:</span>
              <textarea
                placeholder="Введіть коментар..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="new-calc-textarea"
              />
            </label>
          </form>
        </div>

        <div className="new-calc-modal-footer">
          <button className="new-calc-btn-cancel" onClick={handleCloseWithReset}>
            <FaTimes size={16} color="#fff" /> Відмінити
          </button>

          <button
            className="new-calc-btn-save"
            onClick={handleSubmit}
            disabled={loading}
          >
            <FaSave size={16} color="#fff" /> {loading ? "Створюємо..." : "Зберегти"}
          </button>
        </div>

        <div className="new-calc-modal-border-bottom" />
      </div>
    </div>
  );
};

export default NewCalculationModal;
