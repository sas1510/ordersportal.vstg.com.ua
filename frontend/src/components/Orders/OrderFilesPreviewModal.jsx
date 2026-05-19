import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";

import {
  FaSpinner,
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaEye,
  FaImage,
  FaFileArchive,
} from "react-icons/fa";

import "./OrderFilesPreviewModal.css"; 

const OrderFilesPreviewModal = ({ isOpen, onClose, orderGuid, orderNumber }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

  // 1. Завантаження списку файлів
  useEffect(() => {
    const fetchOrderFiles = async () => {
      if (!isOpen || !orderGuid) return;
      
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/orders/${orderGuid}/files/`);
        if (response.data?.status === "success") {
          setFiles(response.data.files || []);
        } else {
          throw new Error("Backend returned failed status");
        }
      } catch (error) {
        console.error("Error fetching order files:", error);
        addNotification("Не вдалося завантажити список файлів прорахунку", "error");
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderFiles();
  }, [isOpen, orderGuid]);

  // 2. Оновлена функція перегляду зображень/PDF або завантаження інших файлів
  const handleDownloadFile = async (fileItem) => {
    setDownloadingFileGuid(fileItem.fileGuid);
    try {
      const url = `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/?filename=${encodeURIComponent(fileItem.fileName)}`;
      const response = await axiosInstance.get(url, { responseType: "blob" });

      const ext = fileItem.fileName.toLowerCase().split(".").pop();
      const isPdf = ext === "pdf";
      const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);

      // Формуємо чистий MIME-тип, ігноруючи заголовок "application/octet-stream" від Django
      let blobType = response.headers["content-type"];
      if (isImage) {
        blobType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      } else if (isPdf) {
        blobType = "application/pdf";
      }

      const blob = new Blob([response.data], { type: blobType });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      if (isPdf || isImage) {
        // Стабільний метод відкриття вкладки без блокування попап-системами браузерів
        const previewWindow = window.open();
        if (previewWindow) {
          previewWindow.location.href = downloadUrl;
        } else {
          window.open(downloadUrl, "_blank");
        }
      } else {
        // Пряме завантаження для конструкторських форматів (.zkz та ін.)
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", fileItem.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Збільшено час таймауту, щоб великі зображення встигли вичитати бінарний потік
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 15000);
    } catch (error) {
      console.error("File download error:", error);
      addNotification("Помилка під час обробки файлу", "error");
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  // Helper для визначення іконки файлу
  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "zkz") return <FaFileArchive className="file-icon icon-zkz" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return <FaImage className="file-icon icon-image" />;
    return <FaFileAlt className="file-icon icon-doc" />;
  };

  // Закриття по натисканню на клавішу Escape
  useEffect(() => {
    const handleEsc = (e) => { e.key === "Escape" && onClose(); };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden"; // Блокуємо скрол основної сторінки
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Групування файлів
  const zkzFiles = files.filter(f => f.type && f.type.toLowerCase().includes("просчет") || f.fileName.toLowerCase().endsWith(".zkz"));
  const imageFiles = files.filter(f => f.type && f.type.toLowerCase().includes("фото") || ["jpg", "jpeg", "png", "webp", "gif"].includes(f.fileName.toLowerCase().split(".").pop()));
  const otherFiles = files.filter(f => !zkzFiles.includes(f) && !imageFiles.includes(f));

  // Рендеринг окремої картки для уникнення дублювання коду
  const renderFileRow = (file, cardClass) => {
    const isDownloading = downloadingFileGuid === file.fileGuid;
    const ext = file.fileName.toLowerCase().split(".").pop();
    const isViewable = ["jpg", "jpeg", "png", "webp", "gif", "pdf"].includes(ext);

    return (
      <div key={file.fileGuid} className={`file-card ${cardClass}`}>
        <div className="file-card-info">
          {getFileIcon(file.fileName)}
          <div className="file-details">
            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
            <span className="file-date-text">
              {file.date ? new Date(file.date).toLocaleString() : "Дата не вказана"}
            </span>
          </div>
        </div>
        <button 
          className="file-action-btn" 
          disabled={isDownloading}
          onClick={() => handleDownloadFile(file)} 
          title={isViewable ? "Переглянути у браузері" : "Завантажити файл"}
        >
          {isDownloading ? (
            <FaSpinner className="spinner-animation" />
          ) : isViewable ? (
            <FaEye />
          ) : (
            <FaDownload />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* Хедер модалки */}
        <div className="preview-modal-header">
          <div className="preview-header-title">
            <h3>Файли прорахунку {orderNumber ? `№ ${orderNumber}` : ""}</h3>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>

        {/* Тіло модалки */}
        <div className="preview-modal-body">
          {loading ? (
            <div className="preview-loading-box">
              <FaSpinner className="spinner-animation" size={30} />
              <p>Завантаження...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="preview-empty-box">
              <FaFileAlt size={40} style={{ color: "#bbb", marginBottom: "10px" }} />
              <p>Для цієї заявки файлів або фотографій не знайдено.</p>
            </div>
          ) : (
            <div className="preview-files-container">
              
              {/* СЕКЦІЯ 1: Заявки на прорахунок (.ZKZ) */}
              {zkzFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Файли прорахунку</h4>
                  <div className="preview-grid">
                    {zkzFiles.map(file => renderFileRow(file, "card-zkz"))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 2: Фотографії об'єкта */}
              {imageFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Фотографії</h4>
                  <div className="preview-grid">
                    {imageFiles.map(file => renderFileRow(file, "card-image"))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 3: Додаткові файли */}
              {otherFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Додаткові документи</h4>
                  <div className="preview-grid">
                    {otherFiles.map(file => renderFileRow(file, "card-other"))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Футер модалки */}
        <div className="preview-modal-footer">
          <span className="preview-footer-count">Всього прикріплено файлів: {files.length}</span>
          <button className="preview-btn-close-footer" onClick={onClose}>
            Закрити
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderFilesPreviewModal;