import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../api/axios";
import "./DealerSelectModal.css";

const DealerSelectModal = ({ isOpen, onClose, onSelect }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDealers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/get_dealers/");
        setDealers(response.data?.dealers || []);
      } catch (err) {
        console.error("Помилка завантаження дилерів:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [isOpen]);

  const filteredDealers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return dealers.filter((d) =>
      d.full_name.toLowerCase().includes(term)
    );
  }, [dealers, searchTerm]);

  const handleSelect = () => {
    if (!selectedDealer) return;
    onSelect(selectedDealer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dealer-modal-overlay" onClick={onClose}>
      <div className="dealer-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="dealer-modal-header">
          <h3>Вибір дилера</h3>
          <span className="dealer-modal-close" onClick={onClose}>&times;</span>
        </div>

        <div className="dealer-modal-body">
          {loading ? (
            <div className="dealer-modal-loading">Завантаження дилерів...</div>
          ) : (
            <>
              {/* 🔎 Фільтр */}
              <input
                type="text"
                placeholder="Пошук дилера..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsListOpen(true); // 👈 Список не закривається
                }}
                className="dealer-modal-search"
              />

              {/* 📋 Кнопка для відкриття списку */}
              <div
                className="dealer-select-box"
                onClick={() => setIsListOpen((prev) => !prev)}
              >
                {selectedDealer ? selectedDealer.full_name : "Оберіть дилера"}
              </div>

              {/* 🧾 Список дилерів */}
              {isListOpen && (
                <div className="dealer-list">
                  <div
                    className="dealer-item"
                    onClick={() => {
                      setSelectedDealer({ id: "all", full_name: "Всі дилери" });
                      setIsListOpen(false);
                    }}
                  >
                    🌍 Всі дилери
                  </div>

                  {filteredDealers.map((d) => (
                    <div
                      key={d.id}
                      className="dealer-item"
                      onClick={() => {
                        setSelectedDealer(d);
                        setIsListOpen(false);
                      }}
                    >
                      {d.full_name}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="dealer-modal-footer">
          <button
            className="dealer-modal-btn dealer-modal-btn-primary"
            onClick={handleSelect}
            disabled={!selectedDealer}
          >
            Вибрати
          </button>
          <button className="dealer-modal-btn dealer-modal-btn-secondary" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerSelectModal;
