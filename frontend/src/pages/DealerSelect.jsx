import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next"; // 👈 Імпорт
import axiosInstance from "../api/axios";
import "./DealerSelect.css";

const DealerSelect = ({ value, onChange }) => {
  const { t } = useTranslation(); // 👈 Ініціалізація
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchRef = useRef(null);
  const wrapperRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target)
    ) {
      setOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const res = await axiosInstance.get("/dealer-portal-users/");
        setDealers(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching dealers:", e);
        }
        setError(t('dealer_select.error_load')); // 👈 Переклад помилки
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, [t]);

  useEffect(() => {
    if (open) {
      setHighlightedIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const selected = dealers.find((d) => d.ContractorID === value);

  const filtered = dealers.filter((d) =>
    d.ContractorName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0,
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1,
      );
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const dealer = filtered[highlightedIndex];
      if (dealer) {
        onChange(dealer.ContractorID);
        setOpen(false);
        setSearch("");
      }
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="dealer-select" ref={wrapperRef}>
      <div
        className="dealer-select__control"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? "" : "placeholder"}>
          {selected ? selected.ContractorName : t('dealer_select.placeholder')}
        </span>
        <span className="arrow">▾</span>
      </div>

      {open && (
        <div className="dealer-select__dropdown" onKeyDown={handleKeyDown}>
          <input
            ref={searchRef}
            type="text"
            placeholder={t('dealer_select.search_placeholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightedIndex(0);
            }}
            className="dealer-select__search"
          />

          <div className="dealer-select__list">
            {loading && (
              <div className="dealer-select__empty">{t('common.loading')}</div>
            )}

            {!loading && error && (
              <div className="dealer-select__empty error">{error}</div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="dealer-select__empty">{t('common.no_results')}</div>
            )}

            {!loading &&
              !error &&
              filtered.map((d, idx) => (
                <div
                  key={d.ContractorID}
                  className={`dealer-select__option ${
                    idx === highlightedIndex ? "active" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onChange(d.ContractorID);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {d.ContractorName}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerSelect;