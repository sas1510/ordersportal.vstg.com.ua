// import React, { useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";

// // Тимчасові дані
// const orderPartsData = {
//   total: 197,
//   rows: [
//     {
//       OrderPartsId: 1194,
//       Db1SOrderPartsNumbers: "70-29887",
//       OrderPartsDate: "05.08.2025 18:08",
//       OrderPartsItems: "Допи",
//       OrderPartsReason: "дозамовлення за рахунок замовника",
//       OrderPartsDescription:
//         "Розширювач 40/60 зовн антрацит з армуванням квадрат, довжиною 970мм",
//       ManagerName: "Назарова Яна",
//       CustomerName: "Гречковський Сергій",
//       StatusName: "Обробка",
//     },
//     {
//       OrderPartsId: 1193,
//       Db1SOrderPartsNumbers: "70-29885",
//       OrderPartsDate: "05.08.2025 17:05",
//       OrderPartsItems: "Набір фурнітури",
//       OrderPartsReason: "дозамовлення за рахунок замовника",
//       OrderPartsDescription: "петлі - 2шт. згідно замовлення",
//       ManagerName: "Горак Наталія",
//       CustomerName: "Марусяк Руслан",
//       StatusName: "В роботі",
//     },
//   ],
// };

// const getUniqueStatuses = (rows) => {
//   const statuses = rows.map((r) => r.StatusName);
//   return [...new Set(statuses)];
// };

// export default function AdditionalOrdersPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("Всі");
//   const [sortConfig, setSortConfig] = useState({
//     key: "Db1SOrderPartsNumbers",
//     ascending: true,
//   });
//   const navigate = useNavigate();

//   const statuses = useMemo(
//     () => ["Всі", ...getUniqueStatuses(orderPartsData.rows)],
//     []
//   );
//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   const filteredData = useMemo(() => {
//     let data = orderPartsData.rows;

//     if (selectedStatus !== "Всі") {
//       data = data.filter((item) => item.StatusName === selectedStatus);
//     }

//     if (searchTerm) {
//       data = data.filter((item) =>
//         Object.values(item).some(
//           (val) =>
//             val &&
//             val.toString().toLowerCase().includes(searchTerm.toLowerCase())
//         )
//       );
//     }

//     return data;
//   }, [searchTerm, selectedStatus]);

//   const sortedData = useMemo(() => {
//     const sorted = [...filteredData];
//     const { key, ascending } = sortConfig;

//     sorted.sort((a, b) => {
//       let valA = a[key];
//       let valB = b[key];

//       if (key.toLowerCase().includes("date")) {
//         valA = valA
//           ? new Date(valA.split(".").reverse().join("-"))
//           : new Date(0);
//         valB = valB
//           ? new Date(valB.split(".").reverse().join("-"))
//           : new Date(0);
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

//   const onSortClick = (key) => {
//     setSortConfig((prev) => {
//       if (prev.key === key) return { key, ascending: !prev.ascending };
//       return { key, ascending: true };
//     });
//   };

//   const renderSortArrow = (key) => {
//     if (sortConfig.key !== key) return " ⇅";
//     return sortConfig.ascending ? " ↑" : " ↓";
//   };

//   return (
//     <div className="p-6 max-w-screen-2xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">Дозамовлення</h1>
//       <div className="flex justify-between items-center mb-4">
//         {isDealer && (
//           <button
//             onClick={() => navigate("/addReorder")}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
//           >
//             ➕ Дозамовлення
//           </button>
//         )}
//       </div>

//       <div className="flex gap-4 mb-6 flex-wrap">
//         <input
//           type="text"
//           placeholder="Пошук по всіх полях"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="border rounded px-3 py-2 w-full max-w-md focus:ring focus:ring-blue-300"
//         />
//         <select
//           value={selectedStatus}
//           onChange={(e) => setSelectedStatus(e.target.value)}
//           className="border rounded px-3 py-2 max-w-xs focus:ring focus:ring-blue-300"
//         >
//           {statuses.map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="overflow-x-auto rounded-lg border border-gray-300 shadow">
//         <table className="min-w-full bg-white text-sm">
//           <thead className="bg-gray-200 text-gray-800">
//             <tr>
//               <th className="border px-3 py-2">№</th>
//               <th
//                 className="border px-3 py-2 cursor-pointer"
//                 onClick={() => onSortClick("Db1SOrderPartsNumbers")}
//               >
//                 Номер 1C{renderSortArrow("Db1SOrderPartsNumbers")}
//               </th>
//               <th
//                 className="border px-3 py-2 cursor-pointer"
//                 onClick={() => onSortClick("OrderPartsDate")}
//               >
//                 Дата{renderSortArrow("OrderPartsDate")}
//               </th>
//               <th className="border px-3 py-2">Товари</th>
//               <th className="border px-3 py-2">Причина</th>
//               <th className="border px-3 py-2">Опис</th>
//               <th
//                 className="border px-3 py-2 cursor-pointer"
//                 onClick={() => onSortClick("ManagerName")}
//               >
//                 Менеджер{renderSortArrow("ManagerName")}
//               </th>
//               <th
//                 className="border px-3 py-2 cursor-pointer"
//                 onClick={() => onSortClick("CustomerName")}
//               >
//                 Клієнт{renderSortArrow("CustomerName")}
//               </th>
//               <th
//                 className="border px-3 py-2 cursor-pointer"
//                 onClick={() => onSortClick("StatusName")}
//               >
//                 Статус{renderSortArrow("StatusName")}
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {sortedData.length === 0 ? (
//               <tr>
//                 <td colSpan="9" className="text-center p-4 text-gray-500">
//                   Немає даних
//                 </td>
//               </tr>
//             ) : (
//               sortedData.map((item, idx) => {
//                 const [date, time] = item.OrderPartsDate.split(" ");
//                 return (
//                   <tr
//                     key={item.OrderPartsId}
//                     className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
//                   >
//                     <td className="border px-3 py-2 text-center">{idx + 1}</td>
//                     <td className="border px-3 py-2 text-center font-medium text-blue-600">
//                       {item.Db1SOrderPartsNumbers}
//                     </td>
//                     <td className="border px-3 py-2 text-center">
//                       <div className="flex flex-col">
//                         <span className="font-semibold">{date}</span>
//                         <span className="text-xs text-gray-500">{time}</span>
//                       </div>
//                     </td>
//                     <td className="border px-3 py-2">{item.OrderPartsItems}</td>
//                     <td className="border px-3 py-2">{item.OrderPartsReason}</td>
//                     <td className="border px-3 py-2">{item.OrderPartsDescription}</td>
//                     <td className="border px-3 py-2">{item.ManagerName}</td>
//                     <td className="border px-3 py-2">{item.CustomerName}</td>
//                     <td
//                       className={`border px-3 py-2 font-semibold ${
//                         item.StatusName === "Обробка"
//                           ? "text-yellow-600"
//                           : "text-green-600"
//                       }`}
//                     >
//                       {item.StatusName}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       <p className="mt-4 text-gray-600">
//         Всього дозамовлень: {sortedData.length}
//       </p>
//     </div>
//   );
// }
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const orderPartsData = {
  total: 197,
  rows: [
    {
      OrderPartsId: 1194,
      Db1SOrderPartsNumbers: "70-29887",
      OrderPartsDate: "05.08.2025 18:08",
      OrderPartsItems: "Допи",
      OrderPartsReason: "Дозамовлення за рахунок замовника",
      StatusName: "В обробці",
    },
    {
      OrderPartsId: 1195,
      Db1SOrderPartsNumbers: "70-29888",
      OrderPartsDate: "06.08.2025 12:15",
      OrderPartsItems: "Ручки",
      OrderPartsReason: "Гарантія",
      StatusName: "Виконано",
    },
  ],
};

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


const OrderPartsPage = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "OrderPartsId",
    ascending: true,
  });

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(orderPartsData.rows.map((o) => o.StatusName)));
  }, []);

  const filteredData = useMemo(() => {
    return orderPartsData.rows.filter((part) => {
      const matchesStatus =
        statusFilter === "" || part.StatusName === statusFilter;
      if (!matchesStatus) return false;

      if (!searchTerm) return true;

      return Object.values(part).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, statusFilter]);

  const sortableColumns = [
    "OrderPartsId",
    "Db1SOrderPartsNumbers",
    "OrderPartsDate",
    "OrderPartsItems",
  ];

  const sortedData = useMemo(() => {
    if (!sortableColumns.includes(sortConfig.key)) return filteredData;
    const sorted = [...filteredData];
    const { key, ascending } = sortConfig;

    sorted.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key.toLowerCase().includes("date")) {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
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
    if (!sortableColumns.includes(key)) return;
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

  const role = localStorage.getItem("role");
  const isDealer = role === "Dealer";

  return (
    <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Дозамовлення
      </h1>
       {/* <div className="flex justify-between items-center mb-4"> */}
        {isDealer && (
          <button
            onClick={() => navigate("/addReorder")}
            className="mb-6 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
          >
            ➕ Дозамовлення
          </button>
        )}
      {/* </div> */}

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
          <option value="">Усі статуси</option>
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <table className="min-w-[800px] w-full border-collapse border border-gray-400">
        <thead className="bg-gray-200 select-none">
          <tr>
            <th
              className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
              onClick={() => onSortClick("OrderPartsId")}
            >
              № {renderSortArrow("OrderPartsId")}
            </th>
            <th
              className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
              onClick={() => onSortClick("Db1SOrderPartsNumbers")}
            >
              № 1С {renderSortArrow("Db1SOrderPartsNumbers")}
            </th>
            <th
              className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
              onClick={() => onSortClick("OrderPartsDate")}
            >
              Дата {renderSortArrow("OrderPartsDate")}
            </th>
            <th
              className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
              onClick={() => onSortClick("OrderPartsItems")}
            >
              Найменування {renderSortArrow("OrderPartsItems")}
            </th>
            <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
              Причина
            </th>
            <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
              Статус
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center p-4 text-gray-600 text-lg">
                Немає даних
              </td>
            </tr>
          ) : (
            sortedData.map((part, index) => (
              <tr
                key={part.OrderPartsId}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
              >
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {part.OrderPartsId}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {part.Db1SOrderPartsNumbers}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {part.OrderPartsDate}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {part.OrderPartsItems}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {part.OrderPartsReason}
                </td>
                 <td className={`border border-gray-300 px-3 py-2 text-base font-semibold ${getStatusClass(part.StatusName)}`}>
                  {part.StatusName}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-6 text-gray-900 text-lg font-semibold">
        Всього: {sortedData.length}
      </p>
    </div>
  );
};

export default OrderPartsPage;


// з беком 

// import React, { useState, useMemo, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosInstance from "../api/axios";

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

// const OrderPartsPage = () => {
//   const navigate = useNavigate();

//   const [orderPartsData, setOrderPartsData] = useState({ rows: [] });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sortConfig, setSortConfig] = useState({
//     key: "OrderPartsId",
//     ascending: true,
//   });

//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   useEffect(() => {
//     const fetchOrderParts = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const res = await axiosInstance.get("/order-parts"); // твій бекенд ендпоінт
//         if (res.data && Array.isArray(res.data.rows)) {
//           setOrderPartsData({ rows: res.data.rows });
//         } else {
//           setError("Невірний формат даних від сервера");
//         }
//       } catch (err) {
//         console.error(err);
//         setError("Помилка при завантаженні дозамовлень");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderParts();
//   }, []);

//   const uniqueStatuses = useMemo(() => {
//     return Array.from(new Set(orderPartsData.rows.map((o) => o.StatusName)));
//   }, [orderPartsData.rows]);

//   const filteredData = useMemo(() => {
//     return orderPartsData.rows.filter((part) => {
//       const matchesStatus =
//         statusFilter === "" || part.StatusName === statusFilter;
//       if (!matchesStatus) return false;

//       if (!searchTerm) return true;

//       return Object.values(part).some(
//         (value) =>
//           value &&
//           value.toString().toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     });
//   }, [searchTerm, statusFilter, orderPartsData.rows]);

//   const sortableColumns = [
//     "OrderPartsId",
//     "Db1SOrderPartsNumbers",
//     "OrderPartsDate",
//     "OrderPartsItems",
//   ];

//   const sortedData = useMemo(() => {
//     if (!sortableColumns.includes(sortConfig.key)) return filteredData;
//     const sorted = [...filteredData];
//     const { key, ascending } = sortConfig;

//     sorted.sort((a, b) => {
//       let valA = a[key];
//       let valB = b[key];

//       if (key.toLowerCase().includes("date")) {
//         valA = valA ? new Date(valA) : new Date(0);
//         valB = valB ? new Date(valB) : new Date(0);
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

//   const onSortClick = (key) => {
//     if (!sortableColumns.includes(key)) return;
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

//   return (
//     <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
//       <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
//         Дозамовлення
//       </h1>

//       {isDealer && (
//         <button
//           onClick={() => navigate("/addReorder")}
//           className="mb-6 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
//         >
//           ➕ Дозамовлення
//         </button>
//       )}

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
//           <option value="">Усі статуси</option>
//           {uniqueStatuses.map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <p className="text-center text-lg text-gray-600 py-10">Завантаження...</p> // текст
          // <div className="flex justify-center items-center py-10"> //спінер
          //     <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
          //   </div>
//       ) : error ? (
//         <p className="text-center text-lg text-red-600 py-10">{error}</p>
//       ) : (
//         <>
//           <table className="min-w-[800px] w-full border-collapse border border-gray-400">
//             <thead className="bg-gray-200 select-none">
//               <tr>
//                 <th
//                   className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//                   onClick={() => onSortClick("OrderPartsId")}
//                 >
//                   № {renderSortArrow("OrderPartsId")}
//                 </th>
//                 <th
//                   className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//                   onClick={() => onSortClick("Db1SOrderPartsNumbers")}
//                 >
//                   № 1С {renderSortArrow("Db1SOrderPartsNumbers")}
//                 </th>
//                 <th
//                   className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//                   onClick={() => onSortClick("OrderPartsDate")}
//                 >
//                   Дата {renderSortArrow("OrderPartsDate")}
//                 </th>
//                 <th
//                   className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//                   onClick={() => onSortClick("OrderPartsItems")}
//                 >
//                   Найменування {renderSortArrow("OrderPartsItems")}
//                 </th>
//                 <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
//                   Причина
//                 </th>
//                 <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
//                   Статус
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {sortedData.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="text-center p-4 text-gray-600 text-lg">
//                     Немає даних
//                   </td>
//                 </tr>
//               ) : (
//                 sortedData.map((part, index) => (
//                   <tr
//                     key={part.OrderPartsId}
//                     className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
//                   >
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {part.OrderPartsId}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {part.Db1SOrderPartsNumbers}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {part.OrderPartsDate}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2">
//                       {part.OrderPartsItems}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2">
//                       {part.OrderPartsReason}
//                     </td>
//                     <td className={`border border-gray-300 px-3 py-2 text-base font-semibold ${getStatusClass(part.StatusName)}`}>
//                       {part.StatusName}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>

//           <p className="mt-6 text-gray-900 text-lg font-semibold">
//             Всього: {sortedData.length}
//           </p>
//         </>
//       )}
//     </div>
//   );
// };

// export default OrderPartsPage;
