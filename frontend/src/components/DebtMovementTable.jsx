import React from "react";

export default function DebtMovementTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">Немає даних</p>;
  }

  return (
    <table className="border-collapse border w-full text-sm">
      <thead className="bg-gray-200">
        <tr>
          <th className="border p-2">Договір</th>
          <th className="border p-2">Номер замовлення</th>
          <th className="border p-2">Дата</th>
          <th className="border p-2">Статус</th>
          <th className="border p-2">Початок</th>
          <th className="border p-2">Прихід</th>
          <th className="border p-2">Розхід</th>
          <th className="border p-2">Кінець</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => {
          const isAdvance = row.contract === "Авансовий договір";
          return (
            <tr
              key={i}
              className={`hover:bg-gray-100 ${isAdvance ? "bg-yellow-100 font-bold" : ""}`}
            >
              <td className="border p-2">{row.contract}</td>
              <td className="border p-2">{row.orderNumber || ""}</td>
              <td className="border p-2">
                {isAdvance ? "" : row.orderDate ? new Date(row.orderDate).toLocaleDateString() : ""}
              </td>
              <td className="border p-2">{row.orderStatus || ""}</td>
              <td className="border p-2">{row.summStart}</td>
              <td className="border p-2">{row.summIn}</td>
              <td className="border p-2">{row.summOut}</td>
              <td className="border p-2">{row.summEnd}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
