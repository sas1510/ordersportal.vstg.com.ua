export const numToUAMoneyFormat = (num) => {
  if (!num) return '0 грн';
  return parseFloat(num)
    .toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' });
};

export const ifZero = (num) => (num === 0 ? '-' : num);

 export const formatDate = (input) => {
  if (!input || input === "Не вказано") return "Не вказано";

  try {
    // Якщо це формат типу "24.09.2025 00:00:00"
    if (/^\d{2}\.\d{2}\.\d{4}/.test(input)) {
      return input.split(' ')[0]; // обрізаємо все після пробілу
    }

    // Якщо це формат ISO ("2025-09-24T00:00:00")
    const date = new Date(input);
    if (!isNaN(date)) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    // fallback: якщо не змогли розпарсити
    return "Не вказано";
  } catch {
    return "Не вказано";
  }
};


 export const formatDateHuman = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

 export const formatDateHumanShorter = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };


  export const formatDateTimeCustom = (input) => {
    if (!input || input === "Не вказано") return "Не вказано";

    const date = new Date(input);
    
    // Перевірка на валідність дати
    if (isNaN(date)) return "Не вказано";

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} | ${hours}:${minutes}`;
  };


  export const formatDateTimeShort = (input) => {
    if (!input || input === "Не вказано") return "Не вказано";

    const date = new Date(input);
    if (isNaN(date)) return "Не вказано";

    // Отримуємо дату: "2 лют."
    const datePart = date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).replace('.', ''); // Прибираємо крапку після місяця, якщо вона не потрібна

    // Отримуємо час: "15:40"
    const timePart = date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart} ${timePart}`;
};