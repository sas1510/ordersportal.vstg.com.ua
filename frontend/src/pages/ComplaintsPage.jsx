import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import "datatables.net";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom"; 

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

const ComplaintsPage = () => {
  const [complaintsData, setComplaintsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const tableRef = useRef();
  const navigate = useNavigate(); // хук для переходу

  const role = localStorage.getItem("role");
  const isDealer = role === "customer";

  // Завантаження рекламацій
  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/complaints/complaints-full/", {
          params: { with_dealer: isDealer },
        });
        if (Array.isArray(res.data)) {
          setComplaintsData(res.data);
        } else {
          setError("Невірний формат даних від сервера");
        }
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні рекламацій");
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [isDealer]);

  // Ініціалізація DataTable
  useEffect(() => {
    if (!loading && complaintsData.length > 0) {
      $(tableRef.current).DataTable({
        pageLength: 10,
        lengthChange: false,
        responsive: true,
      });
    }

    return () => {
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy(true);
      }
    };
  }, [loading, complaintsData]);

  if (loading) return <p className="text-center py-10">Завантаження...</p>;
  if (error) return <p className="text-center py-10 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto bg-gray-50 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">Рекламації</h1>

      {/* Кнопка додати рекламацію для дилера */}
      {isDealer && (
        <div className="mb-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            onClick={() => navigate("/addClaim")}
          >
            Додати рекламацію
          </button>
        </div>
      )}
      <table ref={tableRef} className="display stripe hover min-w-full text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th>№</th>
            <th>Номер</th>
            <th>Дата</th>
            <th>Коментар</th>
            <th>Контрагент</th>
            <th>Вирішення</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {complaintsData.map((item, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? "bg-white cursor-pointer" : "bg-gray-50 cursor-pointer"}
              onClick={() => setSelectedComplaint(item)}
            >
              <td className="text-center">{item.WebNumber || "-"}</td>
              <td className="text-center">{item.OrderNumber}</td>
              <td className="text-center">{new Date(item.ComplaintDate).toLocaleDateString()}</td>
              <td>{item.DescriptionComplaint}</td>
              <td>{item.FullName}</td>
              <td>{item.IssueName || item.SolutionName}</td>
              <td className={getStatusClass(item.StatusName)}>{item.StatusName}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модалка */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-y-auto max-h-[90vh] p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              onClick={() => setSelectedComplaint(null)}
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-4 text-[#004080]">
              Деталі рекламації :: {selectedComplaint.WebNumber || "-"} :: ({selectedComplaint.OrderNumber}) {selectedComplaint.FullName}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <p>
                <strong>Статус:</strong>{" "}
                <span className={getStatusClass(selectedComplaint.StatusName)}>{selectedComplaint.StatusName}</span>
              </p>
              <p><strong>Номер:</strong> {selectedComplaint.OrderNumber}</p>
              <p><strong>Дата рекламації:</strong> {new Date(selectedComplaint.ComplaintDate).toLocaleDateString()}</p>
              <p>
                <strong>Дата доставки:</strong>{" "}
                {selectedComplaint.OrderDeliveDate ? new Date(selectedComplaint.OrderDeliveDate).toLocaleDateString() : "-"}
              </p>
              <p>
                <strong>Дата визначення:</strong>{" "}
                {selectedComplaint.OrderDefineDate ? new Date(selectedComplaint.OrderDefineDate).toLocaleDateString() : "-"}
              </p>
              <p>
                <strong>Дата готовності:</strong>{" "}
                {selectedComplaint.DataComplete ? new Date(selectedComplaint.DataComplete).toLocaleDateString() : "-"}
              </p>
            </div>

            <p className="mb-2"><strong>Серії конструкцій:</strong></p>
            <ul className="list-disc list-inside mb-4">
              {selectedComplaint.SeriesList ? (
                selectedComplaint.SeriesList
                  .split(",")
                  .map((series, idx) => <li key={idx}>{series.trim()}</li>)
              ) : (
                <li>-</li>
              )}
            </ul>

            <p className="mb-2"><strong>Опис рекламації:</strong> {selectedComplaint.DescriptionComplaint || "-"}</p>
            <p className="mb-2"><strong>Вирішення:</strong> {selectedComplaint.IssueName || selectedComplaint.SolutionName || "-"}</p>
            <p className="mb-2"><strong>Відповідальний менеджер:</strong> {selectedComplaint.LastManagerName || "-"}</p>

            {/* Галерея фото */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Фото рекламації:</h3>
              {selectedComplaint.PhotoLinks ? (
                <div className="flex flex-wrap gap-2">
                  {selectedComplaint.PhotoLinks.split(",").map((url, idx) => {
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
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
