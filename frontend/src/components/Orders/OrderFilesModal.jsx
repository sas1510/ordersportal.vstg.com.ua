import React, { useState, useEffect, useMemo, useRef } from "react";
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
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import "./OrderFilesPreviewModal.css";

// Додали новий проп entityType ("order" або "calculation")
const OrderFilesModal = ({
  orderGuid,
  orderNumber,
  entityType = "order",
  hideZkzFiles = false,
  autoOpenPdf = false,
  orderAmount,
  orderCurrency,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFileGuid, setDownloadingFileGuid] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const autoOpenedPdfRef = useRef(false);

  const formattedOrderAmount = useMemo(() => {
    const amount = Number(orderAmount);
    if (!Number.isFinite(amount)) return "";

    return `${new Intl.NumberFormat(i18n.language || "uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} ${orderCurrency || "грн"}`;
  }, [i18n.language, orderAmount, orderCurrency]);

  const getFileExtension = (fileName = "") => fileName.toLowerCase().split(".").pop();

  const isImageFileType = (fileType = "") => {
    const normalizedType = String(fileType).toLowerCase();
    return normalizedType.includes("фото") || normalizedType.includes("изображ") || normalizedType.includes("зображ");
  };

  const isPreviewableFile = (fileName = "", fileType = "", contentType = "") => {
    const ext = getFileExtension(fileName);
    if (ext === "zkz") {
      return false;
    }
    if (isImageFileType(fileType) || String(contentType).toLowerCase().startsWith("image/")) {
      return true;
    }
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

  const getPreviewKind = (fileName = "", contentType = "", fileType = "") => {
    const ext = getFileExtension(fileName);
    const normalizedContentType = String(contentType).toLowerCase();
    if (isImageFileType(fileType) || normalizedContentType.startsWith("image/")) return "image";
    if (normalizedContentType.startsWith("video/")) return "video";
    if (normalizedContentType === "application/pdf") return "pdf";
    if (normalizedContentType.startsWith("text/")) return "text";
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext)) return "image";
    if (["mp4", "webm"].includes(ext)) return "video";
    if (["txt", "csv", "json", "xml"].includes(ext)) return "text";
    if (ext === "pdf") return "pdf";
    return "unknown";
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    const visibleFiles = hideZkzFiles && !/^(01|45)-/.test(String(orderNumber || "").trim())
      ? files.filter(
          (f) =>
            !(f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz")),
        )
      : files;

    return {
      pdf: visibleFiles.filter(f => /\.pdf$/i.test(f.fileName)),
      zkz: visibleFiles.filter(f => f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz")),
      images: visibleFiles.filter(f => !/\.pdf$/i.test(f.fileName) && (f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName))),
      others: visibleFiles.filter(f => {
        const isZkz = f.type?.toLowerCase().includes("заявка") || f.fileName.toLowerCase().endsWith(".zkz");
        const isImg = f.type?.toLowerCase().includes("фото") || /\.(jpg|jpeg|png|webp)$/i.test(f.fileName);
        return !isZkz && !isImg && !/\.pdf$/i.test(f.fileName);
      })
    };
  }, [files, hideZkzFiles, orderNumber]);

  const previewImages = useMemo(
    () => groups.images.filter((file) => isPreviewableFile(file.fileName, file.type)),
    [groups.images],
  );

  const currentImageIndex = previewFile?.previewKind === "image"
    ? previewImages.findIndex((file) => file.fileGuid === previewFile.fileGuid)
    : -1;

  const showAdjacentImage = (direction) => {
    if (previewImages.length < 2 || currentImageIndex < 0 || downloadingFileGuid) return;
    const nextIndex = (currentImageIndex + direction + previewImages.length) % previewImages.length;
    handleFileAction(previewImages[nextIndex]);
  };

  /* =========================
      ЛОГІКА ВІДКРИТТЯ/ЗАВАНТАЖЕННЯ ФАЙЛІВ
  ========================= */
  const handleClosePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setPreviewText("");
    setPreviewFile(null);
    setPreviewLoading(false);
    if (autoOpenPdf) {
      onClose();
    }
  };

  const buildFileDownloadUrl = (fileItem) => {
    return entityType === "calculation"
      ? "/orders/" + orderGuid + "/files/" + fileItem.fileGuid + "/download_calc/?filename=" + encodeURIComponent(fileItem.fileName)
      : "/order/" + orderGuid + "/files/" + fileItem.fileGuid + "/download/?filename=" + encodeURIComponent(fileItem.fileName);
  };

  const fetchFileBlob = async (fileItem) => {
    const response = await axiosInstance.get(buildFileDownloadUrl(fileItem), {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    return { blob, response };
  };

  const handleOpenPreviewInNewWindow = () => {
    if (!previewUrl) {
      return;
    }

    const openedWindow = window.open("", "_blank");
    if (!openedWindow) {
      addNotification(
        t("orders.filesPreview.open_window_blocked", {
          defaultValue: "Браузер заблокував нове вікно",
        }),
        "warning",
      );
      return;
    }

    openedWindow.location.href = previewUrl;
    openedWindow.opener = null;
  };

  const handleFileAction = async (fileItem) => {
    setDownloadingFileGuid(fileItem.fileGuid);
    try {
      const { blob, response } = await fetchFileBlob(fileItem);

      if (isPreviewableFile(fileItem.fileName, fileItem.type, blob.type)) {
        const nextPreviewUrl = window.URL.createObjectURL(blob);
        const previewKind = getPreviewKind(fileItem.fileName, blob.type, fileItem.type);

        if (previewUrl) {
          window.URL.revokeObjectURL(previewUrl);
        }

        setPreviewLoading(true);
        setPreviewFile({
          ...fileItem,
          previewKind,
          contentType: blob.type || response.headers["content-type"] || "",
        });
        setPreviewText("");
        setPreviewUrl(nextPreviewUrl);

        if (previewKind === "text") {
          const textContent = await blob.text();
          setPreviewText(textContent);
        }

        setPreviewLoading(false);
        return;
      }

      const objectUrl = window.URL.createObjectURL(blob);
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
      handleClosePreview();
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  useEffect(() => {
    if (previewFile?.previewKind !== "image" || previewImages.length < 2) return undefined;

    const handleImageKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showAdjacentImage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showAdjacentImage(1);
      }
    };

    window.addEventListener("keydown", handleImageKeyDown);
    return () => window.removeEventListener("keydown", handleImageKeyDown);
  }, [previewFile, previewImages, currentImageIndex, downloadingFileGuid]);

  const handleOpenFileInNewWindow = async (fileItem) => {
    const openedWindow = window.open("", "_blank");
    if (!openedWindow) {
      addNotification(
        t("orders.filesPreview.open_window_blocked", {
          defaultValue: "Браузер заблокував нове вікно",
        }),
        "warning",
      );
      return;
    }

    setDownloadingFileGuid(fileItem.fileGuid);
    try {
      const { blob } = await fetchFileBlob(fileItem);
      const objectUrl = window.URL.createObjectURL(blob);
      openedWindow.location.href = objectUrl;
      openedWindow.opener = null;

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (error) {
      openedWindow.close();
      console.error("Open file in new window error:", error);
      addNotification(
        t("orders.filesPreview.open_window_error", {
          defaultValue: "Не вдалося відкрити файл у новому вікні",
        }),
        "error",
      );
    } finally {
      setDownloadingFileGuid(null);
    }
  };

  useEffect(() => {
    autoOpenedPdfRef.current = false;
  }, [orderGuid, autoOpenPdf]);

  useEffect(() => {
    if (!autoOpenPdf || loading || autoOpenedPdfRef.current) return;

    const pdfFile = files.find(
      (file) => getFileExtension(file?.fileName) === "pdf",
    );

    if (!pdfFile) return;

    autoOpenedPdfRef.current = true;
    handleFileAction(pdfFile);
  }, [autoOpenPdf, files, loading]);

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    if (previewLoading) {
      return (
        <div className="file-preview-state">
          <FaSpinner className="spinner-animation" size={30} />
          <p>{t("common.loadingFiles")}</p>
        </div>
      );
    }

    if (previewFile.previewKind === "image") {
      return <img src={previewUrl} alt={previewFile.fileName} className="file-preview-image" />;
    }

    if (previewFile.previewKind === "video") {
      return <video src={previewUrl} controls className="file-preview-video" />;
    }

    if (previewFile.previewKind === "pdf") {
      return <iframe src={previewUrl} title={previewFile.fileName} className="file-preview-frame" />;
    }

    if (previewFile.previewKind === "text") {
      return <pre className="file-preview-text">{previewText}</pre>;
    }

    return (
      <div className="file-preview-state">
        <FaFileAlt size={40} style={{ color: "#bbb", marginBottom: "10px" }} />
        <p>{t("orders.downloadFileError")}</p>
      </div>
    );
  };

  const getFileIcon = (fileName, fileType = "") => {
    const ext = getFileExtension(fileName);
    if (ext === "zkz") return <FaFileArchive className="file-icon icon-zkz" />;
    if (isImageFileType(fileType) || ["jpg", "jpeg", "png", "webp"].includes(ext)) return <FaImage className="file-icon icon-image" />;
    return <FaFileAlt className="file-icon icon-doc" />;
  };

  if (!orderGuid) return null;

  const renderFileCard = (file) => {
    const isDownloading = downloadingFileGuid === file.fileGuid;
    const isPreviewable = isPreviewableFile(file.fileName, file.type);

    return (
      <div key={file.fileGuid} className={`file-card ${file.fileName.toLowerCase().endsWith('.zkz') ? 'card-zkz' : /\.(jpg|jpeg|png|webp)$/i.test(file.fileName) ? 'card-image' : 'card-other'}`}>
        <div className="file-card-info">
          {getFileIcon(file.fileName, file.type)}
          <div className="file-details">
            <span className="file-name-text" title={file.fileName}>{file.fileName}</span>
            <span className="file-date-text">
              {file.date ? new Date(file.date).toLocaleString(i18n.language) : t("files.unknownDate")}
            </span>
          </div>
        </div>
        <div className="file-card-actions">
          {isPreviewable && (
            <>
              <button
                className="file-action-btn"
                disabled={isDownloading}
                onClick={() => handleFileAction(file)}
                title={t("common.open", { defaultValue: "Відкрити" })}
              >
                {isDownloading ? <FaSpinner className="spinner-animation" /> : <FaEye />}
              </button>
              <button
                className="file-action-btn"
                disabled={isDownloading}
                onClick={() => handleOpenFileInNewWindow(file)}
                title={t("orders.filesPreview.open_in_new_window", { defaultValue: "Відкрити у новому вікні" })}
              >
                <FaExternalLinkAlt />
              </button>
            </>
          )}
          {!isPreviewable && (
            <button
              className="file-action-btn"
              disabled={isDownloading}
              onClick={() => handleFileAction(file)}
              title={t("common.download")}
            >
              {isDownloading ? <FaSpinner className="spinner-animation" /> : <FaDownload />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return createPortal(
    <>
      {!autoOpenPdf && (
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
              {groups.pdf.length > 0 && (
                <div className="preview-section">
                  <h4>PDF</h4>
                  <div className="preview-grid">{groups.pdf.map(renderFileCard)}</div>
                </div>
              )}

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
      </div>
      )}

      {autoOpenPdf && !previewFile && (
        <div className="file-preview-overlay" onClick={onClose}>
          <div className="file-preview-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-header">
              <div className="file-preview-title-wrap">
                <h3 className="file-preview-title">
                  Замовлення{orderNumber ? ` № ${orderNumber}` : ""}
                </h3>
                {formattedOrderAmount && (
                  <strong className="file-preview-order-amount">
                    Сума замовлення: {formattedOrderAmount}
                  </strong>
                )}
              </div>
              <button className="preview-close-btn" onClick={onClose}>
                <FaTimes size={18} />
              </button>
            </div>
            <div className="file-preview-body">
              {loading || downloadingFileGuid ? (
                <div className="file-preview-state">
                  <FaSpinner className="spinner-animation" size={30} />
                  <p>Завантаження PDF...</p>
                </div>
              ) : (
                <div className="file-preview-state">
                  <FaFileAlt size={40} style={{ color: "#bbb", marginBottom: "10px" }} />
                  <p>PDF замовлення не знайдено.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewFile && (        <div className="file-preview-overlay" onClick={handleClosePreview}>
          <div className="file-preview-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-header">
              <div className="file-preview-title-wrap">
                <h3 className="file-preview-title">{previewFile.fileName}</h3>
                {formattedOrderAmount && (
                  <strong className="file-preview-order-amount">
                    Сума замовлення: {formattedOrderAmount}
                  </strong>
                )}
                <span className="file-preview-subtitle">{t("orders.modalFilesSubtitle")}</span>
              </div>
              <button className="preview-close-btn" onClick={handleClosePreview}>
                <FaTimes size={18} />
              </button>
            </div>
            <div className="file-preview-body">
              {previewFile.previewKind === "image" && previewImages.length > 1 && (
                <>
                  <button type="button" className="file-preview-nav file-preview-nav-prev" onClick={() => showAdjacentImage(-1)} aria-label="Попереднє зображення">
                    <FaChevronLeft />
                  </button>
                  <button type="button" className="file-preview-nav file-preview-nav-next" onClick={() => showAdjacentImage(1)} aria-label="Наступне зображення">
                    <FaChevronRight />
                  </button>
                </>
              )}
              {renderPreviewContent()}
            </div>
            <div className="file-preview-footer">
              <button
                className="preview-btn-secondary-footer"
                onClick={handleOpenPreviewInNewWindow}
              >
                <FaExternalLinkAlt />
                <span>{t("orders.filesPreview.open_in_new_window", { defaultValue: "Відкрити у новому вікні" })}</span>
              </button>
              <button className="preview-btn-close-footer" onClick={handleClosePreview}>
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default OrderFilesModal;
