import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";

import {
  FaSpinner,
  FaEye,
  FaDownload,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";

import { FaRegFileImage, FaRegFilePdf, FaFileZipper } from "react-icons/fa6";

import "./OrderFilesModal.css";

const OrderFilesModal = ({ orderGuid, onClose }) => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

  const filesListUrl = `order/${orderGuid}/files/`;

  /* =========================
      ЕФЕКТИ (ESC та Scroll)
  ========================= */
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };

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
        const response = await axiosInstance.get(filesListUrl);

        if (response.data?.status === "success") {
          setFiles(response.data.files || []);
        } else {
          setError(t("errors.serverError", "Сервер повернув помилку."));
        }
      } catch (err) {
        console.error("❌ Error fetching files:", err);
        setError(t("errors.fetchFilesFailed", "Не вдалося отримати файли."));
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [orderGuid, filesListUrl, t]);

  /* =========================
      ЛОГІКА ЗАВАНТАЖЕННЯ ФАЙЛУ
  ========================= */
  const handleDownload = async (fileGuid, fileName) => {
    setDownloadingFileGuid(fileGuid);

    try {
      const params = new URLSearchParams({ filename: fileName });
      const url = `order/${orderGuid}/files/${fileGuid}/download/?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        responseType: "blob", 
      });

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = window.URL.createObjectURL(blob);

      const isPdf = fileName.toLowerCase().endsWith(".pdf");
      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName);

      const link = document.createElement("a");
      link.href = objectUrl;

      if (isPdf || isImage) {
        link.target = "_blank";
        if (isImage) link.download = fileName; 
      } else {
        link.download = fileName;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 5000);
    } catch (err) {
      console.error("Download error:", err);
      addNotification(t("notifications.downloadError", "Не вдалося відкрити або завантажити файл."), "error");
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  const getFileIcon = (fileName = "") => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return <FaRegFilePdf style={{ color: "#c0392b" }} />;
    if (ext === "zkz") return <FaFileAlt style={{ color: "#3498db" }} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return <FaRegFileImage style={{ color: "#4a90e2" }} />;
    if (["zip", "rar", "7z"].includes(ext))
      return <FaFileZipper style={{ color: "#d88a00" }} />;
    return <FaFileAlt style={{ color: "#666" }} />;
  };

  if (!orderGuid) return null;

  return createPortal(
    <div className="orders-file-modal-overlay" onClick={onClose}>
      <div className="orders-file-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="orders-file-modal-header">
          <div className="header-content">
            <FaFileAlt />
            <h3>{t("orders.modalFilesTitle", "Файли замовлення")}</h3>
          </div>
          <span className="icon icon-cross file-cross-close-btn" onClick={onClose}></span>
        </div>

        {/* BODY */}
        <div className="orders-file-body">
          {loading && <p>{t("common.loadingFiles", "Завантаження файлів…")}</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && files.length === 0 && (
            <p>{t("orders.noFilesFound", "Файлів для цього замовлення не знайдено.")}</p>
          )}

          {!loading && files.length > 0 && (
            <ul className="file-list">
              {files.map((file) => {
                const isDownloading = downloadingFileGuid === file.fileGuid;
                const isPdf = file.fileName.toLowerCase().endsWith(".pdf");

                return (
                  <li key={file.fileGuid} className="file-item">
                    <div className="file-info-group">
                      <div className="file-icon-wrapper">{getFileIcon(file.fileName)}</div>
                      <div className="file-details">
                        <b className="file-name-b">{file.fileName}</b>
                        <div className="file-meta">
                           {new Date(file.date).toLocaleString(i18n.language)}
                        </div>
                      </div>
                    </div>

                    <button
                      className="file-download-btn no-wrap"
                      disabled={isDownloading}
                      onClick={() => handleDownload(file.fileGuid, file.fileName)}
                    >
                      {isDownloading ? (
                        <div className="btn-content">
                          <FaSpinner className="fa-spin" />
                          <span>{t("common.downloading", "Завантаження...")}</span>
                        </div>
                      ) : isPdf ? (
                        <div className="btn-content">
                          <FaEye /> 
                          <span className="hide-on-mobile">{t("common.view", "Переглянути")}</span>
                        </div>
                      ) : (
                        <div className="btn-content">
                          <FaDownload /> 
                          <span className="hide-on-mobile">{t("common.download", "Завантажити")}</span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* FOOTER */}
        <div className="orders-file-modal-footer">
          <button type="button" className="order-file-close-btn" onClick={onClose}>
            <FaTimes /> {t("common.close", "Закрити")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderFilesModal;