// import React, { useState, useEffect, useMemo } from "react";
// import axiosInstance from "../api/axios";


// const LocalOrdersPage = () => {
//   const role = localStorage.getItem("role");
//   const isDealer = role === "Dealer";

//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sortConfig, setSortConfig] = useState({ key: "createdAt", ascending: false });
//   const [showModal, setShowModal] = useState(false);
//   const [selectedOrderId, setSelectedOrderId] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState("");

//   const fetchOrders = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get("/LocalOrders/list");
//       setOrders(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchComments = async (orderId) => {
//     try {
//       const res = await axiosInstance.get("/Comments/list", { params: { targetType: "Order", targetId: orderId } });
//       setComments(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error(err);
//       setComments([]);
//     }
//   };

//   const handleOpenComments = (orderId) => {
//     setSelectedOrderId(orderId);
//     fetchComments(orderId);
//     setShowModal(true);
//   };

//   const apiUrl = import.meta.env.VITE_API_URL;


//   const handleAddComment = async () => {
//     if (!newComment.trim()) return;
//     try {
//       await axiosInstance.post("/Comments/create", {
//         text: newComment,
//         targetType: 0,
//         targetId: selectedOrderId,
//       });
//       setComments((prev) => [
//           { id: Date.now(), text: newComment, createdAt: new Date(), userName: "Ви" },
//           ...prev,
//       ]);

//       setNewComment("");
//       fetchOrders();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => { fetchOrders(); }, []);

//   const uniqueStatuses = useMemo(() => Array.from(new Set(orders.map(o => o.status?.name))), [orders]);

//   const filteredData = useMemo(() => {
//     return orders.filter(o => {
//       const statusMatch = !statusFilter || o.status?.name === statusFilter;
//       const searchMatch = !searchTerm || Object.values(o).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
//       return statusMatch && searchMatch;
//     });
//   }, [orders, searchTerm, statusFilter]);

//   const sortedData = useMemo(() => {
//     const sorted = [...filteredData];
//     const { key, ascending } = sortConfig;
//     sorted.sort((a, b) => {
//       let valA = a[key], valB = b[key];
//       if (valA instanceof Date || key.toLowerCase().includes("date")) valA = new Date(valA || 0);
//       if (valB instanceof Date || key.toLowerCase().includes("date")) valB = new Date(valB || 0);
//       if (typeof valA === "number" && typeof valB === "number") return ascending ? valA - valB : valB - valA;
//       return ascending ? (valA?.toString() || "").localeCompare(valB?.toString() || "", undefined, { numeric: true })
//                        : (valB?.toString() || "").localeCompare(valA?.toString() || "", undefined, { numeric: true });
//     });
//     return sorted;
//   }, [filteredData, sortConfig]);

//   const onSortClick = (key) => setSortConfig(prev => ({ key, ascending: prev.key === key ? !prev.ascending : true }));

//   const renderSortArrow = (key) => sortConfig.key === key ? (sortConfig.ascending ? " ▲" : " ▼") : " ⇅";

//   const getStatusClass = (statusName) => {
//     switch (statusName) {
//       case "Завантажено": return "text-green-600 font-bold";
//       case "Очікує підтвердження": return "text-yellow-600 font-semibold";
//       case "Відхилено": return "text-red-600 font-bold";
//       case "Виконано": return "text-blue-600 font-semibold";
//       default: return "text-gray-800";
//     }
//   };

//   return (
//     <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
//       <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">Локальні замовлення</h1>

//       <div className="mb-6 flex flex-wrap gap-4 items-center">
//         <input
//           type="text"
//           placeholder="Пошук..."
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
//           {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
//         </select>
//       </div>

//       <table className="min-w-[900px] w-full border-collapse border border-gray-400">
//         <thead className="bg-gray-200 select-none">
//           <tr>
//             <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("id")}>№{renderSortArrow("id")}</th>
//             <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("numbers1C")}>№ 1С{renderSortArrow("numbers1C")}</th>
//             <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("constructionsCount")}>К-сть Конст{renderSortArrow("constructionsCount")}</th>
//             <th className="border border-gray-500 px-3 py-2">Файл</th>
//             <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("createdAt")}>Дата{renderSortArrow("createdAt")}</th>
//             <th className="border border-gray-500 px-3 py-2">Дилер</th>
//             <th className="border border-gray-500 px-3 py-2">Коментар</th>
//             <th className="border border-gray-500 px-3 py-2">Статус</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedData.length === 0 ? (
//             <tr>
//               <td colSpan="8" className="text-center p-4 text-gray-600 text-lg font-medium">Немає даних</td>
//             </tr>
//           ) : (
//             sortedData.map(o => (
//               <tr key={o.id} className="bg-white hover:bg-gray-100">
//                 <td className="border border-gray-300 px-3 py-2 text-center">{o.id}</td>
//                 <td className="border border-gray-300 px-3 py-2 text-center">
//                   {o.numbers1C?.length ? o.numbers1C.map(n => <div key={n.id}>{n.db1SOrderNumber}</div>) : "-"}
//                 </td>
//                 <td className="border border-gray-300 px-3 py-2 text-center">{o.constructionsCount}</td>
//                  <td className="border border-gray-300 px-3 py-2 text-center">
//               <a
//                   href={`https://localhost:7019/api/LocalOrders/download/${o.id}`}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="text-blue-600 underline"
//                 >
//                   Завантажити файл
//                 </a>

//                   </td>

//                 <td className="border border-gray-300 px-3 py-2 text-center">
//                   {/* Відображення трьох дат: створення, підтвердження, виконання */}
//                   <div>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</div>
//                   <div className="text-xs text-gray-500">{o.confirmedAt ? new Date(o.confirmedAt).toLocaleString() : "-"}</div>
//                   <div className="text-xs text-gray-400">{o.completedAt ? new Date(o.completedAt).toLocaleString() : "-"}</div>
//                 </td>

          

//                 <td className="border border-gray-300 px-3 py-2 text-center">{o.dealer || "-"}</td>
//                 <td className="border border-gray-300 px-3 py-2 text-sm">
//                   {o.lastComment && <div className="text-xs text-gray-500 mb-1">[{new Date(o.lastComment.createdAt).toLocaleString()}] <b>{o.lastComment.authorName}</b></div>}
//                   <div>{o.lastComment?.text || <span className="text-gray-400">[Додати коментар]</span>}</div>
//                   <button onClick={() => handleOpenComments(o.id)} className="text-blue-600 hover:underline text-xs mt-1">📜 Історія</button>
//                 </td>
//                 <td>
//                 {uniqueStatuses.map((s, index) => (
//                   <option key={index} value={s}>
//                     {s || "Без статусу"}
//                   </option>
//                 ))}
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       {/* Модалка */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg w-96 max-w-full">
//             <h3 className="text-xl font-bold mb-3">Коментарі до замовлення #{selectedOrderId}</h3>
//             <div className="max-h-72 overflow-y-auto mb-3 space-y-2">
//               {comments.length ? comments.map(c => (
//                 <div key={c.id} className="border-b border-gray-200 pb-1">
//                   <div><b>[{new Date(c.createdAt).toLocaleString()}]</b>: <b>{c.userName || "Невідомий"}</b></div>
//                   <div className="ml-4">{c.text}</div>
//                 </div>
//               )) : <p>Коментарів ще немає.</p>}
//             </div>
//             <textarea
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               placeholder="Новий коментар..."
//               rows={3}
//               className="w-full p-2 border border-gray-300 rounded mb-3"
//             />
//             <div className="flex justify-end space-x-2">
//               <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Закрити</button>
//               <button onClick={handleAddComment} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Додати коментар</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LocalOrdersPage;
// src/pages/OrdersPage.jsx
import React, { useState, useEffect } from 'react';

// Компонент одного замовлення (рядок)
const OrderItem = ({ order, onClick }) => {
  return (
    <div
      className="order-item"
      onClick={() => onClick(order)}
      style={{
        padding: '10px',
        borderBottom: '1px solid #ccc',
        cursor: 'pointer',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div><strong>№ Замовлення:</strong> {order.orderNumber}</div>
      <div><strong>Дата:</strong> {order.orderDate}</div>
      <div><strong>Статус:</strong> {order.orderStatus}</div>
    </div>
  );
};

// Компонент деталей замовлення
const OrderDetails = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div
      className="order-details"
      style={{
        padding: '20px',
        background: '#fff',
        border: '1px solid #ccc',
        marginTop: '10px',
        borderRadius: '8px',
      }}
    >
      <h3>Деталі замовлення № {order.orderNumber}</h3>
      <p><strong>Дата:</strong> {order.orderDate}</p>
      <p><strong>Статус:</strong> {order.orderStatus}</p>
      <p><strong>Сума:</strong> {order.orderAmount}</p>
      <p><strong>Адреса доставки:</strong> {order.deliveryAddress}</p>
      <button
        style={{
          padding: '8px 16px',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px',
        }}
        onClick={onClose}
      >
        Закрити
      </button>
    </div>
  );
};

// Основна сторінка
const LocalOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // імітуємо запит на API
  useEffect(() => {
    const fetchOrders = async () => {
      // тут можеш зробити реальний запит через axios/fetch
      const mockOrders = [
        {
          orderNumber: '1001',
          orderDate: '2025-09-01',
          orderStatus: 'Новий',
          orderAmount: '10000 грн',
          deliveryAddress: 'м. Київ, вул. Хрещатик, 1',
        },
        {
          orderNumber: '1002',
          orderDate: '2025-09-02',
          orderStatus: 'В роботі',
          orderAmount: '15000 грн',
          deliveryAddress: 'м. Львів, вул. Степана Бандери, 10',
        },
      ];
      setOrders(mockOrders);
    };

    fetchOrders();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Список замовлень</h2>
      <div>
        {orders.map((order, index) => (
          <OrderItem
            key={index}
            order={order}
            onClick={setSelectedOrder}
          />
        ))}
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default LocalOrdersPage;
