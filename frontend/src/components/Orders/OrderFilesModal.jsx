import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";

import {
  FaSpinner,
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaImage,
  FaFileArchive,
  FaEye,
} from "react-icons/fa";

import "./OrderFilesPreviewModal.css";

// Додали новий проп entityType ("order" або "calculation")
const OrderFilesModal = ({
  orderGuid,
  orderNumber,
  entityType = "order",
  hideZkzFiles = false,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

  const getFileExtension = (fileName = "") => fileName.toLowerCase().split(".").pop();

  const isPreviewableFile = (fileName = "") => {
    const ext = getFileExtension(fileName);
    return [
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "bmp",
      "svg",
      "txt",
      "csv",
      "json",
      "xml",
      "mp4",
      "webm",
    ].includes(ext);
  };

  /* =========================
      ЕФЕКТИ (ESC та Scroll)
  ========================= */
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* =========================
      ЗАВАНТАЖЕННЯ СПИСКУ ФАЙЛІВ
  ========================= */
  useEffect(() => {
    if (!orderGuid) return;
    const loadFiles = async () => {
      try {
        // Динамічний URL для отримання списку файлів залежно від типу
        const fetchUrl = entityType === "calculation"
          ? `orders/${orderGuid}/files/` // Для прорахунків (як у вашому urls.py)
          : `order/${orderGuid}/files/`; // Для звичайних замовлень

        const response = await axiosInstance.get(fetchUrl);
        if (response.data?.status === "success") {
          setFiles(response.data.files || []);
        } else if (Array.isArray(response.data)) {
          // Якщо бекенд повертає просто масив замість об'єкта зі статусом
          setFiles(response.data);
        }
      } catch (err) {
        addNotification(t("errors.fetchFilesFailed"), "error");
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [orderGuid, entityType, t, addNotification]);

  /* =========================
      ГРУПУВАННЯ ФАЙЛІВ
  ========================= */
  const groups = useMemo(() => {
    const visibleFiles = hideZkzFiles
      ? files.filter(
          (f) =>
            !(f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz")),
        )
      : files;

    return {
      zkz: visibleFiles.filter(f => f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz")),
      images: visibleFiles.filter(f => f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName)),
      others: visibleFiles.filter(f => {
        const isZkz = f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz");
        const isImg = f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName);
        return !isZkz && !isImg;
      })
    };
  }, [files, hideZkzFiles]);

  /* =========================
      ЛОГІКА ВІДКРИТТЯ/ЗАВАНТАЖЕННЯ ФАЙЛІВ
  ========================= */
  const handleFileAction = async (fileItem) => {
    setDownloadingFileGuid(fileItem.fileGuid);
    try {
      const url = entityType === "calculation"
        ? "/orders/" + orderGuid + "/files/" + fileItem.fileGuid + "/download_calc/?filename=" + encodeURIComponent(fileItem.fileName)
        : "/order/" + orderGuid + "/files/" + fileItem.fileGuid + "/download/?filename=" + encodeURIComponent(fileItem.fileName);

      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const objectUrl = window.URL.createObjectURL(blob);

      if (isPreviewableFile(fileItem.fileName)) {
        const previewWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

        if (!previewWindow) {
          const previewLink = document.createElement("a");
          previewLink.href = objectUrl;
          previewLink.target = "_blank";
          previewLink.rel = "noopener noreferrer";
          document.body.appendChild(previewLink);
          previewLink.click();
          previewLink.remove();
        }

        window.setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 60000);
        return;
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.setAttribute("download", fileItem.fileName);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("File action error:", error);
      addNotification(t("orders.downloadFileError"), "error");
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = getFileExtension(fileName);
    if (ext === "zkz") return <FaFileArchive className="file-icon icon-zkz" />;
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return <FaImage className="file-icon icon-image" />;
    return <FaFileAlt className="file-icon icon-doc" />;
  };

  if (!orderGuid) return null;

  const renderFileCard = (file) => {
    const isDownloading = downloadingFileGuid === file.fileGuid;

    return (
      <div key={file.fileGuid} className={`file-card ${file.fileName.toLowerCase().endsWith('.zkz') ? 'card-zkz' : /\.(jpg|jpeg|png|webp)$/i.test(file.fileName) ? 'card-image' : 'card-other'}`}>
        <div className="file-card-info">
          {getFileIcon(file.fileName)}
          <div className="file-details">
            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
            <span className="file-date-text">
              {file.date ? new Date(file.date).toLocaleString(i18n.language) : t("files.unknownDate")}
            </span>
          </div>
        </div>
        <button 
          className="file-action-btn" 
          disabled={isDownloading}
          onClick={() => handleFileAction(file)}
          title={isPreviewableFile(file.fileName) ? "Відкрити" : t("common.download")}
        >
          {isDownloading ? (
            <FaSpinner className="spinner-animation" />
          ) : isPreviewableFile(file.fileName) ? (
            <FaEye />
          ) : (
            <FaDownload />
          )}
        </button>
      </div>
    );
  };

  return createPortal(
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="preview-modal-header">
          <div className="preview-header-title">
            <h3>
              {entityType === "calculation" ? t("orders.modalCalcFilesTitle") : t("orders.modalFilesTitle")} 
              {orderNumber ? ` № ${orderNumber}` : ""}
            </h3>
            <span className="preview-subtitle">{t("orders.modalFilesSubtitle")}</span>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="preview-modal-body">
          {loading ? (
            <div className="preview-loading-box">
              <FaSpinner className="spinner-animation" size={30} />
              <p>{t("common.loadingFiles")}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="preview-empty-box">
              <FaFileAlt size={40} style={{ color: "#bbb", marginBottom: "10px" }} />
              <p>{t("orders.noFilesFound")}</p>
            </div>
          ) : (
            <div className="preview-files-container">
              {groups.zkz.length > 0 && (
                <div className="preview-section">
                  <h4>{t("orders.sectionProjects")}</h4>
                  <div className="preview-grid">{groups.zkz.map(renderFileCard)}</div>
                </div>
              )}

              {groups.images.length > 0 && (
                <div className="preview-section">
                  <h4>{t("orders.sectionPhotos")}</h4>
                  <div className="preview-grid">{groups.images.map(renderFileCard)}</div>
                </div>
              )}

              {groups.others.length > 0 && (
                <div className="preview-section">
                  <h4>{t("orders.sectionOthers")}</h4>
                  <div className="preview-grid">{groups.others.map(renderFileCard)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="preview-modal-footer">
          <span className="preview-footer-count">{t("orders.totalFiles")}: {files.length}</span>
          <button className="preview-btn-close-footer" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default OrderFilesModal;
