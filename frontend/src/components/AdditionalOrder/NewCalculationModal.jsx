import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaUpload, FaTrash, FaUserAlt, FaCalendarAlt, FaFileAlt } from "react-icons/fa";
import { useNotification } from "../notification/Notifications.jsx";
import "./NewCalculationModal.css"; // Зберігаємо ім'я CSS файлу

// Варіанти причини рекламації
const RECLAMATION_REASONS = [
  "Виберіть причину",
  "Відшкодувати (компенсувати) вартість пошкоджених елементів замовлення, робіт, послуг за рахунок виробника",
  "Дозамовлення за рахунок замовника",
  "Доукомплектувати замовлення за рахунок виробника",
  "Доукомплектувати замовлення за рахунок замовника",
  "Замінити браковані матеріали за рахунок виробника",
  "Замінити пошкодженні матеріали за рахунок виробника",
  "Замінити пошкодженні матеріали за рахунок замовника",
  "Замінити склопакет за рахунок виробника",
  "Замінити склопакет за рахунок замовника",
  "Замінити фурнітуру за рахунок виробника",
  "Переробити конструкцію на виробництві за рахунок виробника",
  "Переробити конструкцію на виробництві за рахунок замовника",
  "Повернути конструкцію на виробництво (неліквід)",
];

// Варіанти вирішення рекламації (залишаємо порожній список, якщо ви не надали опцій)
const RESOLUTION_OPTIONS = [
    "Виберіть варіант вирішення",
    // Сюди додати конкретні опції вирішення, якщо вони є
];


const NewAdditionalOrderModal = ({ isOpen, onClose, onSave }) => { // Перейменовано
  const { addNotification } = useNotification();
  // Оновлені поля стану відповідно до рекламації:
  const [orderNumberInReclamation, setOrderNumberInReclamation] = useState(""); // Номер замовлення в рекламації
  const [deliveryDate, setDeliveryDate] = useState(""); // Дата доставки
  const [reclamationDate, setReclamationDate] = useState(""); // Дата визначення рекламації
  const [reclamationReason, setReclamationReason] = useState(RECLAMATION_REASONS[0]);
  const [reclamationResolution, setReclamationResolution] = useState(RESOLUTION_OPTIONS[0]); // Варіанти вирішення
  const [reclamationDescription, setReclamationDescription] = useState(""); // Опис рекламації

  const [reclamationFile, setReclamationFile] = useState(null); // Файл рекламації
  const [reclamationFileName, setReclamationFileName] = useState("Файл не обрано (.pdf, .doc, .zip)");
  
  // Поля, успадковані від попереднього компонента:
  const [loading, setLoading] = useState(false);
  const [dealerId, setDealerId] = useState("");
  const [dealers, setDealers] = useState([]);

  // Поле, яке тепер не потрібне, але залишаємо для прикладу:
  // const [itemsCount, setItemsCount] = useState(1); 
  // const [orderNumber, setOrderNumber] = useState(""); // Тут буде номер замовлення в рекламації

  const role = (localStorage.getItem("role") || "").trim().toLowerCase();
  const managerRoles = ["manager", "region_manager", "admin"];
  const isManager = managerRoles.includes(role);

  // Видаляємо fetchLastOrderNumber, оскільки для рекламації потрібен конкретний номер замовлення

  // ✅ Отримуємо дилерів (логіка залишається)
  useEffect(() => {
    if (isOpen && isManager) {
      axiosInstance
        .get("/get_dealers/")
        .then((res) => setDealers(res.data.dealers || []))
        .catch((err) => console.error("Помилка отримання дилерів:", err));
    }
  }, [isOpen, isManager]);

  // ✅ Логіка для фото/файлу рекламації
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setReclamationFile(selected);
    setReclamationFileName(selected ? selected.name : "Файл не обрано");
  };

  const handleClearFile = () => {
    setReclamationFile(null);
    setReclamationFileName("Файл не обрано");
    const input = document.getElementById("reclamation-file");
    if (input) input.value = "";
  };

  const resetForm = () => {
    setOrderNumberInReclamation("");
    setDeliveryDate("");
    setReclamationDate("");
    setReclamationReason(RECLAMATION_REASONS[0]);
    setReclamationResolution(RESOLUTION_OPTIONS[0]);
    setReclamationDescription("");
    setReclamationFile(null);
    setReclamationFileName("Файл не обрано");
    setDealerId("");
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Оновлені умови перевірки:
    if (!orderNumberInReclamation || !reclamationFile || !deliveryDate || !reclamationDate || reclamationReason === RECLAMATION_REASONS[0] || reclamationResolution === RESOLUTION_OPTIONS[0] || (isManager && !dealerId)) {
      addNotification("Будь ласка, заповніть усі обов'язкові поля та оберіть файл ❌", "error");
      return;
    }

    const formData = new FormData();
    // Нові поля для API
    formData.append("OrderNumberInReclamation", orderNumberInReclamation);
    formData.append("DeliveryDate", deliveryDate);
    formData.append("ReclamationDate", reclamationDate);
    formData.append("ReclamationReason", reclamationReason);
    formData.append("ReclamationResolution", reclamationResolution);
    formData.append("ReclamationDescription", reclamationDescription);
    formData.append("ReclamationFile", reclamationFile); // Фото рекламації / файл

    if (isManager) formData.append("CustomerId", dealerId);

    setLoading(true);
    try {
      // ПРИМІТКА: Ендпоінт /create/ скоріш за все не підходить для рекламацій.
      // Вам потрібно буде замінити його на, наприклад, /create_reclamation/
      const response = await axiosInstance.post("/create/", formData, { 
        headers: { "Content-Type": "multipart/form-data" },
      });

      addNotification(`Рекламацію по замовленню №${orderNumberInReclamation} успішно створено ✅`, "success");
      if (onSave) onSave(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Помилка при створенні рекламації:", error);
      addNotification("Помилка при збереженні рекламації ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="new-calc-modal-overlay" onClick={onClose}>
      <div className="new-calc-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="new-calc-modal-border-top">
          <div className="new-calc-modal-header">
            <FaFileAlt size={20} />
            <h3>Створити нове Дозамовлення / Рекламацію</h3>
            <span
              className="icon icon-cross new-calc-close-btn"
              onClick={handleCloseWithReset}
            ></span>
          </div>
        </div>

        <div className="new-calc-modal-body">
          <form className="new-calc-form" onSubmit={handleSubmit}>
            
            {/* Вибір дилера для менеджера */}
            {isManager && (
              <label className="new-calc-label-row flex items-center gap-2">
                <FaUserAlt className="text-gray-600" />
                <span>Дилер:</span>
                <select
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                  className="new-calc-input flex-1"
                >
                  <option value="">Оберіть дилера</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Номер замовлення яке в рекламації */}
            <label className="new-calc-label-row">
              <span>№ Замовлення:</span>
              <input
                type="text"
                value={orderNumberInReclamation}
                onChange={(e) => setOrderNumberInReclamation(e.target.value)}
                placeholder="Номер основного замовлення"
                className="new-calc-input"
                required
              />
            </label>

            {/* Дата доставки замовлення */}
            <label className="new-calc-label-row">
              <FaCalendarAlt className="text-gray-600" />
              <span>Дата доставки:</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="new-calc-input"
                required
              />
            </label>

            {/* Дата визначення рекламації */}
            <label className="new-calc-label-row">
              <FaCalendarAlt className="text-gray-600" />
              <span>Дата рекламації:</span>
              <input
                type="date"
                value={reclamationDate}
                onChange={(e) => setReclamationDate(e.target.value)}
                className="new-calc-input"
                required
              />
            </label>

            {/* Варіанти причини рекламації */}
            <label className="new-calc-label-row">
              <span>Причина рекламації:</span>
              <select
                value={reclamationReason}
                onChange={(e) => setReclamationReason(e.target.value)}
                className="new-calc-input flex-1"
                required
              >
                {RECLAMATION_REASONS.map((reason) => (
                  <option key={reason} value={reason} disabled={reason === RECLAMATION_REASONS[0]}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>

            {/* Варіанти вирішення рекламації */}
            <label className="new-calc-label-row">
              <span>Вирішення рекламації:</span>
              <select
                value={reclamationResolution}
                onChange={(e) => setReclamationResolution(e.target.value)}
                className="new-calc-input flex-1"
                required
              >
                {RESOLUTION_OPTIONS.map((resolution) => (
                  <option key={resolution} value={resolution} disabled={resolution === RESOLUTION_OPTIONS[0]}>
                    {resolution}
                  </option>
                ))}
              </select>
            </label>

            {/* Опишіть рекламацію */}
            <label className="new-calc-label">
              <span>Опишіть рекламацію:</span>
              <textarea
                placeholder="Детальний опис рекламації..."
                value={reclamationDescription}
                onChange={(e) => setReclamationDescription(e.target.value)}
                rows={4}
                className="new-calc-textarea"
                required
              />
            </label>

            {/* Фото рекламації / Завантажити рекламацію */}
            <div className="new-calc-file-upload">
              <label htmlFor="reclamation-file" className="new-calc-upload-label">
                <FaUpload size={20} />
                <span>Завантажити фото/файли рекламації</span>
                <input
                  type="file"
                  id="reclamation-file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  required
                />
              </label>

              <div className="new-calc-file-name">
                <span className={reclamationFile ? "text-danger" : "text-grey"}>{reclamationFileName}</span>
                {reclamationFile && (
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
            <FaSave size={16} color="#fff" /> {loading ? "Надсилаємо..." : "Створити Рекламацію"}
          </button>
        </div>

        <div className="new-calc-modal-border-bottom" />
      </div>
    </div>
  );
};

export default NewAdditionalOrderModal;