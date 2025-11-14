import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./PhotoModal.css";
import { FaTimes } from "react-icons/fa";
import { useNotification } from '../notification/Notifications.jsx';

export default function PhotoModal({ isOpen, onClose, photos, currentIndex, setCurrentIndex }) {
    const { addNotification } = useNotification();
    const [validPhoto, setValidPhoto] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const currentPhotoData = photos[currentIndex];
        if (!currentPhotoData) {
            addNotification("Не вдалося завантажити фото: дані відсутні.", 'error', 4000);
            setValidPhoto(false);
            return;
        }

        const isUrl = /^https?:\/\//i.test(currentPhotoData);
        const isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(currentPhotoData) && currentPhotoData.length > 100;

        if (!isUrl && !isBase64) {
            addNotification("Не вдалося відобразити фото: дані некоректні або пошкоджені.", 'error', 4000);
            setValidPhoto(false);
            return;
        }

        setValidPhoto(true);
    }, [isOpen, currentIndex, photos, addNotification]);

    if (!isOpen || !validPhoto) return null;

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    const currentPhotoData = photos[currentIndex];

    const getPhotoSource = (data) => {
        if (!data) return null;
        if (data.startsWith('http://') || data.startsWith('https://')) return data;
        return `data:image/jpeg;base64,${data}`;
    };

    const photoSrc = getPhotoSource(currentPhotoData);

    return createPortal(
        <div className="photo-modal-overlay" onClick={onClose}>
            <div className="photo-modal-window" onClick={(e) => e.stopPropagation()}>
                <button className="photo-modal-close" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="photo-modal-content">
                    {photoSrc ? (
                        <img
                            src={photoSrc}
                            alt={`Фото ${currentIndex + 1} з ${photos.length}`}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                addNotification("❌ Помилка: Не вдалося відобразити фото.", 'error', 4000);
                            }}
                        />
                    ) : (
                        <div className="text-white">Фото не завантажено</div>
                    )}
                </div>

                <div className="photo-modal-counter">
                    {currentIndex + 1} / {photos.length}
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
