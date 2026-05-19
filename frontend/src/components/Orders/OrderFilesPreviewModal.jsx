import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios.js";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { 
  FaTimes, 
  FaDownload, 
  FaFileAlt, 
  FaImage, 
  FaFileArchive, 
  FaSpinner
} from "react-icons/fa";
import "./OrderFilesPreviewModal.css";

const OrderFilesPreviewModal = ({ isOpen, onClose, orderGuid, orderNumber }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

  // 1. Завантаження списку файлів прорахунку
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

  // 2. Стабільна функція скачування для всіх платформ (ПК та iPhone)
  const handleDownloadFile = async (fileItem) => {
    const fileName = fileItem.fileName;

    // Визначаємо Apple iOS пристрої (iPhone / iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 🔥 2а. ФІКС ДЛЯ IOS (iPhone/iPad): Пряме скачування через зміну локації вікна.
    // Оскільки ми оновили бекенд, він поверне Content-Disposition: attachment та тип octet-stream,
    // що змусить Safari завантажити чистий файл (.zkz, .pdf чи картинку) під рідною назвою.
    if (isIOS) {
      const fileUrl = `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/?filename=${encodeURIComponent(fileName)}`;
      const baseURL = axiosInstance.defaults.baseURL || "";
      const cleanBaseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
      const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      
      window.location.href = `${cleanBaseURL}${cleanFileUrl}`;
      return;
    }

    // 2б. ЛОГІКА ДЛЯ ПК/НОУТБУКІВ (Один в один як у вашому стабільному модулі прорахунків)
    setDownloadingFileGuid(fileItem.fileGuid);
    try {
      const response = await axiosInstance.get(
        `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/`,
        {
          params: { filename: fileName },
          responseType: "blob",
        }
      );

      // Захист від HTML-сторінок помилок сервера (щоб не плодити биті файли)
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("text/html")) {
        addNotification("Файл пошкоджено або не знайдено на сервері 1С", "error");
        return;
      }

      // Використовуємо ваш перевірений і надійний конструктор Blob
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("File download error:", error);
      addNotification("Помилка під час завантаження файлу", "error");
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  // Helper для визначення іконки
  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "zkz") return <FaFileArchive className="file-icon icon-zkz" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return <FaImage className="file-icon icon-image" />;
    return <FaFileAlt className="file-icon icon-doc" />;
  };

  // Закриття по нажаттю на клавішу Escape та блокування скролу
  useEffect(() => {
    const handleEsc = (e) => { e.key === "Escape" && onClose(); };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Групування файлів
  const zkzFiles = files.filter(f => f.type && f.type.toLowerCase().includes("просчет") || f.fileName.toLowerCase().endsWith(".zkz"));
  const imageFiles = files.filter(f => f.type && f.type.toLowerCase().includes("фото") || ["jpg", "jpeg", "png", "webp"].includes(f.fileName.toLowerCase().split(".").pop()));
  const otherFiles = files.filter(f => !zkzFiles.includes(f) && !imageFiles.includes(f));

  // Шаблон рендерингу картки файлу
  const renderFileCard = (file, cardClass, titleText) => {
    const isDownloading = downloadingFileGuid === file.fileGuid;

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
          title={titleText}
        >
          {isDownloading ? <FaSpinner className="spinner-animation" /> : <FaDownload />}
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
                  <h4>Файли</h4>
                  <div className="preview-grid">
                    {zkzFiles.map(file => renderFileCard(file, "card-zkz", "Завантажити файл"))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 2: Фотографії об'єкта */}
              {imageFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Фотографії</h4>
                  <div className="preview-grid">
                    {imageFiles.map(file => renderFileCard(file, "card-image", "Завантажити зображення"))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 3: Додаткові файли */}
              {otherFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Додаткові документи</h4>
                  <div className="preview-grid">
                    {otherFiles.map(file => renderFileCard(file, "card-other", "Завантажити документ"))}
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