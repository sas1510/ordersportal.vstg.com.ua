import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axios";
import "./DealerSelect.css";

const DealerSelect = ({ value, onChange }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchRef = useRef(null);

  // =========================
  // LOAD DEALERS
  // =========================
  useEffect(() => {
    const loadDealers = async () => {
      try {
        const res = await axiosInstance.get("/dealer-portal-users/");
        setDealers(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setError("Помилка завантаження дилерів");
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, []);

  // Фокус на input при відкритті
  useEffect(() => {
    if (open) {
      setHighlightedIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const selected = dealers.find(
    (d) => d.ContractorID === value
  );

  const filtered = dealers.filter((d) =>
    d.ContractorName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================
  // KEYBOARD HANDLING
  // =========================
  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
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
    <div className="dealer-select">
      {/* CONTROL */}
      <div
        className="dealer-select__control"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? "" : "placeholder"}>
          {selected
            ? selected.ContractorName
            : "— Оберіть дилера —"}
        </span>
        <span className="arrow">▾</span>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          className="dealer-select__dropdown"
          onKeyDown={handleKeyDown}
        >
          <input
            ref={searchRef}
            type="text"
            placeholder="Пошук дилера…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightedIndex(0);
            }}
            className="dealer-select__search"
          />

          <div className="dealer-select__list">
            {loading && (
              <div className="dealer-select__empty">
                Завантаження…
              </div>
            )}

            {!loading && error && (
              <div className="dealer-select__empty error">
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="dealer-select__empty">
                Нічого не знайдено
              </div>
            )}

            {!loading && !error &&
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
