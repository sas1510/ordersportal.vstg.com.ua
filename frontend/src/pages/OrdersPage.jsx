import React, { useState, useEffect, useContext, useRef } from "react";
import $ from "jquery";
import "datatables.net";

import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../context/RoleContext";
import Order1CModal from "./Order1CModal";
import OrderModal from "./OrderModal"; // припускаю, що модалка існує

const OrdersPage = () => {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext);
  const isDealer = role === "customer";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const tableRef = useRef();

  const getStatusClass = (statusName) => {
    switch (statusName) {
      case "Підтверджено": return "text-green-600 font-bold";
      case "Очікує підтвердження": return "text-yellow-600 font-semibold";
      case "Відхилено": return "text-red-600 font-bold";
      case "Виконано": return "text-blue-600 font-semibold";
      default: return "text-gray-800";
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/customer-orders/");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      const table = $(tableRef.current).DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        responsive: true,
        language: { url: "/i18n/uk.json" },
        dom: '<"flex justify-between items-center mb-2 px-2"<"flex items-center gap-2"l><"flex items-center gap-2"f>>rt<"flex justify-between items-center mt-4 px-2"<"text-sm text-gray-600"i><"flex gap-1"p>>',
        drawCallback: function () {
  setTimeout(() => {
    const paginateButtons = $(tableRef.current)
      .parent()
      .find(".dataTables_paginate a, .dataTables_paginate button");

    // Додаємо стилі до кнопок пагінації
    paginateButtons.addClass(
      "border border-gray-300 px-3 py-1 rounded-md mx-0.5 hover:bg-gray-100 transition text-sm"
    );

    // Активна кнопка
    paginateButtons.each(function () {
      if ($(this).hasClass("current")) {
        $(this).addClass("bg-blue-600 text-white");
      } else {
        $(this).removeClass("bg-blue-600 text-white");
      }
    });

    // Контейнер пагінації
    $(tableRef.current)
      .parent()
      .find(".dataTables_paginate")
      .addClass("flex gap-1 items-center mt-2 justify-center");
  }, 0);

  // Пошук
  $(tableRef.current)
    .parent()
    .find(".dataTables_filter input")
    .addClass(
      "border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full md:w-auto"
    )
    .attr("placeholder", "Пошук...");

  // Селектор "Показати N записів"
  $(tableRef.current)
    .parent()
    .find(".dataTables_length select")
    .addClass(
      "border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
    );
}
,
      });

      return () => {
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
          $(tableRef.current).DataTable().destroy(true);
        }
      };
    }
  }, [loading, orders]);

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.Status === statusFilter);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto bg-gray-50 mt-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Список замовлень
      </h1>

      {isDealer && (
        <button
          onClick={() => navigate("/addOrder")}
          className="mb-6 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-md transition-all duration-300 font-semibold"
        >
          ➕ Додати нове замовлення
        </button>
      )}

      {/* Фільтр по статусу */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Фільтр за статусом:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">Усі</option>
          <option value="Підтверджено">Підтверджено</option>
          <option value="Очікує підтвердження">Очікує підтвердження</option>
          <option value="Відхилено">Відхилено</option>
          <option value="Виконано">Виконано</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="display stripe hover min-w-full text-sm font-medium bg-white border border-gray-300 rounded-lg"
          >
            <thead className="bg-gray-200 text-gray-800 text-left uppercase tracking-wider border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 border border-gray-300">№</th>
                <th className="px-4 py-2 border border-gray-300">№ 1С</th>
                <th className="px-4 py-2 border border-gray-300">Кількість конструкцій</th>
                <th className="px-4 py-2 border border-gray-300">Файл</th>
                <th className="px-4 py-2 border border-gray-300">Дата створення</th>
                <th className="px-4 py-2 border border-gray-300">Дилер</th>
                <th className="px-4 py-2 border border-gray-300">Коментар</th>
                <th className="px-4 py-2 border border-gray-300">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    Немає замовлень
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr
                    key={order.OrderId}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} border border-gray-300`}
                  >
                    <td className="px-4 py-2 border border-gray-300">{order.CustomerOrderNumber}</td>
                    <td className="px-4 py-2 border border-gray-300">
                      {order.Order1CNumber?.map((num, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedOrderNumbers(order.Order1CNumber)}
                          className="text-blue-600 underline hover:text-blue-800 mb-1 block"
                        >
                          {num}
                        </button>
                      ))}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">{order.Constructions}</td>
                    <td className="px-4 py-2 border border-gray-300">
                      {order.File ? (
                        <a href={order.File} download className="text-blue-600 underline">
                          Завантажити
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {order.PortalCreateDate ? new Date(order.PortalCreateDate).toLocaleString("uk-UA") : "-"}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">{order.CustomerName}</td>
                    <td className="px-4 py-2 border border-gray-300 text-gray-700">
                      {order.CommentDate && order.CommentAuthor && (
                        <div className="text-xs text-gray-500 mb-1">
                          [{new Date(order.CommentDate).toLocaleString()}]{" "}
                          <span className="font-semibold">{order.CommentAuthor}</span>
                        </div>
                      )}
                      {order.Comment ? order.Comment : <span className="text-gray-400">[Додати коментар]</span>}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:underline text-xs mt-1 block"
                      >
                        📜 Переглянути історію
                      </button>
                    </td>
                    <td className={`px-4 py-2 border border-gray-300 ${getStatusClass(order.Status)}`}>
                      {order.Status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-gray-900 text-lg font-semibold">
        Всього замовлень: {filteredOrders.length}
      </p>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {selectedOrderNumbers.length > 0 && (
        <Order1CModal numbers={selectedOrderNumbers} onClose={() => setSelectedOrderNumbers([])} />
      )}
    </div>
  );
};

export default OrdersPage;
