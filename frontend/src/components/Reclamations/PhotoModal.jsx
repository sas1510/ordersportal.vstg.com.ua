import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PhotoModal.css";

export default function PhotoModal({
  isOpen,
  onClose,
  photos = [],
  currentIndex = 0,
  setCurrentIndex,
}) {
  const thumbsRef = useRef(null); // Створюємо референс для контейнера мініатюр

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1));

  // АВТОПРОКРУТКА: Спрацьовує при зміні currentIndex
  useEffect(() => {
    if (isOpen && thumbsRef.current) {
      const activeThumb = thumbsRef.current.querySelector(
        ".photo-thumb.active",
      );
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth", // Плавна анімація
          block: "nearest", // Мінімальний рух по вертикалі
          inline: "center", // Центруємо активну мініатюру в списку
        });
      }
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, photos.length]);

  if (!isOpen || !photos.length) return null;

  const src = photos[currentIndex];

  return createPortal(
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-window" onClick={(e) => e.stopPropagation()}>
        <button className="photo-modal-close" onClick={onClose}>
          <FaTimes size={16} />
        </button>

        <div className="photo-modal-content-my">
          <img src={src} alt={`Фото ${currentIndex + 1}`} />
        </div>

        {photos.length > 1 && (
          <>
            <button className="photo-nav photo-nav-prev" onClick={prev}>
              <FaChevronLeft />
            </button>
            <button className="photo-nav photo-nav-next" onClick={next}>
              <FaChevronRight />
            </button>

            {/* Додаємо ref={thumbsRef} */}
            <div className="photo-modal-thumbs" ref={thumbsRef}>
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`thumb-${i}`}
                  className={`photo-thumb ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
