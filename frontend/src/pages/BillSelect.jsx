import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./BillSelect.css";

const BillSelect = ({
  value,
  options,
  getValue,
  getLabel,
  placeholder,
  searchable = true,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const controlRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = options.find(
    (o) => getValue(o) === value
  );

  const filtered = useMemo(() => {
    if (!searchable) return options;
    return options.filter((o) =>
      getLabel(o).toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, searchable, getLabel]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        !controlRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
        <span className={selected ? "" : "placeholder"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <span className="arrow">▾</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bill-select__dropdown"
            style={style}
          >
            {searchable && (
              <div className="bill-select__search-wrapper">
                <input
                  autoFocus
                  className="bill-select__search"
                  placeholder="Пошук…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="bill-select__list">
              {filtered.map((o) => {
                const selected = getValue(o) === value;
                return (
                  <div
                    key={getValue(o)}
                    className={`bill-select__option ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() => {
                      onChange(getValue(o));
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {getLabel(o)}
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

export default BillSelect;
