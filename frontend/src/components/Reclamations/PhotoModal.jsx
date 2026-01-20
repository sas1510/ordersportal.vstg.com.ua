import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./PhotoModal.css";

export default function PhotoModal({
  isOpen,
  onClose,
  photos = [],
  currentIndex = 0,
  setCurrentIndex,
}) {
  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1));

  const next = () =>
    setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !photos.length) return null;

  const src = photos[currentIndex];

  return createPortal(
    <div className="photo-modal-overlay" onClick={onClose}>
      <div
        className="photo-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button className="photo-modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        {/* IMAGE */}
        <div className="photo-modal-content-my">
          <img src={src} alt={`Фото ${currentIndex + 1}`} />
        </div>

        {/* ⬅️ PREV */}
        {photos.length > 1 && (
          <button
            className="photo-nav photo-nav-prev"
            onClick={prev}
            aria-label="Попереднє фото"
          >
            <FaChevronLeft />
          </button>
        )}

        {/* ➡️ NEXT */}
        {photos.length > 1 && (
          <button
            className="photo-nav photo-nav-next"
            onClick={next}
            aria-label="Наступне фото"
          >
            <FaChevronRight />
          </button>
        )}

        {/* THUMBNAILS */}
        {photos.length > 1 && (
          <div className="photo-modal-thumbs">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={`thumb-${i}`}
                className={`photo-thumb ${
                  i === currentIndex ? "active" : ""
                }`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
