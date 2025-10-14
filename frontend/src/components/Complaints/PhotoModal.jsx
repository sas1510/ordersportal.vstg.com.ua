import React from "react";
import { createPortal } from "react-dom";
import "./PhotoModal.css";
import { FaTimes } from "react-icons/fa";

export default function PhotoModal({ isOpen, onClose, photos, currentIndex, setCurrentIndex }) {
  if (!isOpen) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return createPortal(
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-window" onClick={(e) => e.stopPropagation()}>
        <button className="photo-modal-close" onClick={onClose}>
            <FaTimes />
        </button>


        <div className="photo-modal-content">
          <img
            src={`data:image/png;base64,${photos[currentIndex]}`}
            alt={`Фото ${currentIndex + 1}`}
          />
        </div>

        {photos.length > 1 && (
          <>
            <button className="photo-modal-prev" onClick={handlePrev}>◀</button>
            <button className="photo-modal-next" onClick={handleNext}>▶</button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
