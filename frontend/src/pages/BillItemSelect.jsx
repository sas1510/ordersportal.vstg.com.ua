import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./BillItemSelect.css";
import { useTranslation } from "react-i18next";
import AutoTranslatedText from "../components/ui/AutoTranslatedText"; // Шлях до вашого компонента

const BillItemSelect = ({ value, items, onChange, placeholder }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const controlRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedItem = items.find((i) => i.CodeInDB === value);

  const filteredItems = useMemo(() => {
    return items.filter((i) =>
      i.NameBills.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        !controlRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const rect = controlRef.current?.getBoundingClientRect();
  const style = rect
    ? {
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 100000,
      }
    : {};

  return (
    <>
      <button
        ref={controlRef}
        type="button"
        className={`bill-select__control ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selectedItem ? "" : "placeholder"}>
          {selectedItem ? (
            <>
              {/* ПЕРЕКЛАД ОБРАНОГО ТОВАРУ */}
              <AutoTranslatedText text={selectedItem.NameBills} />
              <span className="unit"> <AutoTranslatedText text={selectedItem.EdIzm} /></span>
            </>
          ) : (
            placeholder || t("create_bill.placeholders.product")
          )}
        </span>
        <span className="arrow">▾</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bill-select__dropdown portal"
            style={style}
          >
            <div className="bill-select__search-wrapper">
              <input
                autoFocus
                className="bill-select__search"
                placeholder={t("common.search") + "..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="bill-select__list">
              {filteredItems.length === 0 && (
                <div className="bill-select__empty">{t("common.no_data")}</div>
              )}

              {filteredItems.map((i) => {
                const selected = i.CodeInDB === value;

                return (
                  <div
                    key={i.CodeInDB}
                    className={`bill-select__option ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() => {
                      onChange(i.CodeInDB);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {/* АВТОПЕРЕКЛАД КОЖНОЇ ОПЦІЇ В СПИСКУ */}
                    <AutoTranslatedText text={i.NameBills} />
                    <span className="unit"> (<AutoTranslatedText text={i.EdIzm} />)</span>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default BillItemSelect;