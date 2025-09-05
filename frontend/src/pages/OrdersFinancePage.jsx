import React, { useEffect, useState, useContext, useMemo } from "react";
import axiosInstance from "../api/axios";
import ContractorsSelect from "../components/ContractorsSelect";
import { RoleContext } from "../context/RoleContext";

const getStatusClass = (status) => {
  switch (status) {
    case "В роботі":
      return "text-blue-600 font-semibold";
    case "Завершено":
      return "text-green-600 font-bold";
    case "Очікує підтвердження":
      return "text-yellow-600 font-semibold";
    case "Скасовано":
      return "text-red-600 font-bold";
    default:
      return "text-gray-800";
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "order_number", ascending: true });

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date) => date.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(formatDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDate(today));
  const [contractor, setContractor] = useState("");

  const { role: userRole } = useContext(RoleContext);
  const isDealer = userRole === "Dealer";

  const fetchOrders = async () => {
    if (!contractor && !isDealer) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders/list", {
        params: { kontr_kod: contractor, data1: fromDate, data2: toDate },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Помилка завантаження замовлень:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractor || isDealer) fetchOrders();
  }, [contractor]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(orders.map((o) => o.product_status))),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = !statusFilter || o.product_status === statusFilter;
      const matchesSearch = !searchTerm || Object.values(o).some(
        (v) => v && v.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const sortableColumns = ["order_number", "date_start", "date_ready", "constr_sum", "order_sum", "pay_sum", "debt_sum", "delivery", "product_status"];
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    const { key, ascending } = sortConfig;
    sorted.sort((a, b) => {
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";

      if (key.toLowerCase().includes("date")) {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return ascending ? valA - valB : valB - valA;
      }

      return ascending
        ? valA.toString().localeCompare(valB.toString(), undefined, { numeric: true })
        : valB.toString().localeCompare(valA.toString(), undefined, { numeric: true });
    });
    return sorted;
  }, [filteredOrders, sortConfig]);

  const onSortClick = (key) => {
    if (!sortableColumns.includes(key)) return;
    setSortConfig((prev) => prev.key === key ? { key, ascending: !prev.ascending } : { key, ascending: true });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return " ⇅";
    return sortConfig.ascending ? " ▲" : " ▼";
  };

  const totals = useMemo(() => {
    return sortedOrders.reduce(
      (acc, o) => {
        acc.count += o.constr_sum || 0;
        acc.order_sum += parseFloat(o.order_sum || 0);
        acc.pay_sum += parseFloat(o.pay_sum || 0);
        acc.debt_sum += parseFloat(o.debt_sum || 0);
        return acc;
      },
      { count: 0, order_sum: 0, pay_sum: 0, debt_sum: 0 }
    );
  }, [sortedOrders]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">Список замовлень</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2" />
        <ContractorsSelect value={contractor} onChange={setContractor} role={userRole} />
        {/* <input type="text" placeholder="Пошук по всіх полях" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md border border-gray-400 rounded-md px-3 py-2" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2">
          <option value="">Усі статуси</option>
          {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select> */}
        <button onClick={fetchOrders}
          className="bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300">
          🔍 Пошук
        </button>
      </div>

      {loading ? (
        <p className="text-center text-lg text-gray-600 py-10">Завантаження...</p>
      ) : sortedOrders.length === 0 ? (
        <p className="text-center text-lg text-gray-600 py-10">Немає замовлень</p>
      ) : (
        <table className="min-w-[800px] w-full border-collapse border border-gray-400">
          <thead className="bg-gray-200 select-none">
            <tr>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("order_number")}>№ {renderSortArrow("order_number")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("date_start")}>Створення {renderSortArrow("date_start")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("date_ready")}>Готовність {renderSortArrow("date_ready")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("constr_sum")}>К-ть {renderSortArrow("constr_sum")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("order_sum")}>Сума {renderSortArrow("order_sum")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("pay_sum")}>Аванс {renderSortArrow("pay_sum")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("debt_sum")}>Залишок {renderSortArrow("debt_sum")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("delivery")}>
                Доставка {renderSortArrow("delivery")}
              </th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("product_status")}>
                Статус {renderSortArrow("product_status")}
              </th>

            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((o, idx) => (
              <tr key={o.order_number} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border px-3 py-2 text-center">{o.order_number}</td>
                <td className="border px-3 py-2 text-center">{o.date_start?.split("T")[0] || "-"}</td>
                <td className="border px-3 py-2 text-center">{o.date_ready || "-"}</td>
                <td className="border px-3 py-2 text-center">{o.constr_sum || 0}</td>
                <td className="border px-3 py-2 text-right">{o.order_sum || 0}</td>
                <td className="border px-3 py-2 text-right">{o.pay_sum || 0}</td>
                <td className="border px-3 py-2 text-right">{o.debt_sum || 0}</td>
                <td className="border px-3 py-2 text-center">{o.delivery || "-"}</td>
                <td className={`border px-3 py-2 text-center font-semibold ${getStatusClass(o.product_status)}`}>{o.product_status || "-"}</td>
              </tr>
            ))}

            {/* Рядок підсумків */}
            <tr className="font-bold bg-gray-100">
              <td className="border px-3 py-2 text-center" colSpan={3}>Разом</td>
              <td className="border px-3 py-2 text-center">{totals.count}</td>
              <td className="border px-3 py-2 text-right">{totals.order_sum.toFixed(2)}</td>
              <td className="border px-3 py-2 text-right">{totals.pay_sum.toFixed(2)}</td>
              <td className="border px-3 py-2 text-right">{totals.debt_sum.toFixed(2)}</td>
              <td className="border px-3 py-2" colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
