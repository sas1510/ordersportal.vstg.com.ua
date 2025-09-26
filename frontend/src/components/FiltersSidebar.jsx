import React from "react";

const FiltersSidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md p-4 border-r">
      <h3 className="text-lg font-bold mb-4">Фільтри</h3>
      <ul className="space-y-2">
        <li className="cursor-pointer hover:text-blue-600">Всі рекламації</li>
        <li className="cursor-pointer hover:text-blue-600">Нові</li>
        <li className="cursor-pointer hover:text-blue-600">В обробці</li>
        <li className="cursor-pointer hover:text-blue-600">Очікують підтвердження</li>
        <li className="cursor-pointer hover:text-blue-600">Виконані</li>
        <li className="cursor-pointer hover:text-blue-600">Відхилені</li>
      </ul>
    </div>
  );
};

export default FiltersSidebar;
