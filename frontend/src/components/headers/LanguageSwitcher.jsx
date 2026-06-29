import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "uk", label: "UA" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "uk").slice(0, 2);

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-300 bg-white/90 p-1 shadow-sm ${className}`.trim()}
      role="group"
      aria-label="Language switcher"
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = currentLanguage === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors ${
              isActive
                ? "bg-[#6B98BF] text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
