import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { FaTimes, FaPlus, FaClipboardList, FaUserAlt } from "react-icons/fa";
import "./AddClaimModal.css";
import CustomSelect from "./CustomSelect";
import DealerSelect from "../../pages/DealerSelect";
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

export default function AddClaimModal({
  isOpen,
  onClose,
  onSave,
  initialOrderNumber = "",
  initialOrderGUID = "",
}) {
  const { addNotification } = useNotification();

  const {  role } = useAuthGetRole();
  const _isAdmin = role === "admin";
  const isManager = ["manager", "region_manager", "admin"].includes(role);

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

  const [dealerId, setDealerId] = useState("");


  const [fetchErrors, setFetchErrors] = useState({
    reasons: null,
    solutions: null,
    series: null,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);


  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);


  useEffect(() => {
    if (isOpen) setOrderNumber(initialOrderNumber);
  }, [isOpen, initialOrderNumber]);


  const fetchReasons = async () => {
    if (!isOpen) return;
    setFetchErrors((p) => ({ ...p, reasons: null }));
    try {
      const res = await axiosInstance.get("/complaints/issues/");
      setReasonOptions(res.data?.issues || []);
    } catch {
      setReasonOptions([]);
      setFetchErrors((p) => ({
        ...p,
        reasons: "Помилка завантаження причин рекламації",
      }));
    }
  };

  useEffect(() => {
    fetchReasons();
  }, [isOpen]);

  const fetchSolutions = useCallback(async () => {
    if (!reasonLink) {
      setSolutionOptions([]);
      setSolutionLink("");
      return;
    }
    setFetchErrors((p) => ({ ...p, solutions: null }));
    try {
      const res = await axiosInstance.get(`/complaints/solutions/${reasonLink}/`);
      setSolutionOptions(res.data?.solutions || []);
    } catch {
      setSolutionOptions([]);
      setFetchErrors((p) => ({
        ...p,
        solutions: "Помилка завантаження варіантів вирішення",
      }));
    }
  }, [reasonLink]); 

  
  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);


  const fetchSeries = useCallback(async () => {
    if (!orderNumber) {
      setSeriesOptions([]);
      setSelectedSeries([]);
      setOrderNotFound(false);
      setFetchErrors((p) => ({ ...p, series: null }));
      return;
    }

    setFetchErrors((p) => ({ ...p, series: null }));
    try {
      const res = await axiosInstance.get(
        `/complaints/get_series/${orderNumber}/`,
      );

      if (!res.data?.series?.length) {
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
      setOrderNotFound(false);
      setFetchErrors((p) => ({
        ...p,
        series: "Не вдалося отримати дані про серії конструкцій",
      }));
    }
  }, [orderNumber]); 

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);


  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setPhotos((p) => [...p, ...files]);
    e.target.value = null;
  };

  const removePhoto = (index) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
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
    setDealerId("");
    setFetchErrors({ reasons: null, solutions: null, series: null });
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderNotFound) return;

    if (isManager && !dealerId) {
      addNotification("Оберіть дилера", "error");
      return;
    }

    setLoading(true);

    try {
      const photosBase64 = await Promise.all(
        photos.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  photo_name: file.name,
                  photo_base64: reader.result.split(",")[1],
                });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );

      const payload = {
        ...(isManager && dealerId && { contractor_guid: dealerId }),

        order_number: orderNumber.trim(),
        order_GUID: initialOrderGUID,

        order_deliver_date: deliveryDate,
        order_define_date: claimDate,
        complaint_date: new Date().toISOString(),

        issue: reasonLink,
        solution: solutionLink,
        description,

        series: selectedSeries.map((link) => {
          const serie = seriesOptions.find((s) => s.SeriesLink === link);
          return {
            serie_link: link,
            serie_name: serie?.Name || "",
          };
        }),

        photos: photosBase64,
      };

      await axiosInstance.post("/complaints/create_complaints/", payload, {
        headers: { "Content-Type": "application/json" },
      });

      addNotification("Рекламацію успішно додано", "success");
      onSave?.();
      handleCloseWithReset();
    } catch (err) {
      console.error(err);
      addNotification(
        err.response?.data?.error || "Помилка при створенні рекламації",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;


  return createPortal(
    <div className="claim-modal-overlay" onClick={handleCloseWithReset}>
      <div className="claim-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="claim-modal-header">
          <div className="header-content">
            <span className="claim-icon">
              <FaClipboardList />
            </span>
            <h3>Додати рекламацію</h3>
          </div>
          <FaTimes className="claim-close-btn" onClick={handleCloseWithReset} />
        </div>

        <form className="claim-form" onSubmit={handleSubmit}>
          <div className="claim-row column">
            <div className="row ai-center gap-10 w-100">
              <span className="label-text">Номер замовлення:</span>
              <input
                className="claim-input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            {orderNotFound && (
              <span className="error-text">Замовлення не знайдено</span>
            )}
            {fetchErrors.series && (
              <div className="error-inline-retry">
                <span>{fetchErrors.series}</span>
                <button type="button" onClick={fetchSeries}>
                  Повторити
                </button>
              </div>
            )}
          </div>

          {isManager && (
            <div className="claim-row">
              <span className="label-text flex items-center gap-2">
                <FaUserAlt /> Дилер:
              </span>
              <DealerSelect value={dealerId} onChange={setDealerId} />
            </div>
          )}

          {seriesOptions.length > 0 && (
            <div className="claim-label">
              <span>Виберіть серії:</span>
              <div className="series-list">
                {seriesOptions.map((s) => (
                  <label key={s.SeriesLink} className="series-item">
                    <input
                      type="checkbox"
                      checked={selectedSeries.includes(s.SeriesLink)}
                      onChange={() =>
                        setSelectedSeries((p) =>
                          p.includes(s.SeriesLink)
                            ? p.filter((x) => x !== s.SeriesLink)
                            : [...p, s.SeriesLink],
                        )
                      }
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
                className="claim-input"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </label>

            <label className="claim-label">
              <span>Дата рекламації:</span>
              <input
                type="date"
                className="claim-input"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="claim-select-container">
            <CustomSelect
              label="Причина рекламації:"
              options={reasonOptions}
              value={reasonLink}
              onChange={setReasonLink}
            />
            {fetchErrors.reasons && (
              <div className="error-inline-retry">
                <span>{fetchErrors.reasons}</span>
                <button type="button" onClick={fetchReasons}>
                  Повторити
                </button>
              </div>
            )}
          </div>

          <div className="claim-select-container">
            <CustomSelect
              label="Варіант вирішення:"
              options={solutionOptions}
              value={solutionLink}
              onChange={setSolutionLink}
              disabled={!solutionOptions.length}
            />
            {fetchErrors.solutions && (
              <div className="error-inline-retry">
                <span>{fetchErrors.solutions}</span>
                <button type="button" onClick={fetchSolutions}>
                  Повторити
                </button>
              </div>
            )}
          </div>

          <label className="claim-label">
            <span>Опис:</span>
            <textarea
              rows={4}
              className="claim-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <div className="claim-label row justify-between align-center">
            <span>Фото рекламації:</span>
            <button
              type="button"
              className="add-photo-btn"
              onClick={() => fileInputRef.current.click()}
            >
              <FaPlus /> Додати фото
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleAddPhotos}
          />

          {photos.length > 0 && (
            <div className="photo-preview">
              {photos.map((f, i) => (
                <div key={i} className="photo-item">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="photo-thumb"
                  />
                  <button
                    type="button"
                    className="claim-clear-file"
                    onClick={() => removePhoto(i)}
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
              {loading ? (
                "Завантаження..."
              ) : (
                <>
                  <FaPlus /> Додати рекламацію
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
