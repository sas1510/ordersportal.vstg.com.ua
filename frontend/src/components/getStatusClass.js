const getStatusClass = (statusName) => {
  switch (statusName) {
    case "Завантажено":
      return "text-green-600 font-bold";
    case "Очікує підтвердження":
      return "text-yellow-600 font-semibold";
    case "Відхилено":
      return "text-red-600 font-bold";
    case "Виконано":
      return "text-blue-600 font-semibold";
    default:
      return "text-gray-800";
  }
};

export default getStatusClass;
