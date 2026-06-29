import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = (i18n.resolvedLanguage || i18n.language || "uk").slice(0, 2);

  const languages = [
    { code: "uk", label: "UA" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
  ];

  const currentLabel =
    languages.find((l) => l.code === current)?.label || "UA";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("portal_language", code);
    setOpen(false);
  };

  return (
    <div className="language-dropdown" ref={ref}>
      <button
        type="button"
        className="language-dropdown-btn"
        onClick={() => setOpen((prev) => !prev)}
      >
        {currentLabel}
        <span className={open ? "language-arrow open" : "language-arrow"}>
          ▾
        </span>
      </button>

      {open && (
        <div className="language-dropdown-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={
                lang.code === current
                  ? "language-dropdown-item active"
                  : "language-dropdown-item"
              }
              onClick={() => changeLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}