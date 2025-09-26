import React, { useState } from "react";
import { SubOrderCard } from "./SubOrderCard";

export function OrderCard({ order, search, statusFilter }) {
  // Показуємо підзамовлення відповідно до фільтрів. Логіка: якщо search заданий - фільтруємо по підзамовленню (номер містить search).
  const filteredSubs = order.suborders.filter(sub => {
    const matchesSearch = !search || sub.id.toLowerCase().includes(search.toLowerCase().trim());
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
});

// Якщо немає підзамовлень після фільтру — не рендеримо головне замовлення
if (filteredSubs.length === 0) return null;



  if (filteredSubs.length === 0) return null;

  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-lg">№ {order.id}</h3>
          <div className="text-sm text-gray-500">{order.date}</div>
          <div className="text-green-600 font-bold">{order.amount.toLocaleString()} грн.</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-orange-500">{order.status}</div>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded" onClick={() => setOpen(o => !o)}>
            {open ? "Сховати підзамовлення" : `Показати підзамовлення (${filteredSubs.length})`}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2">
          {filteredSubs.map((sub) => (
            <SubOrderCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
