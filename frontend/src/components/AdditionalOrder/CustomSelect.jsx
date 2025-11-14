import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import "./CustomSelect.css";

export default function CustomSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = "-- Оберіть --",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const selectedOption = options.find((o) => o.Link === value);

  return (
    <div className={`custom-select ${disabled ? "disabled" : ""}`} ref={ref}>
      {label && <span className="select-label">{label}</span>}

      <div
        className="select-control"
        onClick={() => !disabled && setOpen((p) => !p)}
      >
        <span className={`select-value ${!selectedOption ? "placeholder" : ""}`}>
          {selectedOption ? selectedOption.Name : placeholder}
        </span>
        <FaChevronDown
          className={`select-arrow ${open ? "rotated" : ""}`}
          size={14}
        />
      </div>

      {open && !disabled && (
        <div className="select-dropdown">
          {options.map((opt) => (
            <div
              key={opt.Link}
              className={`select-option ${
                value === opt.Link ? "selected" : ""
              }`}
              onClick={() => handleSelect(opt.Link)}
            >
              <span>{opt.Name}</span>
              {value === opt.Link && <FaCheck className="check-icon" />}
            </div>
          ))}
          {options.length === 0 && (
            <div className="select-empty">Немає варіантів</div>
          )}
        </div>
      )}
    </div>
  );
}
 