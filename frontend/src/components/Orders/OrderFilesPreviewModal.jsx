import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios.js";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { 
  FaTimes, 
  FaFileDownload, 
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

  // 1. Завантаження списку файлів прорахунку за новим ендпоінтом get_calc_files
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

  // 2. Функція скачування файлу через оновлений ендпоінт download_calc
  const handleDownloadFile = async (fileItem) => {
    try {
      // ПРАВИЛЬНИЙ УРЛ: підставляємо download_calc відповідно до вашого urls.py
      const url = `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/?filename=${encodeURIComponent(fileItem.fileName)}`;
      
      // Запит як blob для коректного отримання binary stream (з урахуванням SMB/DB Fallback)
      const response = await axiosInstance.get(url, { responseType: "blob" });
      
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      link.setAttribute("download", fileItem.fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("File download error:", error);
      addNotification("Помилка під час завантаження файлу", "error");
    }
  };

  // Helper для визначення іконки
  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "zkz") return <FaFileArchive className="file-icon icon-zkz" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return <FaImage className="file-icon icon-image" />;
    return <FaFileAlt className="file-icon icon-doc" />;
  };

  // Закриття по нажаттю на клавішу Escape
  useEffect(() => {
    const handleEsc = (e) => { e.key === "Escape" && onClose(); };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 🔥 НАДІЙНЕ ГРУПУВАННЯ: Фільтруємо за типом (File_DataType_Name), який повертає SQL процедура 1С
  const zkzFiles = files.filter(f => f.type && f.type.toLowerCase().includes("просчет") || f.fileName.toLowerCase().endsWith(".zkz"));
  const imageFiles = files.filter(f => f.type && f.type.toLowerCase().includes("фото") || ["jpg", "jpeg", "png", "webp"].includes(f.fileName.toLowerCase().split(".").pop()));
  const otherFiles = files.filter(f => !zkzFiles.includes(f) && !imageFiles.includes(f));

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* Хедер модалки */}
        <div className="preview-modal-header">
          <div className="preview-header-title">
            <h3>Файли прорахунку {orderNumber ? `№ ${orderNumber}` : ""}</h3>
            {/* <span className="preview-subtitle">Сховище заявок, фотографій та файлів конфігуратора з 1С</span> */}
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
                    {zkzFiles.map(file => (
                      <div key={file.fileGuid} className="file-card card-zkz">
                        <div className="file-card-info">
                          {getFileIcon(file.fileName)}
                          <div className="file-details">
                            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
                            <span className="file-date-text">
                              {file.date ? new Date(file.date).toLocaleString() : "Дата не вказана"}
                            </span>
                          </div>
                        </div>
                        <button className="file-action-btn" onClick={() => handleDownloadFile(file)} title="Завантажити файл">
                          <FaFileDownload />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 2: Фотографії об'єкта */}
              {imageFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Фотографії</h4>
                  <div className="preview-grid">
                    {imageFiles.map(file => (
                      <div key={file.fileGuid} className="file-card card-image">
                        <div className="file-card-info">
                          {getFileIcon(file.fileName)}
                          <div className="file-details">
                            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
                            <span className="file-date-text">
                              {file.date ? new Date(file.date).toLocaleString() : "Дата не вказана"}
                            </span>
                          </div>
                        </div>
                        <button className="file-action-btn" onClick={() => handleDownloadFile(file)} title="Скачати зображення">
                          <FaFileDownload />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* СЕКЦІЯ 3: Додаткові файли */}
              {otherFiles.length > 0 && (
                <div className="preview-section">
                  <h4>Додаткові документи</h4>
                  <div className="preview-grid">
                    {otherFiles.map(file => (
                      <div key={file.fileGuid} className="file-card card-other">
                        <div className="file-card-info">
                          {getFileIcon(file.fileName)}
                          <div className="file-details">
                            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
                            <span className="file-date-text">
                              {file.date ? new Date(file.date).toLocaleString() : "Дата не вказана"}
                            </span>
                          </div>
                        </div>
                        <button className="file-action-btn" onClick={() => handleDownloadFile(file)} title="Завантажити документ">
                          <FaFileDownload />
                        </button>
                      </div>
                    ))}
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