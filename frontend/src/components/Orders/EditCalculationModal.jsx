import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaUpload, FaTrash, FaDownload } from 'react-icons/fa';
import { useNotification } from '../notification/Notifications';
import "./EditCalculationModal.css";

const EditCalculationModal = ({ isOpen, onClose, calculation, onSave }) => {
  const { addNotification } = useNotification();

  const [file, setFile] = useState(null);
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("Файл не обрано");

  useEffect(() => {
    if (isOpen && calculation) {
      setItemsCount(parseInt(calculation.constructionsQTY) || 1);
      setComment(calculation.message || "");
      setFileName(calculation.file ? calculation.file.split("/").pop() : "Файл не обрано");
      setFile(null);
    }
  }, [isOpen, calculation]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "Файл не обрано");
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("Файл не обрано");
    const fileInput = document.getElementById('edit-calc-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSaveChanges = async () => {
    if (!itemsCount || !comment.trim()) {
      addNotification("Заповніть всі поля", "error");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("ConstructionsCount", itemsCount);
    formData.append("Comment", comment);

    try {
      setLoading(true);
      const response = await axiosInstance.put(
        `/calculations/${calculation.id}/edit/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Формуємо оновлений прорахунок
      const updatedCalc = {
        ...calculation,
        constructionsQTY: itemsCount,
        message: comment,
        file: file ? response.data.file : calculation.file
      };

      addNotification("Прорахунок успішно збережено", "success");
      onClose();
      if (onSave) onSave(updatedCalc); // Оновлюємо стан у батьківському компоненті
    } catch (err) {
      console.error("Помилка при редагуванні:", err);
      addNotification("Помилка при збереженні прорахунку", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveChanges();
  };

  if (!isOpen) return null;

  return (
    <div className="edit-calc-modal-overlay" onClick={onClose}>
      <div className="edit-calc-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="edit-calc-modal-border-top">
          <div className="edit-calc-modal-header">
            <span className="icon icon-calculator"></span>
            <h3>Редагувати прорахунок</h3>
            <span className="icon icon-cross edit-calc-close-btn" onClick={onClose}></span>
          </div>
        </div>

        <div className="edit-calc-modal-body">
          <form className="edit-calc-form" onSubmit={handleSubmit}>
            
            {/* Завантаження файлу */}
            {/* Завантаження файлу */}
            <div className="edit-calc-file-upload">
              <label htmlFor="edit-calc-file-input" className="edit-calc-upload-label">
                <FaUpload size={20} />
                <span>Завантажити новий файл прорахунку (.zkz)</span>
                <input 
                  type="file" 
                  id="edit-calc-file-input" 
                  accept=".zkz" 
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <div className="edit-calc-file-name">
                <span className={file ? "text-danger" : "text-grey"}>{calculation.number}.zkz</span>
                <div style={{ display: "flex", gap: "8px" }}>
                
                    <button
                      type="button"
                      className="edit-calc-download-file"
                      title="Скачати поточний файл"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const response = await axiosInstance.get(
                            `/calculations/${calculation.id}/download/`,
                            { responseType: "blob" }
                          );
                          const url = window.URL.createObjectURL(response.data);
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `${calculation.number}.zkz`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error("Помилка при скачуванні файлу:", err);
                        }
                      }}
                    >
                      <FaDownload size={14} />
                      <span>Скачати</span>
                    </button>
                 
                  {file && (
                    <button 
                      type="button"
                      className="edit-calc-clear-file"
                      onClick={handleClearFile}
                      title="Очистити файл"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Кількість конструкцій */}
            <label className="edit-calc-label-row">
              <span>Кількість конструкцій:</span>
              <input
                type="number"
                value={itemsCount}
                min="1"
                onChange={(e) => setItemsCount(e.target.value)}
                className="edit-calc-input-number"
              />
            </label>

            {/* Коментар */}
            <label className="edit-calc-label">
              <span>Коментар:</span>
              <textarea
                placeholder="Введіть коментар..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="edit-calc-textarea"
              />
            </label>
          </form>
        </div>

        <div className="edit-calc-modal-footer">
          <button className="edit-calc-btn-cancel" onClick={onClose}>
            <FaTimes size={16} color="#fff" /> Відмінити
          </button>

          <button
            className="edit-calc-btn-save"
            onClick={handleSaveChanges}
            disabled={loading}
          >
            <FaSave size={16} color="#fff" /> {loading ? "Зберігаємо..." : "Зберегти"}
          </button>
        </div>

        <div className="edit-calc-modal-border-bottom" />
      </div>
    </div>
  );
};

export default EditCalculationModal;
