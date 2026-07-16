import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const supportedLngs = ["uk", "en", "de"];
const fallbackLng = "uk";

const getTranslationsVersion = () => {
  if (typeof window === "undefined") {
    return "static";
  }

  return localStorage.getItem("app_version") || "static";
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng,
    supportedLngs,
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: (lngs, namespaces) => {
        const lng = Array.isArray(lngs) ? lngs[0] : lngs;
        const ns = Array.isArray(namespaces) ? namespaces[0] : namespaces;
        const version = encodeURIComponent(getTranslationsVersion());
        return `/locales/${lng}/${ns}.json?v=${version}`;
      },
    },
    detection: {
      order: ["querystring", "localStorage", "navigator", "htmlTag"],
      lookupQuerystring: "lang",
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.resolvedLanguage || fallbackLng;
}

export default i18n;
