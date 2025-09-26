import React from "react";
import { FaList, FaPlusCircle, FaSpinner, FaMoneyBill, FaCheckCircle, FaIndustry, FaCheck, FaBoxOpen, FaTruck, FaTimesCircle, FaShippingFast } from "react-icons/fa";

export function Sidebar({ search, setSearch, statusFilter, setStatusFilter }) {
  const menu = [
    "Всі прорахунки",
    "Нові прорахунки",
    "В обробці",
    "Очікують оплату",
    "Очікують підтвердження",
    "Замовлення у виробництві",
    "Підтверджено",
    "Готові замовлення",
    "Доставлені замовлення",
    "Відмова",
    "Доставка"
  ];

  // Словник: статус → іконка
  const icons = {
    "Всі прорахунки": <FaList className="text-gray-500" />,
    "Нові прорахунки": <FaPlusCircle className="text-green-500" />,
    "В обробці": <FaSpinner className="text-blue-500" />,
    "Очікують оплату": <FaMoneyBill className="text-yellow-500" />,
    "Очікують підтвердження": <FaCheckCircle className="text-indigo-500" />,
    "Замовлення у виробництві": <FaIndustry className="text-gray-600" />,
    "Підтверджено": <FaCheck className="text-green-600" />,
    "Готові замовлення": <FaBoxOpen className="text-purple-500" />,
    "Доставлені замовлення": <FaTruck className="text-orange-500" />,
    "Відмова": <FaTimesCircle className="text-red-500" />,
    "Доставка": <FaShippingFast className="text-teal-500" />
  };

  return (
    <aside className="w-72 bg-white p-5 border-r h-screen sticky top-0">
      {/* Пошук */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук замовлення..."
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <hr className="my-4 border-gray-200" />
      </div>

      {/* Кнопка */}
      <button className="w-full bg-green-600 text-white py-2 rounded mb-6 text-sm font-medium">
        + Новий прорахунок
      </button>

      {/* Меню */}
      <ul className="space-y-2 max-h-[60vh] overflow-auto">
        {menu.map((m, i) => (
          <li
            key={i}
            className={`flex justify-between items-center p-2 rounded cursor-pointer ${
              statusFilter === m
                ? "bg-green-50 border-l-4 border-green-500"
                : "hover:bg-gray-50"
            }`}
            onClick={() => setStatusFilter(statusFilter === m ? null : m)}
          >
            {/* Ліва частина: іконка + текст */}
            <div className="flex items-center space-x-2">
              {icons[m]} <span className="text-gray-700">{m}</span>
            </div>

            {/* Лічильник або ? */}
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">?</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
