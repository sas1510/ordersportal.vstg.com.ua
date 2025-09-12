import React, { useState, useEffect, useMemo, useContext } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../context/RoleContext";

const OrdersPage = () => {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext); 
  const isDealer = role === "customer";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "Date", ascending: false });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusClass = (statusName) => {
    switch (statusName) {
      case "Подтверждено":
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
    setLoading(true);
    try {
      const res = await axiosInstance.get("/customer-orders/");
      const allOrders = res.data.flatMap((group) => group.orders || []);
      setOrders(allOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const uniqueStatuses = useMemo(() => {
    const setStatuses = new Set(orders.map((o) => o.Status));
    return Array.from(setStatuses);
  }, [orders]);

  const filteredData = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "" || order.Status === statusFilter;
      if (!matchesStatus) return false;

      if (!searchTerm) return true;

      return Object.values(order).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, statusFilter, orders]);

  const sortableColumns = ["OrderId","Order1CNumber", "CustomerOrderNumber", "Constructions", "Date", "CustomerName"];

  const groupedOrders = useMemo(() => {
    const map = new Map();

    filteredData.forEach(order => {
      const key = order.CustomerOrderNumber;
      if (!map.has(key)) {
        map.set(key, { ...order, Order1CNumber: [order.Order1CNumber] });
      } else {
        map.get(key).Order1CNumber.push(order.Order1CNumber);
      }
    });

    return Array.from(map.values());
  }, [filteredData]);

  const sortedGroupedData = useMemo(() => {
    const sorted = [...groupedOrders];
    const { key, ascending } = sortConfig;

    if (!sortableColumns.includes(key)) return sorted;

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
  }, [groupedOrders, sortConfig]);

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

      <table className="min-w-[900px] w-full border-collapse border border-gray-400">
        <thead className="bg-gray-200 select-none">
          <tr>
            <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("CustomerOrderNumber")}>№ {renderSortArrow("CustomerOrderNumber")}</th>
            <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("Order1CNumber")}>№ 1С {renderSortArrow("Order1CNumber")}</th>
            <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("Constructions")}>К-сть Конст {renderSortArrow("Constructions")}</th>
            <th className="border border-gray-500 px-3 py-2">Файл</th>
            <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("Date")}>Дата {renderSortArrow("Date")}</th>
            <th className="border border-gray-500 px-3 py-2 cursor-pointer" onClick={() => onSortClick("CustomerName")}>Дилер {renderSortArrow("CustomerName")}</th>
            <th className="border border-gray-500 px-3 py-2">Коментар</th>
            <th className="border border-gray-500 px-3 py-2">Статус</th>
          </tr>
        </thead>

        <tbody>
          {sortedGroupedData.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center p-4 text-gray-600">Немає даних</td>
            </tr>
          ) : (
            sortedGroupedData.map((order, index) => (
              <tr key={order.CustomerOrderNumber} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border px-3 py-2 text-center">{order.CustomerOrderNumber}</td>
                <td className="border px-3 py-2 text-center">
                    {order.Order1CNumber.map((num, idx) => (
                      <div key={idx}>{num}</div>
                    ))}
                  </td>
                <td className="border px-3 py-2 text-center">{order.Constructions}</td>
                <td className="border px-3 py-2 text-center">
                  {order.File ? (
                    <a href={order.File} download className="text-blue-600 underline">
                      Завантажити
                    </a>
                  ) : "-"}
                </td>
                <td className="border px-3 py-2 text-center">
                  {order.PortalCreateDate 
                    ? new Date(order.PortalCreateDate).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "-"
                  }
                </td>
                <td className="border px-3 py-2 text-center">{order.CustomerName}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-800">
                  {order.CommentDate && order.CommentAuthor && (
                    <div className="text-xs text-gray-500 mb-1">
                      [{order.CommentDate ? new Date(order.Date).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "-" }]{" "}
                      <span className="font-semibold">{order.CommentAuthor}</span>
                    </div>
                  )}
                  {order.Comment ? (
                    <div>{order.Comment}</div>
                  ) : (
                    <span className="text-gray-400">[Додати коментар]</span>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:underline text-xs mt-1 block"
                  >
                    📜 Історія
                  </button>
                </td>
                <td className={`border px-3 py-2 text-center ${getStatusClass(order.Status)}`}>{order.Status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-6 text-gray-900 text-lg font-semibold">
        Всього замовлень: {sortedGroupedData.length}
      </p>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

const OrderModal = ({ order, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!order?.PortalOrderId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders/${order.PortalOrderId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await axiosInstance.post(`/orders/${order.PortalOrderId}/add-message/`, {
        message: newMessage,  
      });
      if (res.status === 201) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [order]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">Замовлення #{order.CustomerOrderNumber}</h2>

        <h3 className="mt-4 font-semibold">Історія коментарів:</h3>
        <div className="max-h-60 overflow-y-auto border p-2 rounded mb-4">
          {loading ? (
            <p>Завантаження...</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-500">Немає коментарів</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2 border-b pb-1">
                <p className="text-sm text-gray-700">{msg.message}</p>
                <p className="text-xs text-gray-400">
                  {msg.author || "Anonymous"} -{" "}
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Новий коментар"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={addMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Додати
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
