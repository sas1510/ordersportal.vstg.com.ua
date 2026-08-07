import React, { useEffect, useState, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";
import axiosInstance from "../api/axios";
import "./DealerSelect.css";
import { useTranslation } from "react-i18next";

const ALL_DEALERS_VALUE = "__ALL__";

const DealerSelectWithAll = ({
  value,
  onChange,
  allowAll = true,
  placeholder,
  allLabel,
}) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const res = await axiosInstance.get("/dealer-portal-users/");
        setDealers(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching dealers:", e);
        }
        setError(t("dealer_select.error_load"));
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, [t]);

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

  useEffect(() => {
    if (open) {
      setHighlightedIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const resolvedAllLabel = allLabel || t("dealer_select.all_dealers");
  const resolvedPlaceholder = placeholder || t("dealer_select.placeholder");

  const selectedLabel =
    allowAll && value === ALL_DEALERS_VALUE
      ? resolvedAllLabel
      : dealers.find((d) => d.ContractorID === value)?.ContractorName;

  const filteredDealers = dealers.filter((d) =>
    d.ContractorName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleKeyDown = (e) => {
    if (!open) return;

    const totalItems = filteredDealers.length + (allowAll ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();

      if (allowAll && highlightedIndex === 0) {
        onChange(ALL_DEALERS_VALUE);
      } else {
        const dealer = filteredDealers[highlightedIndex - (allowAll ? 1 : 0)];
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

  return (
    <div className="dealer-select" ref={wrapperRef}>
      <div
        className="dealer-select__control"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selectedLabel ? "" : "placeholder"}>
          {selectedLabel || resolvedPlaceholder}
        </span>
        <FaChevronDown className="arrow" size={12} />
      </div>

      {open && (
        <div className="dealer-select__dropdown" onKeyDown={handleKeyDown}>
          <input
            ref={searchRef}
            type="text"
            placeholder={t("dealer_select.search_placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightedIndex(allowAll ? 0 : -1);
            }}
            className="dealer-select__search"
          />

          <div className="dealer-select__list">
            {loading && (
              <div className="dealer-select__empty">{t("dealer_select.loading")}</div>
            )}

            {!loading && error && (
              <div className="dealer-select__empty error">{error}</div>
            )}

            {!loading && !error && (
              <>
                {allowAll && (
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
                    <strong>{resolvedAllLabel}</strong>
                  </div>
                )}

                {filteredDealers.length === 0 ? (
                  <div className="dealer-select__empty">{t("dealer_select.empty")}</div>
                ) : (
                  filteredDealers.map((d, idx) => (
                    <div
                      key={d.ContractorID}
                      className={`dealer-select__option ${
                        highlightedIndex === idx + (allowAll ? 1 : 0) ? "active" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(idx + (allowAll ? 1 : 0))}
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
