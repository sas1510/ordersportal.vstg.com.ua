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
  const ext = fileItem.fileName.toLowerCase().split(".").pop();
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const isViewable = isPdf || isImage;

  // Визначаємо, чи це пристрій на базі iOS (iPhone / iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let previewWindow = null;

  // 1. ВІДКРИВАЄМО ВКЛАДКУ ДЛЯ ПЕРЕГЛЯДУ: Тільки для ноутбуків/ПК і тільки для PDF/Зображень.
  // На iPhone тепер все йде в скачування без відкриття нових вікон.
  if (isViewable && !isIOS) {
    previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Завантаження...</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; color:#666; background-color:#f4f4f5; margin:0;">
            <div style="text-align:center;">
              <div style="margin-bottom:12px; font-weight:600;">Завантаження файлу...</div>
              <div style="font-size:13px; color:#999;">Будь ласка, зачекайте.</div>
            </div>
          </body>
        </html>
      `);
    }
  }

  setDownloadingFileGuid(fileItem.fileGuid);

  try {
    const url = `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/?filename=${encodeURIComponent(fileItem.fileName)}`;
    const response = await axiosInstance.get(url, { responseType: "blob" });

    // 2. ФОРМУЄМО MIME-ТИП ЗАЛЕЖНО ВІД ДЕВАЙСУ
    let blobType = response.headers["content-type"];
    
    if (isIOS) {
      // 🔥 ГОЛОВНИЙ ФІКС ДЛЯ IPHONE:
      // Примусово затираємо тип на "application/octet-stream" для ВСІХ файлів (навіть фото та pdf).
      // Це змушує мобільний Safari віддати файл на завантаження в iOS, а не відкривати його.
      blobType = "application/octet-stream";
    } else {
      // Для ноутбуків залишаємо правильні типи для перегляду
      if (isImage) {
        blobType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      } else if (isPdf) {
        blobType = "application/pdf";
      } else if (!blobType || blobType === "application/octet-stream") {
        blobType = "application/octet-stream";
      }
    }

    const blob = new Blob([response.data], { type: blobType });
    const downloadUrl = window.URL.createObjectURL(blob);

    // 3. ОБРОБКА РЕЗУЛЬТАТУ
    if (isIOS) {
      // Пряме скачування на iPhone для всього (ZKZ, PDF, Фото)
      window.location.href = downloadUrl;
    } else if (isViewable && previewWindow) {
      // Перегляд на Ноутбуках/ПК для PDF та Фото
      previewWindow.location.href = downloadUrl;
    } else {
      // Скачування на Ноутбуках/ПК для всього іншого (.zkz)
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileItem.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 15000);

  } catch (error) {
    addNotification("Помилка під час обробки файлу", "error");
    if (previewWindow) previewWindow.close();
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