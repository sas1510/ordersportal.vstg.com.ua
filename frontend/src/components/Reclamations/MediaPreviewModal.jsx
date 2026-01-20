import React from "react";

export default function MediaPreviewModal({ isOpen, onClose, file, previewUrl }) {
  if (!isOpen || !file) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container wide">
        <div className="modal-header">
          <b>{file.FileName}</b>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {file.FileName.match(/\.(jpg|jpeg|png|webp)$/i) && (
            <img src={previewUrl} alt="" />
          )}

          {file.FileName.match(/\.(mp4|webm|ogg)$/i) && (
            <video controls src={previewUrl} />
          )}

          {file.FileName.match(/\.pdf$/i) && (
            <iframe src={previewUrl} title="pdf" />
          )}
        </div>
      </div>
    </div>
  );
}
