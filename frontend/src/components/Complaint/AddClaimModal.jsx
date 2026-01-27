import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { FaTimes, FaPlus, FaClipboardList, FaUserAlt } from "react-icons/fa";
import "./AddClaimModal.css";
import CustomSelect from "./CustomSelect";
import DealerSelect from "../../pages/DealerSelect";
import { useNotification } from "../notification/Notifications";

export default function AddClaimModal({
  isOpen,
  onClose,
  onSave,
  initialOrderNumber = "",
  initialOrderGUID = "",
}) {
  /* =========================
      🔔 Notifications
     ========================= */
  const { addNotification } = useNotification();

  /* =========================
      👤 Role
     ========================= */
  const role = (localStorage.getItem("role") || "").trim().toLowerCase();
  const isManager = ["manager", "region_manager", "admin"].includes(role);

  /* =========================
      🧠 State
     ========================= */
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

  const fileInputRef = useRef(null);

  /* =========================
      🔒 Lock scroll
     ========================= */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  /* =========================
      🔄 Reset order number
     ========================= */
  useEffect(() => {
    if (isOpen) setOrderNumber(initialOrderNumber);
  }, [isOpen, initialOrderNumber]);

  /* =========================
      📋 Load reasons
     ========================= */
  useEffect(() => {
    if (!isOpen) return;

    const fetchReasons = async () => {
      try {
        const res = await axiosInstance.get("/complaints/issues/");
        setReasonOptions(res.data?.issues || []);
      } catch {
        setReasonOptions([]);
      }
    };

    fetchReasons();
  }, [isOpen]);

  /* =========================
      📋 Load solutions
     ========================= */
  useEffect(() => {
    if (!reasonLink) {
      setSolutionOptions([]);
      setSolutionLink("");
      return;
    }

    const fetchSolutions = async () => {
      try {
        const res = await axiosInstance.get(
          `/complaints/solutions/${reasonLink}/`
        );
        setSolutionOptions(res.data?.solutions || []);
      } catch {
        setSolutionOptions([]);
      }
    };

    fetchSolutions();
  }, [reasonLink]);

  /* =========================
      📦 Load series
     ========================= */
  useEffect(() => {
    if (!orderNumber) {
      setSeriesOptions([]);
      setSelectedSeries([]);
      setOrderNotFound(false);
      return;
    }

    const fetchSeries = async () => {
      try {
        const res = await axiosInstance.get(
          `/complaints/get_series/${orderNumber}/`
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
        setOrderNotFound(true);
      }
    };

    fetchSeries();
  }, [orderNumber]);

  /* =========================
      🖼️ Photos
     ========================= */
  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setPhotos((p) => [...p, ...files]);
    e.target.value = null;
  };

  const removePhoto = (index) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
  };

  /* =========================
      🔄 Reset
     ========================= */
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
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  /* =========================
      🚀 Submit
     ========================= */
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
            })
        )
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

      await axiosInstance.post(
        "/complaints/create_complaints/",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      addNotification("Рекламацію успішно додано", "success");
      onSave?.();
      handleCloseWithReset();
    } catch (err) {
      console.error(err);
      addNotification(
        err.response?.data?.error || "Помилка при створенні рекламації",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* =========================
      🧩 Render
     ========================= */
  return createPortal(
    <div className="claim-modal-overlay" onClick={handleCloseWithReset}>
      <div
        className="claim-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="claim-modal-header">
          <div className="header-content">
            <span className="claim-icon">
              <FaClipboardList />
            </span>
            <h3>Додати рекламацію</h3>
          </div>
          <FaTimes
            className="claim-close-btn"
            onClick={handleCloseWithReset}
          />
        </div>

        <form className="claim-form" onSubmit={handleSubmit}>
          <div className="claim-row">
            <span className="label-text">Номер замовлення:</span>
            <input
              className="claim-input"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
            {orderNotFound && (
              <span className="error-text">Замовлення не знайдено</span>
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
                            : [...p, s.SeriesLink]
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

          <CustomSelect
            label="Причина рекламації:"
            options={reasonOptions}
            value={reasonLink}
            onChange={setReasonLink}
          />

          <CustomSelect
            label="Варіант вирішення:"
            options={solutionOptions}
            value={solutionLink}
            onChange={setSolutionLink}
            disabled={!solutionOptions.length}
          />

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
              {loading ? "Завантаження..." : (
                <>
                  <FaPlus /> Додати рекламацію
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
