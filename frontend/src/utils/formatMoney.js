// utils.js
export const formatMoney = (amount) => {
  if (amount == null) return "0 грн";
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(amount);
};
