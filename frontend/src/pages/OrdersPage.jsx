// import React, { useState, useMemo } from "react";
// import axiosInstance from "../api/axios";
// import { useNavigate } from "react-router-dom";

// const OrdersPage = () => {
//   const navigate = useNavigate();

//   const data = {
//     total: 157759,
//     rows: [
//       {
//         OrderId: 207316,
//         OrderNumber: "365",
//         Db1SOrderNumbers: [],
//         OrderDateCreate: "06.08.2025 11:19",
//         OrderDateProgress: "",
//         OrderDateComplete: "",
//         ManagerName: "Горак Наталія",
//         ManagerId: "d1c1cf21-e8d5-425f-a504-7bd17d155aa6",
//         CustomerName: "Піцик Юлія",
//         CustomerId: "e5b53a5a-2b41-4da0-bed2-38896ee79eca",
//         File: "/Files/Orders/e5b53a5a-2b41-4da0-bed2-38896ee79eca/%d0%96%d0%b8%d0%bd%d0%b6%d0%b0%d1%80%20%d0%92%d1%8f%d1%87%d0%b5%d1%81%d0%bb%d0%b0%d0%b2.ZKZ",
//         StatusName: "Завантажено",
//         StatusId: 1,
//         OrganizationName: "ВікнаСтиль",
//         OrderNumberContructions: 1,
//         LastMessage: "Доставка на Миколаївську",
//         LastMessageWriter: "Піцик Юлія",
//         LastMessageTime: "06.08.2025 11:19",
//         AllOrderDatePlainText: "06.08.2025 11:19",
//       },
//       {
//         OrderId: 207301,
//         OrderNumber: "5014",
//         Db1SOrderNumbers: ["45-144227"],
//         OrderDateCreate: "05.08.2025 17:52",
//         OrderDateProgress: "06.08.2025 11:17",
//         OrderDateComplete: "",
//         ManagerName: "Горак Наталія",
//         ManagerId: "d1c1cf21-e8d5-425f-a504-7bd17d155aa6",
//         CustomerName: "Александрюк Микола",
//         CustomerId: "c34e1a72-98d2-4407-83ac-91ab4ef38910",
//         File: "/Files/Orders/c34e1a72-98d2-4407-83ac-91ab4ef38910/%d0%9e%d0%ba%d1%81%d0%b0%d0%bd%d0%b0(19).ZKZ",
//         StatusName: "Очікує підтвердження",
//         StatusId: 23,
//         OrganizationName: "ВікнаСтиль",
//         OrderNumberContructions: 3,
//         LastMessage: "змінено ручку на Аксор",
//         LastMessageWriter: "Менеджер",
//         LastMessageTime: "06.08.2025 11:17",
//         AllOrderDatePlainText: "05.08.2025 17:52, 06.08.2025 11:17",
//       },
//     ],
//   };

//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sortConfig, setSortConfig] = useState({
//     key: "OrderNumber",
//     ascending: true,
//   });

//   const fetchCommentHistory = async (orderId) => {
//     try {
//       const res = await axiosInstance.post("/comments/order", { orderId });
//       if (!Array.isArray(res.data)) {
//         throw new Error("Невірний формат відповіді");
//       }
//       alert(`Історія коментарів для замовлення #${orderId} завантажена`);
//     } catch (err) {
//       console.error(err);
//       alert("Помилка при завантаженні історії коментарів");
//     }
//   };

//   const uniqueStatuses = useMemo(() => {
//     const setStatuses = new Set(data.rows.map((o) => o.StatusName));
//     return Array.from(setStatuses);
//   }, [data.rows]);

//   const filteredData = useMemo(() => {
//     return data.rows.filter((order) => {
//       const matchesStatus =
//         statusFilter === "" || order.StatusName === statusFilter;
//       if (!matchesStatus) return false;

//       if (!searchTerm) return true;

//       return Object.values(order).some(
//         (value) =>
//           value &&
//           value.toString().toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     });
//   }, [searchTerm, statusFilter, data.rows]);

//   const sortableColumns = [
//     "OrderId",
//     "OrderNumber",
//     "OrderNumberContructions",
//     "OrderDateCreate",
//     "CustomerName",
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
//         Замовлення
//       </h1>

//       {isDealer && (
//         <button
//           onClick={() => navigate("/addOrder")}
//           className="mb-6 bg-gradient-to-r from-[#0073e6] to-[#004080] hover:from-[#0059b3] hover:to-[#003366] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
//         >
//           ➕ Додати замовлення
//         </button>
//       )}

//       <div className="mb-6 flex flex-wrap gap-4 items-center">
//         <input
//           type="text"
//           placeholder="Пошук по всіх полях"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="flex-grow max-w-md border border-[#004080] rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#66a3ff] transition"
//         />
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="border border-[#004080] rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#66a3ff] transition"
//         >
//           <option value="">Усі статуси</option>
//           {uniqueStatuses.map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>
//       </div>

//       <table className="min-w-[900px] w-full border-collapse border border-[#004080]">
//         <thead className="bg-[#cce0ff] select-none">
//           <tr>
//             <th
//               className="border border-[#0059b3] px-3 py-2 cursor-pointer text-lg font-semibold text-[#003366]"
//               onClick={() => onSortClick("OrderId")}
//               title="Сортувати за №"
//             >
//               № {renderSortArrow("OrderId")}
//             </th>
//             <th
//               className="border border-[#0059b3] px-3 py-2 cursor-pointer text-lg font-semibold text-[#003366]"
//               onClick={() => onSortClick("OrderNumber")}
//               title="Сортувати за № 1С"
//             >
//               № 1С{renderSortArrow("OrderNumber")}
//             </th>
//             <th
//               className="border border-[#0059b3] px-3 py-2 cursor-pointer text-lg font-semibold text-[#003366]"
//               onClick={() => onSortClick("OrderNumberContructions")}
//               title="Сортувати за К-сть Конст"
//             >
//               К-сть Конст{renderSortArrow("OrderNumberContructions")}
//             </th>
//             <th className="border border-[#0059b3] px-3 py-2 text-lg font-semibold text-[#003366]">
//               Файл
//             </th>
//             <th
//               className="border border-[#0059b3] px-3 py-2 cursor-pointer text-lg font-semibold text-[#003366]"
//               onClick={() => onSortClick("OrderDateCreate")}
//               title="Сортувати за датою створення"
//             >
//               Дата {renderSortArrow("OrderDateCreate")}
//             </th>
//             <th
//               className="border border-[#0059b3] px-3 py-2 cursor-pointer text-lg font-semibold text-[#003366]"
//               onClick={() => onSortClick("CustomerName")}
//               title="Сортувати за дилером"
//             >
//               Дилер{renderSortArrow("CustomerName")}
//             </th>
//             <th className="border border-[#0059b3] px-3 py-2 text-lg font-semibold text-[#003366]">
//               Коментар
//             </th>
//             <th className="border border-[#0059b3] px-3 py-2 text-lg font-semibold text-[#003366]">
//               Статус
//             </th>
//           </tr>
//         </thead>

//         <tbody>
//           {sortedData.length === 0 ? (
//             <tr>
//               <td
//                 colSpan="8"
//                 className="text-center p-4 text-gray-600 text-lg font-medium"
//               >
//                 Немає даних
//               </td>
//             </tr>
//           ) : (
//             sortedData.map((order, index) => (
//               <tr
//                 key={order.OrderId}
//                 className={index % 2 === 0 ? "bg-white" : "bg-[#e6f0ff]"}
//               >
//                 <td className="border border-[#0059b3] px-3 py-2 text-center text-base font-medium text-[#003366]">
//                   {order.OrderId}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-center text-base font-medium text-[#003366]">
//                   {order.OrderNumber}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-center text-base font-medium text-[#003366]">
//                   {order.OrderNumberContructions}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-center">
//                   {order.File ? (
//                     <a
//                       href={order.File}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-[#0066cc] font-semibold underline hover:text-[#004080]"
//                     >
//                       Файл
//                     </a>
//                   ) : (
//                     "-"
//                   )}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-center text-base font-medium text-[#003366]">
//                   {order.AllOrderDatePlainText || "-"}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-base font-medium text-[#003366]">
//                   {order.CustomerName}
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-sm text-[#003366]">
//                   {order.LastMessageTime && order.LastMessageWriter && (
//                     <div className="text-xs text-gray-500 mb-1">
//                       [{order.LastMessageTime}]{" "}
//                       <span className="font-semibold">{order.LastMessageWriter}</span>
//                     </div>
//                   )}
//                   {order.LastMessage ? (
//                     <div>{order.LastMessage}</div>
//                   ) : (
//                     <span className="text-gray-400">[Додати коментар]</span>
//                   )}
//                   <button
//                     onClick={() => fetchCommentHistory(order.OrderId)}
//                     className="text-[#0066cc] hover:underline text-xs mt-1 block"
//                   >
//                     📜 Історія
//                   </button>
//                 </td>
//                 <td className="border border-[#0059b3] px-3 py-2 text-base font-semibold text-[#003366]">
//                   {order.StatusName}
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       <p className="mt-6 text-[#004080] text-lg font-semibold">
//         Всього замовлень: {sortedData.length}
//       </p>
//     </div>
//   );
// };

// export default OrdersPage;
// import React, { useState, useMemo } from "react";
// import axiosInstance from "../api/axios";
// import { useNavigate } from "react-router-dom";

// const OrdersPage = () => {
//   const navigate = useNavigate();

//   const data = {
//     total: 157759,
//     rows: [
//       {
//         OrderId: 207316,
//         OrderNumber: "365",
//         Db1SOrderNumbers: [],
//         OrderDateCreate: "06.08.2025 11:19",
//         OrderDateProgress: "",
//         OrderDateComplete: "",
//         ManagerName: "Горак Наталія",
//         ManagerId: "d1c1cf21-e8d5-425f-a504-7bd17d155aa6",
//         CustomerName: "Піцик Юлія",
//         CustomerId: "e5b53a5a-2b41-4da0-bed2-38896ee79eca",
//         File: "/Files/Orders/e5b53a5a-2b41-4da0-bed2-38896ee79eca/%d0%96%d0%b8%d0%bd%d0%b6%d0%b0%d1%80%20%d0%92%d1%8f%d1%87%d0%b5%d1%81%d0%bb%d0%b0%d0%b2.ZKZ",
//         StatusName: "Завантажено",
//         StatusId: 1,
//         OrganizationName: "ВікнаСтиль",
//         OrderNumberContructions: 1,
//         LastMessage: "Доставка на Миколаївську",
//         LastMessageWriter: "Піцик Юлія",
//         LastMessageTime: "06.08.2025 11:19",
//         AllOrderDatePlainText: "06.08.2025 11:19",
//       },
//       {
//         OrderId: 207301,
//         OrderNumber: "5014",
//         Db1SOrderNumbers: ["45-144227"],
//         OrderDateCreate: "05.08.2025 17:52",
//         OrderDateProgress: "06.08.2025 11:17",
//         OrderDateComplete: "",
//         ManagerName: "Горак Наталія",
//         ManagerId: "d1c1cf21-e8d5-425f-a504-7bd17d155aa6",
//         CustomerName: "Александрюк Микола",
//         CustomerId: "c34e1a72-98d2-4407-83ac-91ab4ef38910",
//         File: "/Files/Orders/c34e1a72-98d2-4407-83ac-91ab4ef38910/%d0%9e%d0%ba%d1%81%d0%b0%d0%bd%d0%b0(19).ZKZ",
//         StatusName: "Очікує підтвердження",
//         StatusId: 23,
//         OrganizationName: "ВікнаСтиль",
//         OrderNumberContructions: 3,
//         LastMessage: "змінено ручку на Аксор",
//         LastMessageWriter: "Менеджер",
//         LastMessageTime: "06.08.2025 11:17",
//         AllOrderDatePlainText: "05.08.2025 17:52, 06.08.2025 11:17",
//       },
//     ],
//   };

//   const getStatusClass = (statusName) => {
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


//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sortConfig, setSortConfig] = useState({
//     key: "OrderNumber",
//     ascending: true,
//   });
  

//   const fetchCommentHistory = async (orderId) => {
//     try {
//       const res = await axiosInstance.post("/comments/order", { orderId });
//       if (!Array.isArray(res.data)) {
//         throw new Error("Невірний формат відповіді");
//       }
//       alert(`Історія коментарів для замовлення #${orderId} завантажена`);
//     } catch (err) {
//       console.error(err);
//       alert("Помилка при завантаженні історії коментарів");
//     }
//   };

//   const uniqueStatuses = useMemo(() => {
//     const setStatuses = new Set(data.rows.map((o) => o.StatusName));
//     return Array.from(setStatuses);
//   }, [data.rows]);

//   const filteredData = useMemo(() => {
//     return data.rows.filter((order) => {
//       const matchesStatus =
//         statusFilter === "" || order.StatusName === statusFilter;
//       if (!matchesStatus) return false;

//       if (!searchTerm) return true;

//       return Object.values(order).some(
//         (value) =>
//           value &&
//           value.toString().toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     });
//   }, [searchTerm, statusFilter, data.rows]);

//   const sortableColumns = [
//     "OrderId",
//     "OrderNumber",
//     "OrderNumberContructions",
//     "OrderDateCreate",
//     "CustomerName",
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
//         Замовлення
//       </h1>

//       {isDealer && (
//         <button
//           onClick={() => navigate("/addOrder")}
//           className="mb-6 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
//         >
//           ➕ Додати замовлення
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
        
//       <table className="min-w-[900px] w-full border-collapse border border-gray-400">
//         <thead className="bg-gray-200 select-none">
//           <tr>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("OrderId")}
//               title="Сортувати за №"
//             >
//               № {renderSortArrow("OrderId")}
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("OrderNumber")}
//               title="Сортувати за № 1С"
//             >
//               № 1С{renderSortArrow("OrderNumber")}
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("OrderNumberContructions")}
//               title="Сортувати за К-сть Конст"
//             >
//               К-сть Конст{renderSortArrow("OrderNumberContructions")}
//             </th>
//             <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
//               Файл
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("OrderDateCreate")}
//               title="Сортувати за датою створення"
//             >
//               Дата {renderSortArrow("OrderDateCreate")}
//             </th>
//             <th
//               className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700"
//               onClick={() => onSortClick("CustomerName")}
//               title="Сортувати за дилером"
//             >
//               Дилер{renderSortArrow("CustomerName")}
//             </th>
//             <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
//               Коментар
//             </th>
//             <th className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700">
//               Статус
//             </th>
//           </tr>
//         </thead>

//         <tbody>
//           {sortedData.length === 0 ? (
//             <tr>
//               <td
//                 colSpan="8"
//                 className="text-center p-4 text-gray-600 text-lg font-medium"
//               >
//                 Немає даних
//               </td>
//             </tr>
//           ) : (
//             sortedData.map((order, index) => (
//               <tr
//                 key={order.OrderId}
//                 className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
//               >
//                 <td className="border border-gray-300 px-3 py-2 text-center text-base font-medium text-gray-800">
//                   {order.OrderId}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center text-base font-medium text-gray-800">
//                   {order.OrderNumber}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center text-base font-medium text-gray-800">
//                   {order.OrderNumberContructions}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center">
//                   {order.File ? (
//                     <a
//                       href={order.File}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 font-semibold underline hover:text-blue-800"
//                     >
//                       Файл
//                     </a>
//                   ) : (
//                     "-"
//                   )}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center text-base font-medium text-gray-800">
//                   {order.AllOrderDatePlainText || "-"}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-base font-medium text-gray-800">
//                   {order.CustomerName}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
//                   {order.LastMessageTime && order.LastMessageWriter && (
//                     <div className="text-xs text-gray-500 mb-1">
//                       [{order.LastMessageTime}]{" "}
//                       <span className="font-semibold">{order.LastMessageWriter}</span>
//                     </div>
//                   )}
//                   {order.LastMessage ? (
//                     <div>{order.LastMessage}</div>
//                   ) : (
//                     <span className="text-gray-400">[Додати коментар]</span>
//                   )}
//                   <button
//                     onClick={() => fetchCommentHistory(order.OrderId)}
//                     className="text-blue-600 hover:underline text-xs mt-1 block"
//                   >
//                     📜 Історія
//                   </button>
//                 </td>
//                 <td className={`border border-gray-300 px-3 py-2 text-base font-semibold ${getStatusClass(order.StatusName)}`}>
//                   {order.StatusName}
//                 </td>

//                 {/* <td className="border border-gray-300 px-3 py-2 text-base font-semibold text-gray-800">
//                   {order.StatusName}
//                 </td> */}
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       <p className="mt-6 text-gray-900 text-lg font-semibold">
//         Всього замовлень: {sortedData.length}
//       </p>
//     </div>
//   );
// };

// export default OrdersPage;

import React, { useState, useEffect, useMemo, useContext } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../context/RoleContext";

const OrdersPage = () => {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext); // отримуємо роль з контексту
  const isDealer = role === "customer";

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "OrderDateCreate",
    ascending: false,
  });

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

  const fetchOrders = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      let url = "";
      if (role === "admin") {
        url = `/orders/admin?page=${page}&pageSize=${pageSize}`;
      } else if (role === "manager") {
        url = `/orders/for-manager?managerId=${localStorage.getItem(
          "userId"
        )}&page=${page}&pageSize=${pageSize}`;
      } else {
        url = `/orders/my-orders?page=${page}&pageSize=${pageSize}`;
      }

      const res = await axiosInstance.get(url);
      const newOrders = res.data || [];

      setOrders((prev) => [...prev, ...newOrders]);
      setHasMore(newOrders.length === pageSize);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, role]);

  const loadMore = () => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  };

  const uniqueStatuses = useMemo(() => {
    const setStatuses = new Set(orders.map((o) => o.StatusName));
    return Array.from(setStatuses);
  }, [orders]);

  const filteredData = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "" || order.StatusName === statusFilter;
      if (!matchesStatus) return false;

      if (!searchTerm) return true;

      return Object.values(order).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, statusFilter, orders]);

  const sortableColumns = [
    "OrderId",
    "OrderNumber",
    "OrderNumberContructions",
    "OrderDateCreate",
    "CustomerName",
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

  return (
    <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Замовлення
      </h1>

      {isDealer && (
        <button
          onClick={() => navigate("/addOrder")}
          className="mb-6 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
        >
          ➕ Додати замовлення
        </button>
      )}

      {/* ... решта компоненту залишається без змін */}
    </div>
  );
};

export default OrdersPage;
