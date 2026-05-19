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
} from "react-icons/fa";

import "./OrderFilesPreviewModal.css"; 

const OrderFilesModal = ({ orderGuid, orderNumber, onClose }) => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

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
      ЗАВАНТАЖЕННЯ СПИСКУ
  ========================= */
  useEffect(() => {
    if (!orderGuid) return;
    const loadFiles = async () => {
      try {
        const response = await axiosInstance.get(`order/${orderGuid}/files/`);
        if (response.data?.status === "success") {
          setFiles(response.data.files || []);
        }
      } catch (err) {
        addNotification(t("errors.fetchFilesFailed"), "error");
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [orderGuid, t, addNotification]);

  /* =========================
      ГРУПУВАННЯ ФАЙЛІВ
  ========================= */
  const groups = useMemo(() => {
    return {
      zkz: files.filter(f => f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz")),
      images: files.filter(f => f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName)),
      others: files.filter(f => {
        const isZkz = f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz");
        const isImg = f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName);
        return !isZkz && !isImg;
      })
    };
  }, [files]);

  /* =========================
      ЛОГІКА ПРЯМОГО ЗАВАНТАЖЕННЯ
  ========================= */
  const handleDownload = async (fileItem) => {
  try {
    const url = `/orders/${orderGuid}/files/${fileItem.fileGuid}/download_calc/?filename=${encodeURIComponent(
      fileItem.fileName
    )}`;

    const response = await axiosInstance.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fileItem.fileName);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    addNotification("Помилка під час завантаження файлу", "error");
  }
};

  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split(".").pop();
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
              {file.date ? new Date(file.date).toLocaleString(i18n.language) : t("common.noDate")}
            </span>
          </div>
        </div>
        <button 
          className="file-action-btn" 
          disabled={isDownloading}
          onClick={() => handleDownload(file)}
          title={t("common.download")}
        >
          {isDownloading ? <FaSpinner className="spinner-animation" /> : <FaDownload />}
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
            <h3>{t("orders.modalFilesTitle")} {orderNumber ? `№ ${orderNumber}` : ""}</h3>
            <span className="preview-subtitle">{t("orders.modalFilesSubtitle", "Документація та фото")}</span>
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
                  <h4> {t("orders.sectionProjects", "Файли")}</h4>
                  <div className="preview-grid">{groups.zkz.map(renderFileCard)}</div>
                </div>
              )}

              {groups.images.length > 0 && (
                <div className="preview-section">
                  <h4>{t("orders.sectionPhotos", "Фотографії об'єкта")}</h4>
                  <div className="preview-grid">{groups.images.map(renderFileCard)}</div>
                </div>
              )}

              {groups.others.length > 0 && (
                <div className="preview-section">
                  <h4> {t("orders.sectionOthers", "Інше")}</h4>
                  <div className="preview-grid">{groups.others.map(renderFileCard)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="preview-modal-footer">
          <span className="preview-footer-count">{t("orders.totalFiles", "Всього")}: {files.length}</span>
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