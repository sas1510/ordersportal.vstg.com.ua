
import i18n from "../hooks/i18n";

export const numToUAMoneyFormat = (num) => {
  if (!num) return "0 грн";
  return parseFloat(num).toLocaleString("uk-UA", {
    style: "currency",
    currency: "UAH",
  });
};

export const ifZero = (num) => (num === 0 ? "-" : num);

const resolveDateLocale = (lng = "uk") => {
  const normalizedLng = String(lng || "uk").toLowerCase();

  if (normalizedLng.startsWith("de")) return "de-DE";
  if (normalizedLng.startsWith("en")) return "en-GB";

  return "uk-UA";
};

const getCurrentLanguage = (lng) => {
  if (lng) return lng;
  return i18n.resolvedLanguage || i18n.language || "uk";
};

export const formatDate = (input) => {
  if (!input || input === "Не вказано") return "Не вказано";

  try {
    // Якщо це формат типу "24.09.2025 00:00:00"
    if (/^\d{2}\.\d{2}\.\d{4}/.test(input)) {
      return input.split(" ")[0]; 
    }

    // Якщо це формат ISO ("2025-09-24T00:00:00")
    const date = new Date(input);
    if (!isNaN(date)) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }


    return "Не вказано";
  } catch {
    return "Не вказано";
  }
};

export const formatDateHuman = (dateStr, lng) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;

  const locale = resolveDateLocale(getCurrentLanguage(lng));

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const formatDateHumanShorter_full = (dateStr, lng) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;

  // Форматуємо відповідно до мови
  return date.toLocaleString(resolveDateLocale(getCurrentLanguage(lng)), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


export const formatDateHuman_ln = (dateStr, locale) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const formatDateHumanShorter = (dateStr, lng) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;

  return date.toLocaleDateString(resolveDateLocale(getCurrentLanguage(lng)), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};



export const formatDateTimeCustom = (input) => {
  if (!input || input === "Не вказано") return "Не вказано";

  const date = new Date(input);


  if (isNaN(date)) return "Не вказано";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} | ${hours}:${minutes}`;
};

export const formatDateTimeShort = (input, lng = "uk") => {

  const normalizedLng = String(lng || "uk").toLowerCase();
  const currentLocale = resolveDateLocale(normalizedLng);
  
 
  const fallback = normalizedLng.startsWith("de")
    ? "Nicht angegeben"
    : normalizedLng.startsWith("en")
      ? "Not specified"
      : "Не вказано";

  if (!input || input === "Не вказано" || input === "Not specified") {
    return fallback;
  }

  const date = new Date(input);
  if (isNaN(date)) return fallback;

 
  const datePart = date.toLocaleDateString(currentLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });


  const timePart = date.toLocaleTimeString(currentLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: normalizedLng.startsWith("en"), 
  });

  return `${datePart} ${timePart}`;
};

export const formatDateTimeCustomShort = (input) => {
  if (!input || input === "Не вказано") return "Не вказано";

  const date = new Date(input);


  if (isNaN(date)) return "Не вказано";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} ${day}.${month}.${year}`;
};
