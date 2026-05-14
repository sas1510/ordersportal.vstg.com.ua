// // import React, { useState, useEffect, useRef } from "react";
// // import { FaChevronDown, FaCheck } from "react-icons/fa";
// // import "./CustomSelect.css";

// // export default function CustomSelect({
// //   label,
// //   options = [],
// //   value,
// //   onChange,
// //   placeholder = "-- Оберіть --",
// //   disabled = false,
// // }) {
// //   const [open, setOpen] = useState(false);
// //   const ref = useRef(null);

// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   const handleSelect = (val) => {
// //     onChange(val);
// //     setOpen(false);
// //   };

// //   const selectedOption = options.find((o) => o.Link === value);

// //   return (
// //     <div className={`custom-select ${disabled ? "disabled" : ""}`} ref={ref}>
// //       {label && <span className="select-label">{label}</span>}

// //       <div
// //         className="select-control"
// //         onClick={() => !disabled && setOpen((p) => !p)}
// //       >
// //         <span
// //           className={`select-value ${!selectedOption ? "placeholder" : ""}`}
// //         >
// //           {selectedOption ? selectedOption.Name : placeholder}
// //         </span>
// //         <FaChevronDown
// //           className={`select-arrow ${open ? "rotated" : ""}`}
// //           size={14}
// //         />
// //       </div>

// //       {open && !disabled && (
// //         <div className="select-dropdown">
// //           {options.map((opt) => (
// //             <div
// //               key={opt.Link}
// //               className={`select-option ${
// //                 value === opt.Link ? "selected" : ""
// //               }`}
// //               onClick={() => handleSelect(opt.Link)}
// //             >
// //               <span>{opt.Name}</span>
// //               {value === opt.Link && <FaCheck className="check-icon" />}
// //             </div>
// //           ))}
// //           {options.length === 0 && (
// //             <div className="select-empty">Немає варіантів</div>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
// import React, { useState, useEffect, useRef } from "react";
// import { FaChevronDown, FaCheck } from "react-icons/fa";
// import { useTranslation } from "react-i18next"; // 🔥 Імпорт i18n
// import "./CustomSelect.css";

// export default function CustomSelect({
//   label,
//   options = [],
//   value,
//   onChange,
//   placeholder,
//   disabled = false,
// }) {
//   const { t } = useTranslation(); // 🔥 Хук перекладу
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   // Використовуємо переданий placeholder або беремо стандартний з i18n
//   const displayPlaceholder = placeholder || t("select.default_placeholder", { defaultValue: "-- Оберіть --" });

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSelect = (val) => {
//     onChange(val);
//     setOpen(false);
//   };

//   const selectedOption = options.find((o) => o.Link === value);

//   // Функція для отримання назви: шукає переклад у словнику, інакше повертає Name з бази
//   const getOptionName = (opt) => {
//     if (!opt) return "";
//     // Шукаємо в ключах "reasons.Назва" або просто повертаємо оригінал
//     return t(`reasons.${opt.Name}`, { defaultValue: opt.Name });
//   };

//   return (
//     <div className={`custom-select ${disabled ? "disabled" : ""}`} ref={ref}>
//       {label && <span className="select-label">{label}</span>}

//       <div
//         className="select-control"
//         onClick={() => !disabled && setOpen((p) => !p)}
//       >
//         <span
//           className={`select-value ${!selectedOption ? "placeholder" : ""}`}
//         >
//           {selectedOption ? getOptionName(selectedOption) : displayPlaceholder}
//         </span>
//         <FaChevronDown
//           className={`select-arrow ${open ? "rotated" : ""}`}
//           size={14}
//         />
//       </div>

//       {open && !disabled && (
//         <div className="select-dropdown">
//           {options.map((opt) => (
//             <div
//               key={opt.Link}
//               className={`select-option ${
//                 value === opt.Link ? "selected" : ""
//               }`}
//               onClick={() => handleSelect(opt.Link)}
//             >
//               <span>{getOptionName(opt)}</span>
//               {value === opt.Link && <FaCheck className="check-icon" />}
//             </div>
//           ))}
//           {options.length === 0 && (
//             <div className="select-empty">
//               {t("select.no_options", { defaultValue: "Немає варіантів" })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./CustomSelect.css";

export default function CustomSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const displayPlaceholder = placeholder || t("select.default_placeholder", { defaultValue: "-- Оберіть --" });

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

  // Функція для "розумного" перекладу назви
  const getTranslatedName = (name) => {
    if (!name) return "";
    // Ми створюємо ключ на основі назви, i18next автоматично підставить переклад
    // якщо він є у файлі, інакше поверне оригінал (defaultValue)
    return t(`reasons.${name}`, { defaultValue: name });
  };

  // Мемоїзуємо відсортовані та перекладені опції, щоб не перераховувати при кожному рендері
  const translatedOptions = useMemo(() => {
    return options.map(opt => ({
      ...opt,
      displayName: getTranslatedName(opt.Name)
    }));
  }, [options, i18n.language, t]);




  const selectedOption = translatedOptions.find((o) => o.Link === value);

  return (
    <div className={`custom-select ${disabled ? "disabled" : ""}`} ref={ref}>
      {label && <span className="select-label">{label}</span>}

      <div
        className="select-control"
        onClick={() => !disabled && setOpen((p) => !p)}
      >
        <span className={`select-value ${!selectedOption ? "placeholder" : ""}`}>
          {selectedOption ? selectedOption.displayName : displayPlaceholder}
        </span>
        <FaChevronDown
          className={`select-arrow ${open ? "rotated" : ""}`}
          size={14}
        />
      </div>

      {open && !disabled && (
        <div className="select-dropdown">
          {translatedOptions.map((opt) => (
            <div
              key={opt.Link}
              className={`select-option ${value === opt.Link ? "selected" : ""}`}
              onClick={() => handleSelect(opt.Link)}
            >
              <span>{opt.displayName}</span>
              {value === opt.Link && <FaCheck className="check-icon" />}
            </div>
          ))}
          {translatedOptions.length === 0 && (
            <div className="select-empty">
              {t("select.no_options", { defaultValue: "Немає варіантів" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}