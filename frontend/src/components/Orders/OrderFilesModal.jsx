import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";
import { useNotification } from "../notification/Notifications";

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

  const { addNotification } = useNotification();
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
    const params = new URLSearchParams({ filename: fileName });
    const url = `order/${orderGuid}/files/${fileGuid}/download/?${params.toString()}`;

    const response = await axiosInstance.get(url, {
      responseType: "blob", // Обов'язково для отримання бінарних даних
    });

    // 1. Отримуємо правильний MIME-тип з заголовків відповіді
    const contentType = response.headers["content-type"] || "application/pdf";
    const blob = new Blob([response.data], { type: contentType });
    const objectUrl = window.URL.createObjectURL(blob);

    const isPdf = fileName.toLowerCase().endsWith(".pdf");
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName);

    // 2. Логіка для PDF та зображень (Перегляд)
    if (isPdf || isImage) {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      // Для PDF НЕ додаємо атрибут download, щоб він відкрився, а не скачався
      if (isImage) {
          link.download = fileName; // Зображення краще віддавати на скачування або теж у новій вкладці
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 
    // 3. Логіка для інших файлів (ZKZ, ZIP і т.д.)
    else {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // 4. Важливо: не видаляємо URL миттєво, даємо браузеру час завантажити файл у нову вкладку
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 5000);

  } catch (err) {
    console.error("Download error:", err);
    addNotification("Не вдалося відкрити або завантажити файл.", "error");
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
          <span className="icon icon-cross file-cross-close-btn" onClick={onClose}></span>
    
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
                        className="file-download-btn no-wrap"
                        disabled={isDownloading}
                        onClick={() => handleDownload(file.fileGuid, file.fileName)}
                      >
                        {isDownloading ? (
                          <div className="btn-content">
                            <FaSpinner className="fa-spin" />
                            <span className="btn-text">Завантаження...</span>
                          </div>
                        ) : file.fileName.toLowerCase().endsWith(".pdf") ? (
                          <div className="btn-content">
                            <FaEye /> <span className="btn-text">Скачати</span>
                          </div>
                        ) : (
                          <div className="btn-content">
                            <FaDownload /> <span className="btn-text">Скачати</span>
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
