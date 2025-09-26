import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axios";
import ContractorsSelect from "../components/ContractorsSelect";

const translateStatus = (status) => {
  switch (status) {
    case "Заявка на рекламу":
      return "Заявка на рекламу";
    case "Заявка на витраж":
      return "Заявка на вітраж";
    case "Оплачено":
      return "Оплачено";
    case "Резервирование":
      return "Резервування";
    case "Разработка рисунка":
      return "Розробка малюнка";
    case "Подтверждено":
      return "В роботі";
    case "Ждем оплати":
      return "Очікує оплату";
    case "Рисунок без подтверждения":
      return "Малюнок без підтвердження";
    case "Рисунок - подтвержден":
      return "Малюнок підтверджено";
    case "Переоформление рисунка":
      return "Перереєстрація малюнка";
    case "Склад":
      return "Склад";
    case "Ждем подтверждения":
      return "Очікує підтвердження";
    case "В работе":
      return "В роботі";
    case "Автоматический отказ-неоплачено":
      return "Автоматичний відмова — неоплачено";
    case "Компенсация":
      return "Компенсація";
    case "Отказ":
      return "Відмова";
    case "Переоформление":
      return "Перереєстрація";
    case "Неликвид":
      return "Неліквід";
    case "Коммерция":
      return "Комерція";
    case "Для просчета":
      return "Для розрахунку";
    default:
      return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "В роботі":
      return "text-blue-600 font-semibold";
    case "Завершено":
      return "text-green-600 font-bold";
    case "Очікує підтвердження":
      return "text-yellow-600 font-semibold";
    case "Відмова":
      return "text-red-600 font-bold";
    case "Відвантажено":
      return "text-green-700 font-semibold";
    case "Підтверджено":
      return "text-teal-600 font-semibold"; // новий колір для підтверджено
    default:
      return "text-gray-800";
  }
};


const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("uk-UA");
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "OrderNumber", ascending: true });

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date) => date.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(formatDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDate(today));
  const [contractor, setContractor] = useState("");

  const userRole = localStorage.getItem("role"); 
  const isDealer = userRole === "customer";

  const fetchOrders = async () => {
    if (!contractor && !isDealer) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/get_filtered_orders/", {
        params: { 
          kontragent: contractor,
          date_start: fromDate,
          date_end: toDate
        },
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
    () => Array.from(new Set(orders.map((o) => translateStatus(o.OrderStatus)))),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = translateStatus(o.OrderStatus);
      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesSearch = !searchTerm || Object.values(o).some(
        (v) => v && v.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const sortableColumns = [
    "OrderNumber",
    "OrderDate",
    "ProductionPeriod",
    "OrderSum",
    "AdvancePayment",
    "Balance",
    "RouteDate",
    "OrderStatus"
  ];

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
        acc.order_sum += parseFloat(o.OrderSum || 0);
        acc.pay_sum += parseFloat(o.AdvancePayment || 0);
        acc.debt_sum += parseFloat(o.Balance || 0);
        return acc;
      },
      { order_sum: 0, pay_sum: 0, debt_sum: 0 }
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
        <input type="text" placeholder="Пошук по всіх полях" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md border border-gray-400 rounded-md px-3 py-2" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2">
          <option value="">Усі статуси</option>
          {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
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
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("OrderNumber")}>№ {renderSortArrow("OrderNumber")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("OrderDate")}>Створення {renderSortArrow("OrderDate")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("ProductionPeriod")}>Період виробництва {renderSortArrow("ProductionPeriod")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("OrderSum")}>Сума {renderSortArrow("OrderSum")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("AdvancePayment")}>Аванс {renderSortArrow("AdvancePayment")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("Balance")}>Залишок {renderSortArrow("Balance")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("RouteDate")}>Доставка {renderSortArrow("RouteDate")}</th>
              <th className="border px-3 py-2 cursor-pointer" onClick={() => onSortClick("OrderStatus")}>Статус {renderSortArrow("OrderStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((o, idx) => (
              <tr key={o.OrderLink} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border px-3 py-2 text-center">{o.OrderNumber}</td>
                <td className="border px-3 py-2 text-center">{formatDateDisplay(o.OrderDate)}</td>
                <td className="border px-3 py-2 text-center">{o.ProductionPeriod || "-"}</td>
                <td className="border px-3 py-2 text-right">{o.OrderSum || 0}</td>
                <td className="border px-3 py-2 text-right">{o.AdvancePayment || 0}</td>
                <td className="border px-3 py-2 text-right">{o.Balance || 0}</td>
                <td className="border px-3 py-2 text-center">
                  {o.RouteDate ? formatDateDisplay(o.RouteDate) : "-"}
                </td>
    
                <td className={`border px-3 py-2 text-center font-semibold ${getStatusClass(translateStatus(o.OrderStatus))}`}>
                  {translateStatus(o.OrderStatus)}
                  {o.RealizationDate && (
                    <>
                      <br /> 
                      {formatDateDisplay(o.RealizationDate)}
                    </>
                  )}
  

              </td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-100">
              <td className="border px-3 py-2 text-center" colSpan={3}>Разом</td>
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
