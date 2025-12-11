import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./AddClaimModal.css";
import CustomSelect from "./CustomSelect";
import { FaClipboardList } from "react-icons/fa";



export default function AddClaimModal({ isOpen, onClose, onSave, initialOrderNumber = "" }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [reasonLink, setReasonLink] = useState("");
  const [solutionLink, setSolutionLink] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [reasonOptions, setReasonOptions] = useState([]);
  const [solutionOptions, setSolutionOptions] = useState([]);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const fileInputRef = useRef(null);

  // 🔹 При відкритті блокуємо скрол сторінки
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  // 🔹 Скидання номера при повторному відкритті
  useEffect(() => {
    if (isOpen) setOrderNumber(initialOrderNumber);
  }, [isOpen, initialOrderNumber]);

  // 🔹 Отримати список причин
  useEffect(() => {
    if (!isOpen) return;
    const fetchReasons = async () => {
      try {
        const res = await axiosInstance.get("/complaints/issues/");
        setReasonOptions(res.data.issues || []);
      } catch {
        setReasonOptions([]);
      }
    };
    fetchReasons();
  }, [isOpen]);

  // 🔹 Отримати рішення для вибраної причини
  useEffect(() => {
    if (!reasonLink) {
      setSolutionOptions([]);
      setSolutionLink("");
      return;
    }
    const fetchSolutions = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/solutions/${reasonLink}/`);
        setSolutionOptions(res.data.solutions || []);
      } catch {
        setSolutionOptions([]);
      }
    };
    fetchSolutions();
  }, [reasonLink]);

  // 🔹 Отримати серії за номером замовлення
  useEffect(() => {
    if (!orderNumber) {
      setSeriesOptions([]);
      setSelectedSeries([]);
      setOrderNotFound(false);
      return;
    }

    const fetchSeries = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/get_series/${orderNumber}/`);
        if (!res.data.series || res.data.series.length === 0) {
          setSeriesOptions([]);
          setSelectedSeries([]);
          setOrderNotFound(true);
        } else {
          setSeriesOptions(res.data.series);
          setSelectedSeries([]);
          setOrderNotFound(false);
        }
      } catch {
        setSeriesOptions([]);
        setOrderNotFound(true);
      }
    };
    fetchSeries();
  }, [orderNumber]);

  // 🔹 Хендлери
  const handleSeriesChange = (link) => {
    setSelectedSeries((prev) =>
      prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link]
    );
  };

  const handleAddPhoto = (e) => {
    const file = e.target.files[0];
    if (file) setPhotos((prev) => [...prev, file]);
    e.target.value = null;
  };

  const handleRemovePhoto = (i) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setOrderNumber("");
    setDeliveryDate("");
    setClaimDate("");
    setReasonLink("");
    setSolutionLink("");
    setDescription("");
    setPhotos([]);
    setSeriesOptions([]);
    setSelectedSeries([]);
    setOrderNotFound(false);
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  // 🔹 Сабміт
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderNotFound) return;

     const photosBase64 = await Promise.all(
    photos.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(",")[1]; // забираємо тільки дані після "data:image/png;base64,"
          resolve({
            photo_name: file.name,
            photo_base64: base64String
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })
  );

  // 🔹 Формуємо payload JSON
  const payload = {
    order_number: orderNumber,
    order_deliver_date: deliveryDate,
    order_define_date: claimDate,
    complaint_date: new Date().toISOString(),
    issue: reasonLink,
    solution: solutionLink,
    description,
    series: selectedSeries.map((link) => {
      const serie = seriesOptions.find((s) => s.SeriesLink === link);
      return { serie_link: link, serie_name: serie?.Name || "" };
    }),
    photos: photosBase64
  };

  setLoading(true);
  try {
    await axiosInstance.post("/complaints/create_complaints/", payload, {
      headers: { "Content-Type": "application/json" },
    });
    alert("✅ Рекламацію додано!");
    onSave?.();
    handleCloseWithReset();
  } catch (err) {
    alert("❌ Помилка: " + (err.response?.data || err.message));
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return createPortal(
    <div className="claim-modal-overlay" onClick={onClose}>
      <div className="claim-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="claim-modal-header">
        <div className="header-content">
            <span className="claim-icon"><FaClipboardList /></span>
            <h3>Додати рекламацію</h3>
        </div>
        <FaTimes className="claim-close-btn" onClick={handleCloseWithReset} />
        </div>


        <form className="claim-form" onSubmit={handleSubmit}>
          <div className="claim-row">
            <span className="label-text">Номер замовлення:</span>

            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              className="claim-input"
            />

            {orderNotFound && (
              <span className="error-text">Замовлення не знайдено</span>
            )}
          </div>


          {seriesOptions.length > 0 && (
            <div className="claim-label">
              <span>Виберіть серії:</span>
              <div className="series-list">
                {seriesOptions.map((s) => (
                  <label key={s.SeriesLink} className="series-item">
                    <input
                      type="checkbox"
                      checked={selectedSeries.includes(s.SeriesLink)}
                      onChange={() => handleSeriesChange(s.SeriesLink)}
                    />
                    {s.Name} ({s.FullName})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="claim-row">
            <label className="claim-label">
              <span>Дата доставки:</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="claim-input"
              />
            </label>
            <label className="claim-label">
              <span>Дата рекламації:</span>
              <input
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                required
                className="claim-input"
              />
            </label>
          </div>
          <label className="claim-label">
          <CustomSelect
            label="Причина рекламації:"
            options={reasonOptions}
            value={reasonLink}
            onChange={setReasonLink}
            />
            </label>

            <label className="claim-label">
            <CustomSelect
            label="Варіант вирішення:"
            options={solutionOptions}
            value={solutionLink}
            onChange={setSolutionLink}
            disabled={!solutionOptions.length}
            />
            </label>
          <label className="claim-label">
            <span>Опис:</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="claim-textarea"
            />
          </label>

         <div className="claim-label row align-center justify-between">
            <span className="photo-label-text">Фото рекламації:</span>

            <button
                type="button"
                className="add-photo-btn"
                onClick={() => fileInputRef.current.click()}
            >
                <FaPlus style={{ marginRight: 6 }} /> Додати фото
            </button>
            </div>

            <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length) setPhotos((prev) => [...prev, ...files]);
                e.target.value = null;
            }}
            />

            {/* Превʼю фото */}
            {photos.length > 0 && (
            <div className="photo-preview">
                {photos.map((f, i) => (
                <div key={i} className="photo-item">
                    <img
                    src={URL.createObjectURL(f)}
                    alt={`Фото ${i + 1}`}
                    className="photo-thumb"
                    />
                    <button
                    type="button"
                    className="claim-clear-file"
                    onClick={() =>
                        setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    >
                    ×
                    </button>
                </div>
                ))}
            </div>
            )}




          <div className="claim-modal-footer">
            <button
              type="button"
              className="claim-btn-cancel"
              onClick={handleCloseWithReset}
            >
              <FaTimes /> Відмінити
            </button>
            <button
              type="submit"
              className="claim-btn-save"
              disabled={loading || orderNotFound}
            >
              {loading ? "Завантаження..." : <><FaPlus /> Додати рекламацію</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
