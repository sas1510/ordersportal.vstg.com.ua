// import React, { useState } from "react";
// import { Sidebar } from "../components/Sidebar";
// import { OrderCard } from "../components/OrderCard";
// import { useOrders } from "../hooks/useOrders";

// export function Dashboards() {
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState(null);

//   const { orders, updateOrderStatus, loading } = useOrders("/get_orders_by_dealer_and_year/");

//   // фільтрація
// const filteredOrders = orders.filter(order => {
//   // Перевіряємо, чи хоча б одне підзамовлення проходить фільтр
//   const hasFilteredSub = order.suborders.some(sub => {
//     const matchesSearch = !search || sub.id.toLowerCase().includes(search.toLowerCase().trim());
//     const matchesStatus = !statusFilter || sub.status === statusFilter;
//     return matchesSearch && matchesStatus;
//   });
//   return hasFilteredSub;
// });




//   if (loading) return <div className="p-6">Завантаження...</div>;

//   return (
//     <div className="flex">
//       <Sidebar
//         search={search}
//         setSearch={setSearch}
//         statusFilter={statusFilter}
//         setStatusFilter={setStatusFilter}
//         counts={orders.reduce((acc, o) => {
//           acc[o.OrderStatus] = (acc[o.OrderStatus] || 0) + 1;
//           return acc;
//         }, {})}
//       />
//       <main className="flex-1 p-6 bg-gray-50">
//         <h1 className="text-2xl font-bold mb-6">Прорахунки</h1>
//         {filteredOrders.map(order => (
//           <OrderCard
//             key={order.Order_ID}
//             order={order}
//             onUpdateStatus={updateOrderStatus}
//           />
//         ))}
//       </main>
//     </div>
//   );
// }
