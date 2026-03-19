import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import "./FilePreviewModal.css";

const isImage = (ext) => ["jpg", "jpeg", "png", "webp"].includes(ext);
const isVideo = (ext) => ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
const isPdf   = (ext) => ext === "pdf";

const FilePreviewModal = ({
  isOpen,
  onClose,
  files = [],
  currentIndex,
  setCurrentIndex,
  claimGuid,
}) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const file = files[currentIndex];

  // =============================
  // FETCH FILE PREVIEW (AUTH)
  // =============================
  useEffect(() => {
    if (!isOpen || !file) return;

    let revokedUrl = null;

    const loadFile = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance.get(
          `/complaints/${claimGuid}/files/${file.guid}/preview/`,
          {
            params: { filename: file.name },
            responseType: "blob", // 🔑 КЛЮЧОВЕ
          }
        );

        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        const url = URL.createObjectURL(blob);
        revokedUrl = url;
        setBlobUrl(url);

      } catch (err) {
        console.error("Помилка перегляду файлу:", err);
        setBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [isOpen, file, claimGuid]);

  // =============================
  // KEYBOARD (ESC)
  // =============================
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!isOpen || !file) return null;

  const next = () =>
    setCurrentIndex((i) => (i + 1) % files.length);

  const prev = () =>
    setCurrentIndex((i) => (i - 1 + files.length) % files.length);

  return (
    <div className="file-modal-overlay">
      <div className="file-modal">

        {/* HEADER */}
        <div className="file-modal-header">
          <span>{file.name}</span>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="file-modal-body">
          {loading && <div className="file-loading">Завантаження…</div>}

          {!loading && blobUrl && isImage(file.ext) && (
            <img src={blobUrl} alt={file.name} />
          )}

          {!loading && blobUrl && isVideo(file.ext) && (
            <video src={blobUrl} controls autoPlay />
          )}

          {!loading && blobUrl && isPdf(file.ext) && (
            <iframe src={blobUrl} title={file.name} />
          )}
        </div>

        {/* FOOTER */}
        {files.length > 1 && (
          <div className="file-modal-footer">
            <button onClick={prev}>◀</button>
            <span>{currentIndex + 1} / {files.length}</span>
            <button onClick={next}>▶</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
