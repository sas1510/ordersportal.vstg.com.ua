import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios"; // налаштуй axios з базовим URL та авторизацією

export default function UrgentCallLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await axiosInstance.get("/UrgentCall");
        setLogs(response.data);
        setFilteredLogs(response.data);
      } catch (error) {
        console.error("Помилка при завантаженні логів:", error);
      }
    }
    fetchLogs();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    setFilteredLogs(
      logs.filter((log) => {
        const logDate = new Date(log.sentAt);

        const afterStart = startDate ? logDate >= new Date(startDate) : true;
        const beforeEnd = endDate ? logDate <= new Date(endDate + "T23:59:59") : true;

        const matchesSearch =
          log.dealerName.toLowerCase().includes(lowerSearch) ||
          log.department.toLowerCase().includes(lowerSearch) ||
          log.managerName.toLowerCase().includes(lowerSearch) ||
          new Date(log.sentAt).toLocaleString().toLowerCase().includes(lowerSearch);

        return afterStart && beforeEnd && matchesSearch;
      })
    );
  }, [search, logs, startDate, endDate]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-md shadow-md mt-8">
      <h1 className="text-4xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Журнал термінових дзвінків
      </h1>

      {/* Панель фільтрів */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Пошук..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-400 rounded-md flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
        />

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-700 font-semibold">Від:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-700 font-semibold">До:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
          />
        </div>
      </div>

      {/* Таблиця */}
      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full border-collapse border border-gray-400 text-base">
          <thead className="bg-gray-200 select-none">
            <tr>
              <th className="border border-gray-500 px-4 py-2 text-gray-700 font-semibold text-left whitespace-nowrap text-lg">
                Дата
              </th>
              <th className="border border-gray-500 px-4 py-2 text-gray-700 font-semibold text-left whitespace-nowrap text-lg">
                Дилер
              </th>
              <th className="border border-gray-500 px-4 py-2 text-gray-700 font-semibold text-left whitespace-nowrap text-lg">
                Відділ
              </th>
              <th className="border border-gray-500 px-4 py-2 text-gray-700 font-semibold text-left whitespace-nowrap text-lg">
                Керівник
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-600 text-base">
                  Немає записів
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.sentAt + log.dealerName} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 whitespace-nowrap">
                    {log.dealerName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 whitespace-nowrap">
                    {log.department}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 whitespace-nowrap">
                    {log.managerName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
