// utils.js
export const formatMoney = (amount) => {
  if (amount == null || isNaN(Number(amount))) return "0,00";

  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (val) => {
  return new Intl.NumberFormat("uk-UA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};
// utils.js
export const formatMoney2 = (amount, currency) => {
  // Якщо amount порожній (null, undefined), виводимо 0
  const val = amount ?? 0;
  
  // Якщо валюта не передана або порожня — ставимо "грн"
  let cleanCurrency = currency ? String(currency).trim() : "грн";

  try {
    // Спробуємо відформатувати як стандартний ISO код (UAH, USD...)
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: cleanCurrency,
      minimumFractionDigits: 0,
    }).format(val);
  } catch (e) {
    // Якщо Intl "плюється" на "грн", "грн м" або null:
    // Форматуємо тільки число (з пробілами між тисячами)
    const formattedAmount = new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 0,
    }).format(val);

    // Додаємо текст валюти вручну
    return `${formattedAmount} ${cleanCurrency}`;
  }
};