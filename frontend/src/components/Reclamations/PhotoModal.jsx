import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PhotoModal.css";

export default function PhotoModal({
  isOpen,
  onClose,
  photos = [],
  currentIndex = 0,
  setCurrentIndex,
  portalTarget,
  mediaKind = "photo",
}) {
  const [zoomedIndex, setZoomedIndex] = useState(null);
  const zoomed = zoomedIndex === currentIndex;
  const thumbsRef = useRef(null); 

  const prev = () => {
    setZoomedIndex(null);
    setCurrentIndex(i => i === 0 ? photos.length - 1 : i - 1);
  };
  const next = () => {
    setZoomedIndex(null);
    setCurrentIndex(i => i === photos.length - 1 ? 0 : i + 1);
  };


  useEffect(() => {
    if (isOpen && thumbsRef.current) {
      const activeThumb = thumbsRef.current.querySelector(
        ".photo-thumb.active",
      );
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth", 
          block: "nearest", 
          inline: "center",
        });
      }
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.target instanceof HTMLVideoElement) return;
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
      <div className={`photo-modal-window${portalTarget ? " complaint-gallery" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Закрити переглядач" className="photo-modal-close" onClick={onClose}>
          <FaTimes size={16} />
        </button>

        {portalTarget && <div className="complaint-gallery__counter">{mediaKind === "video" ? "Відео" : "Фото"} {currentIndex + 1} / {photos.length}</div>}
        {portalTarget && mediaKind === "photo" && <button type="button" className="complaint-gallery__zoom" aria-pressed={zoomed} onClick={() => setZoomedIndex(zoomed ? null : currentIndex)}>
          {zoomed ? "Зменшити" : "Збільшити ×2"}
        </button>}
        <div key={currentIndex} className={`photo-modal-content-my${zoomed ? " is-zoomed" : ""}`}>
          {mediaKind === "video" ? <video key={src} src={src} controls playsInline /> : <img src={src} alt={`Фото ${currentIndex + 1}`} />}
        </div>

        {photos.length > 1 && (
          <>
            <button type="button" aria-label="Попередній файл" className="photo-nav photo-nav-prev" onClick={prev}>
              <FaChevronLeft />
            </button>
            <button type="button" aria-label="Наступний файл" className="photo-nav photo-nav-next" onClick={next}>
              <FaChevronRight />
            </button>

        
            <div className="photo-modal-thumbs" ref={thumbsRef}>
              {photos.map((photo, i) => mediaKind === "video" ? (
                  <button type="button" key={i} className={`photo-thumb${i === currentIndex ? " active" : ""}`} aria-label={`Відео ${i + 1}`} onClick={() => { setZoomedIndex(null); setCurrentIndex(i); }}>▶ {i + 1}</button>
                ) : (
                <img
                  key={i}
                  src={photo}
                  alt={`thumb-${i}`}
                  className={`photo-thumb ${i === currentIndex ? "active" : ""}`}
                  onClick={() => { setZoomedIndex(null); setCurrentIndex(i); }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    portalTarget || document.body,
  );
}
