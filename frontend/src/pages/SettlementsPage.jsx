import React, { useState, useEffect } from "react";

export default function SettlementsPage() {
  const [role, setRole] = useState("");
  const [contractor, setContractor] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState([]);

  // Імітація отримання ролі користувача з localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("role"); // наприклад: 'Admin' або 'Dealer'
    const contractorId = localStorage.getItem("dealerContractorId"); // для дилера
    if (savedRole) {
      setRole(savedRole);
      if (savedRole === "Dealer" && contractorId) {
        setContractor(contractorId); // дилеру не показуємо селект
      }
    }
  }, []);

  const contractors = [
    { id: "1", name: "Контрагент А" },
    { id: "2", name: "Контрагент Б" },
  ];

  const loadData = () => {
    if (!dateFrom || !dateTo || (role === "Admin" && !contractor)) {
      alert("Будь ласка, виберіть контрагента та дати");
      return;
    }

    const fakeData = [
      {
        document: "Документ 1",
        orderNumber: "5014",
        startBalance: 1000,
        income: 200,
        expense: 150,
        endBalance: 1050,
      },
      {
        document: "Документ 2",
        orderNumber: "5020",
        startBalance: 1050,
        income: 0,
        expense: 300,
        endBalance: 750,
      },
    ];
    setData(fakeData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Взаєморозрахунки</h1>

      <div className="flex gap-4 mb-6 items-end">
        {role === "Admin" && (
          <div className="flex flex-col">
            <label>Контрагент:</label>
            <select
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">-- Оберіть контрагента --</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col">
          <label>Дата з:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label>Дата по:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Завантажити
        </button>
      </div>

      {data.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 px-3 py-1">Документ</th>
              <th className="border border-gray-300 px-3 py-1">№ замовл.</th>
              <th className="border border-gray-300 px-3 py-1">Залишок на початок</th>
              <th className="border border-gray-300 px-3 py-1">Прихід</th>
              <th className="border border-gray-300 px-3 py-1">Розхід</th>
              <th className="border border-gray-300 px-3 py-1">Залишок на кінець</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="even:bg-gray-100">
                <td className="border border-gray-300 px-3 py-1">{row.document}</td>
                <td className="border border-gray-300 px-3 py-1">{row.orderNumber}</td>
                <td className="border border-gray-300 px-3 py-1">{row.startBalance}</td>
                <td className="border border-gray-300 px-3 py-1">{row.income}</td>
                <td className="border border-gray-300 px-3 py-1">{row.expense}</td>
                <td className="border border-gray-300 px-3 py-1">{row.endBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
