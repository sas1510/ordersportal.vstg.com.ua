import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axios";
import "./DealerSelect.css";

const ALL_DEALERS_VALUE = "__ALL__";

const DealerSelectWithAll = ({ value, onChange }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);   // 👈 wrapper
  const searchRef = useRef(null);

  /* =========================
     LOAD DEALERS
     ========================= */
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

  /* =========================
     CLOSE ON CLICK OUTSIDE
     ========================= */
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  /* =========================
     FOCUS SEARCH ON OPEN
     ========================= */
  useEffect(() => {
    if (open) {
      setHighlightedIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  /* =========================
     SELECTED LABEL
     ========================= */
  const selectedLabel =
    value === ALL_DEALERS_VALUE
      ? "Всі дилери"
      : dealers.find(d => d.ContractorID === value)?.ContractorName;

  /* =========================
     FILTERED LIST
     ========================= */
  const filteredDealers = dealers.filter(d =>
    d.ContractorName?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     KEYBOARD NAVIGATION
     ========================= */
  const handleKeyDown = (e) => {
    if (!open) return;

    const totalItems = filteredDealers.length + 1; // +1 for ALL

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < totalItems - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : totalItems - 1
      );
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();

      if (highlightedIndex === 0) {
        onChange(ALL_DEALERS_VALUE);
      } else {
        const dealer = filteredDealers[highlightedIndex - 1];
        if (dealer) onChange(dealer.ContractorID);
      }

      setOpen(false);
      setSearch("");
      setHighlightedIndex(-1);
    }

    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      setHighlightedIndex(-1);
    }
  };

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="dealer-select" ref={wrapperRef}>
      {/* CONTROL */}
      <div
        className="dealer-select__control"
        onClick={() => setOpen(o => !o)}
      >
        <span className={selectedLabel ? "" : "placeholder"}>
          {selectedLabel || "— Оберіть дилера —"}
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

            {!loading && !error && (
              <>
                {/* ALL DEALERS */}
                <div
                  className={`dealer-select__option all-dealers ${
                    highlightedIndex === 0 ? "active" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(0)}
                  onClick={() => {
                    onChange(ALL_DEALERS_VALUE);
                    setOpen(false);
                    setSearch("");
                    setHighlightedIndex(-1);
                  }}
                >
                  <strong>Всі дилери</strong>
                </div>

                {/* DEALERS */}
                {filteredDealers.length === 0 ? (
                  <div className="dealer-select__empty">
                    Нічого не знайдено
                  </div>
                ) : (
                  filteredDealers.map((d, idx) => (
                    <div
                      key={d.ContractorID}
                      className={`dealer-select__option ${
                        highlightedIndex === idx + 1 ? "active" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(idx + 1)}
                      onClick={() => {
                        onChange(d.ContractorID);
                        setOpen(false);
                        setSearch("");
                        setHighlightedIndex(-1);
                      }}
                    >
                      {d.ContractorName}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerSelectWithAll;
