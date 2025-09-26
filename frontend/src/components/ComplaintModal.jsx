import React from "react";

const ComplaintModal = ({ complaint, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-y-auto max-h-[90vh] p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4 text-[#004080]">
          Деталі рекламації :: {complaint.WebNumber || "-"} :: ({complaint.OrderNumber}) {complaint.FullName}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <p><strong>Статус:</strong> {complaint.StatusName}</p>
          <p><strong>Дата рекламації:</strong> {new Date(complaint.ComplaintDate).toLocaleDateString()}</p>
          <p><strong>Опис:</strong> {complaint.DescriptionComplaint}</p>
          <p><strong>Рішення:</strong> {complaint.IssueName || complaint.SolutionName || "-"}</p>
          <p><strong>Менеджер:</strong> {complaint.LastManagerName || "-"}</p>
        </div>
        <h3 className="font-semibold mb-2">Фото:</h3>
        {complaint.PhotoLinks ? (
          <div className="flex flex-wrap gap-2">
            {complaint.PhotoLinks.split(",").map((url, idx) => {
              const fullUrl = `/media/${url.trim()}`;
              return (
                <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={fullUrl}
                    alt={`Фото ${idx + 1}`}
                    className="w-32 h-32 object-cover rounded-md border hover:opacity-80 transition"
                  />
                </a>
              );
            })}
          </div>
        ) : (
          <p>Фото відсутні</p>
        )}
      </div>
    </div>
  );
};

export default ComplaintModal;
