import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import CommentsModal from "../Orders/CommentsModal";
import "./ClaimItemSummary.css"; 
import { FaFileCircleExclamation, FaUser  } from "react-icons/fa6";
import PhotoModal from "./PhotoModal";




const ClaimItemSummary = ({ claim }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [photos, setPhotos] = useState(claim.photos || []);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const handleViewComments = () => setIsCommentsOpen(true);

  const getStatusClass = (status) => {
    switch (status) {
      case "Нова":
      case "В процесі":
        return "text-info";
      case "Вирішено":
        return "text-success";
      case "Відхилено":
        return "text-danger";
      default:
        return "text-grey";
    }
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/${claim.id}/photos/`);
        if (res.data && Array.isArray(res.data)) {
          const photosBase64 = res.data
            .filter(p => p.upload_complete)
            .map(p => p.photo_base64);
          setPhotos(photosBase64);
        }
      } catch (err) {
        console.error("Помилка завантаження фото:", err);
      }
    };

    if (!claim.photos || claim.photos.length === 0) {
      fetchPhotos();
    }
  }, [claim.id]);

  const openPhotoModal = (index) => {
    setCurrentPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  return (
    <div className="claim-item" onClick={toggleExpand}>
      <div className="item-summary">
        <div className="summary-item row w-3">
          <span className="icon font-size-24 text-warning">
            <FaFileCircleExclamation className="font-size-24" />
          </span>
        </div>

        <div className="summary-item row w-7 no-wrap">
          <div className="column">
            <div className="text-info text-base border-b border-dashed pb-0 pt-0 w-full">
              № {claim.number}
            </div>
            <div className="text-danger">{claim.date}</div>
          </div>
        </div>

        <div className="summary-item row w-9 no-wrap">
          <div className="column">
            <div className="text-info text-base border-b border-dashed pb-0 pt-0 w-full">
              № {claim.orderNumber}
            </div>
            <div className="text-danger">{claim.orderDate}</div>
          </div>
        </div>

        <div className="summary-item">
          <div className="icon-info-with-circle font-size-24 text-info mr-1"></div> {/* правий відступ */}
          <div className={getStatusClass(claim.status)}>{claim.status}</div>
        </div>


          <div className="summary-item expandable row w-30 align-start space-between">
          <div className="column" style={{ flex: 1, minWidth: 0 }}>
            <div className="comments-text-wrapper-last">
              {claim.description || "Без коментарів"}
            </div>
            <button
              className="btn-comments"
              onClick={(e) => {
                e.stopPropagation();
                handleViewComments(claim.description || []);
              }}
            >
              💬 Історія коментарів
            </button>
          </div>
        </div>

        
        <div className="summary-item">
          <FaUser className="text-info mr-1" /> 
          <div >{claim.clientName}</div>
        </div>



       
      </div>

      {isExpanded && (
        <div className="item-details">
          <div>Клієнт: {claim.clientName}</div>
          <div>Номер замовлення: {claim.orderNumber}</div>
          <div>Опис: {claim.description}</div>

          {photos.length > 0 && (
            <div className="claim-photos row gap-10 mt-10">
              {photos.map((photoBase64, idx) => (
                <img
                  key={idx}
                  src={`data:image/png;base64,${photoBase64}`}
                  alt={`Фото ${idx + 1}`}
                  className="photo-thumb"
                  onClick={(e) => { e.stopPropagation(); openPhotoModal(idx); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={claim.comments || []}
        orderId={claim.id}
      />

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        photos={photos}
        currentIndex={currentPhotoIndex}
        setCurrentIndex={setCurrentPhotoIndex}
      />
    </div>
  );
};

export default ClaimItemSummary;
