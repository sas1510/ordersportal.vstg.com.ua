import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../api/axios";
import "./DealerSelectModal.css";

const DealerSelectModal = ({ isOpen, onClose, onSelect }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchDealers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/get_dealers/");
        console.log("response.data:", response.data);

        if (response.data?.dealers) {
          setDealers(response.data.dealers);
        } else {
          setDealers([]);
        }
      } catch (err) {
        console.error("Помилка завантаження дилерів:", err);
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [isOpen]);

  // 🔍 Фільтрація дилерів за введеним текстом
  const filteredDealers = useMemo(() => {
    if (!searchTerm.trim()) return dealers;
    const term = searchTerm.toLowerCase();
    return dealers.filter(d =>
      d.full_name.toLowerCase().includes(term)
    );
  }, [dealers, searchTerm]);

  const handleSelect = () => {
  // Якщо обрано "всі дилери" — відправляємо "all"
    if (selectedDealerId === "all") {
      onSelect({ id: "all", full_name: "Всі дилери" });
      onClose();
      return;
    }

    const dealer = dealers.find(d => d.id === Number(selectedDealerId));
    if (dealer) {
      onSelect(dealer);
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <div className="dealer-modal-overlay" onClick={onClose}>
      <div className="dealer-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="dealer-modal-header">
          <h3>Вибір дилера</h3>
          <span className="dealer-modal-close" onClick={onClose}>
            &times;
          </span>
        </div>

        <div className="dealer-modal-body">
          {loading ? (
            <div className="dealer-modal-loading">Завантаження дилерів...</div>
          ) : (
            <>
              {/* 🔎 Поле пошуку */}
              <input
                type="text"
                placeholder="Пошук дилера..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dealer-modal-search"
              />

              {/* Селект з фільтрованими дилерами */}
              <select
                value={selectedDealerId}
                onChange={(e) => setSelectedDealerId(e.target.value)}
                className="dealer-modal-select"
              >
                <option value="">-- Оберіть дилера --</option>
                <option value="all">🌍 Всі дилери</option>
                {filteredDealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="dealer-modal-footer">
          <button
            className="dealer-modal-btn dealer-modal-btn-primary"
            onClick={handleSelect}
            disabled={!selectedDealerId}
          >
            Вибрати
          </button>
          <button
            className="dealer-modal-btn dealer-modal-btn-secondary"
            onClick={onClose}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerSelectModal;
