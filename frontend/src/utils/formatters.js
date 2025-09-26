export const numToUAMoneyFormat = (num) => {
  if (!num) return '0 грн';
  return parseFloat(num)
    .toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' });
};

export const ifZero = (num) => (num === 0 ? '-' : num);

export const formatDate = (dateStr, withTime = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (withTime) options.hour = '2-digit', options.minute = '2-digit';
  return date.toLocaleDateString('uk-UA', options);
};
та