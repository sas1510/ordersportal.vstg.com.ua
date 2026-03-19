import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import "./FilesModal.css";

const isImage = (name) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isVideo = (name) => /\.(mp4|webm|ogg)$/i.test(name);
const isPdf   = (name) => /\.pdf$/i.test(name);

export default function FilesModal({ isOpen, onClose, claimGuid }) {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    axiosInstance
      .get(`/complaints/${claimGuid}/files/`)
      .then((res) => setFiles(res.data.files || []))
      .finally(() => setLoading(false));
  }, [isOpen, claimGuid]);

  if (!isOpen) return null;

  const previewUrl = activeFile
    ? `/complaints/${claimGuid}/files/${activeFile.File_GUID}/preview/?filename=${encodeURIComponent(
        activeFile.FileName
      )}`
    : null;

  return (
    <div className="modal-overlay">
      <div className="modal-container wide">

        {/* HEADER */}
        <div className="modal-header">
          <h3>Файли рекламації</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="modal-body files-layout">
          
          {/* LEFT — FILE LIST */}
          <div className="files-list">
            {loading && <div className="text-grey">Завантаження...</div>}

            {!loading && files.length === 0 && (
              <div className="text-grey">Файлів немає</div>
            )}

            {files.map((f) => (
              <div
                key={f.File_GUID}
                className={`file-item ${activeFile?.File_GUID === f.File_GUID ? "active" : ""}`}
                onClick={() => setActiveFile(f)}
              >
                📎 {f.FileName}
              </div>
            ))}
          </div>

          {/* RIGHT — PREVIEW */}
          <div className="file-preview">
            {!activeFile && (
              <div className="text-grey">Оберіть файл для перегляду</div>
            )}

            {activeFile && isImage(activeFile.FileName) && (
              <img src={previewUrl} alt="" />
            )}

            {activeFile && isVideo(activeFile.FileName) && (
              <video controls src={previewUrl} />
            )}

            {activeFile && isPdf(activeFile.FileName) && (
              <iframe title="pdf" src={previewUrl} />
            )}

            {activeFile &&
              !isImage(activeFile.FileName) &&
              !isVideo(activeFile.FileName) &&
              !isPdf(activeFile.FileName) && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Відкрити файл
                </a>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}
