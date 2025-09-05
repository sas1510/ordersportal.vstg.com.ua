import { useEffect, useState } from "react";

export default function MoneyMovement() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/debt-movement-2019?kontrKod=123&dateFrom=2025-08-01&dateTo=2025-08-31")
      .then(res => res.json())
      .then(setData);
  }, []);

  const grouped = data.reduce((acc, row) => {
    const date = row.orderDate.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(row);
    return acc;
  }, {});

  return (
    <div className="p-4">
      {Object.entries(grouped).map(([date, rows]) => (
        <div key={date} className="mb-6 border rounded-2xl shadow bg-white">
          <div className="bg-blue-200 p-2 font-bold">{date}</div>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">№ замовл.</th>
                <th className="p-2">Залишок на початок</th>
                <th className="p-2">Прихід</th>
                <th className="p-2">Розхід</th>
                <th className="p-2">Залишок</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{row.orderNumber}</td>
                  <td className="p-2">{row.summStart}</td>
                  <td className="p-2">{row.summIn}</td>
                  <td className="p-2">{row.summOut}</td>
                  <td className="p-2">{row.summEnd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
