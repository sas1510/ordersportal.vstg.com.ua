
import React from "react";

const getStatusClass = (statusName) => {
  switch (statusName) {
    case "Завантажено":
      return "text-green-700 font-semibold";
    case "Очікує підтвердження":
      return "text-yellow-700 font-semibold";
    case "Відхилено":
      return "text-red-700 font-semibold";
    case "Виконано":
      return "text-blue-700 font-semibold";
    default:
      return "text-gray-700";
  }
};

const ComplaintDetails = ({ complaint }) => {
  return (
    <div className="mt-4 border-t pt-3 text-sm text-gray-700">
      <p><strong>Статус:</strong> <span className={getStatusClass(complaint.StatusName)}>{complaint.StatusName}</span></p>
      <p><strong>Дата рекламації:</strong> {complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString() : "-"}</p>
      <p><strong>Дата визначення:</strong> {complaint.OrderDefineDate ? new Date(complaint.OrderDefineDate).toLocaleDateString() : "-"}</p>
      <p><strong>Дата готовності:</strong> {complaint.DataComplete ? new Date(complaint.DataComplete).toLocaleDateString() : "-"}</p>

      <p className="mt-2"><strong>Серії:</strong></p>
      <ul className="list-disc list-inside">
        {complaint.SeriesList
          ? String(complaint.SeriesList).split(",").map((s, idx) => <li key={idx}>{s.trim()}</li>)
          : <li>-</li>}
      </ul>

      <p className="mt-2"><strong>Опис:</strong> {complaint.DescriptionComplaint || "-"}</p>
      <p><strong>Вирішення:</strong> {complaint.IssueName || complaint.SolutionName || "-"}</p>
      <p><strong>Менеджер:</strong> {complaint.LastManagerName || "-"}</p>

      {complaint.PhotoLinks && (
        <div className="mt-3">
          <h4 className="font-semibold">Фото:</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {String(complaint.PhotoLinks).split(",").map((url, idx) => {
              const fullUrl = `/media/${url.trim()}`;
              return (
                <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <img src={fullUrl} alt={`Фото ${idx + 1}`} className="w-24 h-24 object-cover rounded border" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
