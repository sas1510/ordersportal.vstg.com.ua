
import React from "react";

const FiltersSidebar = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { key: "all", label: "Усі рекламації" },
    { key: "new", label: "Нові" },
    { key: "processing", label: "В обробці" },
    { key: "confirmed", label: "Підтверджені" },
    { key: "done", label: "Закриті" },
    { key: "rejected", label: "Відхилені" },
  ];

  return (
    <div className="w-64 bg-gray-100 p-4 border-r">
      <h2 className="text-lg font-bold mb-4">Фільтри</h2>
      <ul className="space-y-2">
        {filters.map((f) => (
          <li key={f.key}>
            <button
              className={`w-full text-left px-2 py-1 rounded ${activeFilter === f.key ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FiltersSidebar;
