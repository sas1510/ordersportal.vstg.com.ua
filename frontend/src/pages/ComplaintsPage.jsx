// import React, { useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";

// // Приклад даних (запит замінити на axios/fetch)
// const complaintsData = {
//   total: 12249,
//   rows: [
//     {
//       ComplaintId: 22259,
//       ComplaintDate: "06.08.2025 10:28",
//       ComplaintOrderNumber: "45-127282",
//       ComplaintDescription:
//         "В даних дверях, в робочій створці потік піскоструй. Відео надсилаю на вайбер. Дарій І",
//       CustomerName: "Магазин Рута",
//       ComplaintIssue: "Замінити склопакет за рахунок виробника",
//       StatusName: "Завантажено",
//       OrganizationName: "ВікнаСтиль",
//     },
//     {
//       ComplaintId: 22258,
//       ComplaintDate: "06.08.2025 09:16",
//       ComplaintOrderNumber: "45-142526",
//       ComplaintDescription: "Відсутня конструкція",
//       CustomerName: "Терен Сергій",
//       ComplaintIssue: "Доукомплектувати замовлення за рахунок виробника",
//       StatusName: "Завантажено",
//       OrganizationName: "ВікнаСтиль",
//     },
//     // ... інші записи
//   ],
// };

// const getStatusClass = (statusName) => {
//   switch (statusName) {
//     case "Завантажено":
//       return "text-green-600 font-bold";
//     case "Очікує підтвердження":
//       return "text-yellow-600 font-semibold";
//     case "Відхилено":
//       return "text-red-600 font-bold";
//     case "Виконано":
//       return "text-blue-600 font-semibold";
//     default:
//       return "text-gray-800";
//   }
// };


// const ComplaintsPage = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortConfig, setSortConfig] = useState({
//     key: "ComplaintId",
//     ascending: true,
//   });
//   const [statusFilter, setStatusFilter] = useState("");

//   // Фільтрація по пошуку та статусу
//   const filteredData = useMemo(() => {
//     return complaintsData.rows.filter((complaint) => {
//       const matchesSearch =
//         !searchTerm ||
//         Object.values(complaint).some((val) =>
//           val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
//         );

//       const matchesStatus = !statusFilter || complaint.StatusName === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [searchTerm, statusFilter]);

//   // Сортування
//   const sortedData = useMemo(() => {
//     const sorted = [...filteredData];
//     const { key, ascending } = sortConfig;

//     sorted.sort((a, b) => {
//       let valA = a[key];
//       let valB = b[key];

//       // Спроба парсити дати
//       if (key.toLowerCase().includes("date")) {
//         valA = new Date(valA);
//         valB = new Date(valB);
//       }

//       if (typeof valA === "number" && typeof valB === "number") {
//         return ascending ? valA - valB : valB - valA;
//       }

//       valA = valA ? valA.toString() : "";
//       valB = valB ? valB.toString() : "";

//       return ascending
//         ? valA.localeCompare(valB, undefined, { numeric: true })
//         : valB.localeCompare(valA, undefined, { numeric: true });
//     });

//     return sorted;
//   }, [filteredData, sortConfig]);

//   // Обробник сортування по колонці
//   const onSortClick = (key) => {
//     setSortConfig((prev) => {
//       if (prev.key === key) {
//         return { key, ascending: !prev.ascending };
//       }
//       return { key, ascending: true };
//     });
//   };

//   const renderSortArrow = (key) => {
//     if (sortConfig.key !== key) return " ⇅";
//     return sortConfig.ascending ? " ▲" : " ▼";
//   };

//   // Отримати унікальні статуси для фільтру
//   const statusOptions = [...new Set(complaintsData.rows.map((c) => c.StatusName))];
//   const navigate = useNavigate();

//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   return (
//     <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
//       <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
//         Рекламації
//       </h1>
//       {/* <div className="flex justify-between items-center mb-6"> */}
//         {isDealer && (
//           <button
//             onClick={() => navigate("/addClaim")}
//             className="bg-gradient-to-r from-[#3b82f6] mb-6 to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
//           >
//             ➕ Додати рекламацію
//           </button>
//         )}
//       {/* </div> */}

//       <div className="mb-6 flex flex-wrap gap-4 items-center">
//         <input
//           type="text"
//           placeholder="Пошук по всіх полях"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="flex-grow max-w-md border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//         />
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//         >
//           <option value="">Всі статуси</option>
//           {statusOptions.map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>
//       </div>

//       <table className="min-w-[900px] w-full border-collapse border border-gray-400">
//         <thead className="bg-gray-200 select-none">
//           <tr>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("ComplaintId")}
//               title="Сортувати за №"
//             >
//               №{renderSortArrow("ComplaintId")}
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("ComplaintOrderNumber")}
//               title="Сортувати за Номер"
//             >
//               <div className="flex items-center gap-2 whitespace-nowrap">
//                 <span>Номер</span>
//                 <span className="inline-flex items-center w-4 h-4">
//                   {renderSortArrow("ComplaintOrderNumber")}
//                 </span>
//               </div>
//             </th>


//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("ComplaintDate")}
//               title="Сортувати за датою"
//             >
//               Дата{renderSortArrow("ComplaintDate")}
//             </th>
//             <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-800">
//               Коментар
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("CustomerName")}
//               title="Сортувати за контрагентом"
//             >
//               <div className="flex items-center gap-2 whitespace-nowrap">
//               Контрагент{renderSortArrow("CustomerName")}
//               </div>
//             </th>
//             <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-800">
//               Вирішення
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("StatusName")}
//               title="Сортувати за статусом"
//             >
//               Статус{renderSortArrow("StatusName")}
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedData.length === 0 ? (
//             <tr>
//               <td colSpan="7" className="text-center p-4 text-gray-600 text-lg font-medium">
//                 Немає даних
//               </td>
//             </tr>
//           ) : (
//             sortedData.map((item, idx) => (
//               <tr
//                 key={item.ComplaintId}
//                 className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}
//               >
//                 <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
//                   {item.ComplaintId}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
//                   {item.ComplaintOrderNumber}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
//                   {item.ComplaintDate}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-gray-700  ">
//                   {item.ComplaintDescription}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-gray-800">
//                   {item.CustomerName}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-gray-700">
//                   {item.ComplaintIssue}
//                 </td>
//                 <td className={`border border-gray-300 px-3 py-2 text-base font-semibold ${getStatusClass(item.StatusName)}`}>
//                   {item.StatusName}
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       <p className="mt-6 text-gray-900 text-lg font-semibold">
//         Всього рекламацій: {sortedData.length}
//       </p>
//     </div>
//   );
// };

// export default ComplaintsPage;


// з беком 

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios"; // твій налаштований axios

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
  const navigate = useNavigate();
  const [complaintsData, setComplaintsData] = useState({ rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "ComplaintId",
    ascending: true,
  });
  const [statusFilter, setStatusFilter] = useState("");

  const role = localStorage.getItem("role");
  const isDealer = role === "Dealer";

  // Завантаження даних з бекенду
  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/complaints/issues"); // твій ендпоінт
        if (res.data && Array.isArray(res.data.rows)) {
          setComplaintsData({ rows: res.data.rows });
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
  }, []);

  // Унікальні статуси
  const statusOptions = useMemo(() => {
    return [...new Set(complaintsData.rows.map((c) => c.StatusName))];
  }, [complaintsData.rows]);

  // Фільтрація
  const filteredData = useMemo(() => {
    return complaintsData.rows.filter((complaint) => {
      const matchesSearch =
        !searchTerm ||
        Object.values(complaint).some((val) =>
          val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = !statusFilter || complaint.StatusName === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, complaintsData.rows]);

  // Сортування
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    const { key, ascending } = sortConfig;

    sorted.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key.toLowerCase().includes("date")) {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return ascending ? valA - valB : valB - valA;
      }

      valA = valA ? valA.toString() : "";
      valB = valB ? valB.toString() : "";

      return ascending
        ? valA.localeCompare(valB, undefined, { numeric: true })
        : valB.localeCompare(valA, undefined, { numeric: true });
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const onSortClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, ascending: !prev.ascending };
      }
      return { key, ascending: true };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return " ⇅";
    return sortConfig.ascending ? " ▲" : " ▼";
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Рекламації
      </h1>

      {isDealer && (
        <button
          onClick={() => navigate("/addClaim")}
          className="bg-gradient-to-r from-[#3b82f6] mb-6 to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
        >
          ➕ Додати рекламацію
        </button>
      )}

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Пошук по всіх полях"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">Всі статуси</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
            <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
          </div>
      ) : error ? (
        <p className="text-center text-lg text-red-600 py-10">{error}</p>
      ) : (
        <>
          <table className="min-w-[900px] w-full border-collapse border border-gray-400">
            <thead className="bg-gray-200 select-none">
              <tr>
                <th
                  className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
                  onClick={() => onSortClick("ComplaintId")}
                  title="Сортувати за №"
                >
                  №{renderSortArrow("ComplaintId")}
                </th>
                <th
                  className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
                  onClick={() => onSortClick("ComplaintOrderNumber")}
                  title="Сортувати за Номер"
                >
                  Номер{renderSortArrow("ComplaintOrderNumber")}
                </th>
                <th
                  className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
                  onClick={() => onSortClick("ComplaintDate")}
                  title="Сортувати за датою"
                >
                  Дата{renderSortArrow("ComplaintDate")}
                </th>
                <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-800">
                  Коментар
                </th>
                <th
                  className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
                  onClick={() => onSortClick("CustomerName")}
                  title="Сортувати за контрагентом"
                >
                  Контрагент{renderSortArrow("CustomerName")}
                </th>
                <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-800">
                  Вирішення
                </th>
                <th
                  className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
                  onClick={() => onSortClick("StatusName")}
                  title="Сортувати за статусом"
                >
                  Статус{renderSortArrow("StatusName")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-600 text-lg font-medium">
                    Немає даних
                  </td>
                </tr>
              ) : (
                sortedData.map((item, idx) => (
                  <tr
                    key={item.ComplaintId}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
                      {item.ComplaintId}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
                      {item.ComplaintOrderNumber}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
                      {item.ComplaintDate}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {item.ComplaintDescription}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-800">
                      {item.CustomerName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {item.ComplaintIssue}
                    </td>
                    <td
                      className={`border border-gray-300 px-3 py-2 text-base font-semibold ${getStatusClass(
                        item.StatusName
                      )}`}
                    >
                      {item.StatusName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="mt-6 text-gray-900 text-lg font-semibold">
            Всього рекламацій: {sortedData.length}
          </p>
        </>
      )}
    </div>
  );
};

export default ComplaintsPage;
