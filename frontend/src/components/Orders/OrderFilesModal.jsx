import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";

import {
  FaSpinner,
  FaEye,
  FaDownload,
  FaTimes,
  FaFileAlt
} from "react-icons/fa";

import {
  FaRegFileImage,
  FaRegFilePdf,
  FaFileZipper
} from "react-icons/fa6";

import "./OrderFilesModal.css";

const OrderFilesModal = ({ orderGuid, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);

  const filesListUrl = `order/${orderGuid}/files/`;

  /* =========================
     LOAD FILES
  ========================= */
  useEffect(() => {
    if (!orderGuid) return;

    document.body.style.overflow = "hidden";

    const loadFiles = async () => {
      try {
        const response = await axiosInstance.get(filesListUrl);

        if (response.data?.status === "success") {
          setFiles(response.data.files || []);
        } else {
          setError("Сервер повернув помилку.");
        }
      } catch (err) {
        console.error("❌ Error fetching files:", err);
        setError("Не вдалося отримати файли.");
      } finally {
        setLoading(false);
      }
    };

    loadFiles();

    return () => {
      document.body.style.overflow = "";
    };
  }, [orderGuid]);

  /* =========================
     FILE ICON
  ========================= */
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

  /* =========================
     DOWNLOAD FILE (NEW LOGIC)
  ========================= */
  const handleDownload = async (fileGuid, fileName) => {
    setDownloadingFileGuid(fileGuid);

    try {
      // 🔑 filename ТІЛЬКИ через query
      const params = new URLSearchParams({ filename: fileName });

      const url = `order/${orderGuid}/files/${fileGuid}/download/?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        responseType: "blob",
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (response.status !== 200) {
        throw new Error("Download failed");
      }

      const blob = new Blob([response.data]);
      const objectUrl = window.URL.createObjectURL(blob);

      // PDF → preview
      if (fileName.toLowerCase().endsWith(".pdf")) {
        window.open(objectUrl, "_blank");
      }
      // інші → download
      else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("❌ Error downloading file:", err);
      alert("Не вдалося завантажити файл.");
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  if (!orderGuid) return null;

  /* =========================
     UI
  ========================= */
  return createPortal(
    <div className="orders-file-modal-overlay" onClick={onClose}>
      <div
        className="orders-file-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="orders-file-modal-header">
          <div className="header-content">
            <FaFileAlt />
            <h3>Файли замовлення</h3>
          </div>
          <FaTimes className="close-btn" onClick={onClose} />
        </div>

        {/* BODY */}
        <div className="orders-file-body">
          {loading && <p>Завантаження файлів…</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && files.length === 0 && (
            <p>Файлів для цього замовлення не знайдено.</p>
          )}

          {!loading && files.length > 0 && (
            <ul className="file-list">
              {files.map((file) => {
                const isDownloading =
                  downloadingFileGuid === file.fileGuid;

                return (
                  <li key={file.fileGuid} className="file-item">
                    <div className="file-info-group">
                      <div className="file-icon-wrapper">
                        {getFileIcon(file.fileName)}
                      </div>

                      <div className="file-details">
                        <b className="file-name-b">{file.fileName}</b>
                        <div className="file-meta">
                          {file.type} |{" "}
                          {new Date(file.date).toLocaleString("uk-UA")}
                        </div>
                      </div>
                    </div>

                    <button
                      className="file-download-btn"
                      disabled={isDownloading}
                      onClick={() =>
                        handleDownload(file.fileGuid, file.fileName)
                      }
                    >
                      {isDownloading ? (
                        <>
                          <FaSpinner className="fa-spin" />
                          <span className="btn-text">Завантаження...</span>
                        </>
                      ) : file.fileName
                          .toLowerCase()
                          .endsWith(".pdf") ? (
                        <>
                          <FaEye />
                          <span className="btn-text">PDF</span>
                        </>
                      ) : (
                        <>
                          <FaDownload />
                          <span className="btn-text">Скачати</span>
                        </>
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
          <button
            type="button"
            className="order-file-close-btn"
            onClick={onClose}
          >
            <FaTimes /> Закрити
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderFilesModal;
