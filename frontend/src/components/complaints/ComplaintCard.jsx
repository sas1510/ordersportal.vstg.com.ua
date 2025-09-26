
import React, { useState } from "react";
import ComplaintDetails from "./ComplaintDetails";

const getStatusClass = (statusName) => {
  switch (statusName) {
    case "Завантажено":
      return "bg-green-100 text-green-700";
    case "Очікує підтвердження":
      return "bg-yellow-100 text-yellow-700";
    case "Відхилено":
      return "bg-red-100 text-red-700";
    case "Виконано":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const ComplaintCard = ({ complaint }) => {
  const [showDetails, setShowDetails] = useState(false);
  const toggleDetails = () => setShowDetails(!showDetails);

  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">
          Рекламація № {String(complaint.WebNumber || "-")}
        </h3>
        <span className={`px-2 py-1 text-xs rounded ${getStatusClass(complaint.StatusName)}`}>
          {complaint.StatusName}
        </span>
      </div>
      <p className="text-sm text-gray-600">Замовлення: {String(complaint.OrderNumber || "-")}</p>
      <p className="text-sm text-gray-600">Дата: {complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString() : "-"}</p>
      <p className="text-sm text-gray-600">Контрагент: {complaint.FullName || "-"}</p>
      <button
        className="mt-3 text-blue-600 hover:underline text-sm"
        onClick={toggleDetails}
      >
        {showDetails ? "Сховати деталі" : "Деталі"}
      </button>

      {showDetails && <ComplaintDetails complaint={complaint} />}
    </div>
  );
};

export default ComplaintCard;
