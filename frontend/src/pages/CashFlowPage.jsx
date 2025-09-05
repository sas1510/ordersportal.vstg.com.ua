import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../api/axios";
import ContractorsSelect from "../components/ContractorsSelect";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const CashFlowPage = ({ role }) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [kontrKod, setKontrKod] = useState("");
  const [dateFrom, setDateFrom] = useState("2025-08-01");
  const [dateTo, setDateTo] = useState("2025-08-31");

  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(",", "."));
  };

  const fetchData = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/debt/debt-movement-2019", {
        params: { kontr_kod: kontrKod, dateFrom, dateTo },
      });
      setData(res.data);
    } catch (error) {
      console.error("Помилка завантаження руху коштів:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kontrKod, dateFrom, dateTo]);

// Додати всередину CashFlowPage
const exportToExcel = () => {
  const rows = [];

  filteredData.forEach((day) => {
    day.items.forEach((item, i) => {
      // Парсимо дату з order_number, якщо є "від"
      let orderDate = "";
      const match = item.order_number?.match(/від (\d{2}\.\d{2}\.\d{2})/);
      if (match) {
        orderDate = match[1]; // отримуємо "19.06.25"
      }

      const row = {
        Дата: i === 0 ? day.date : item.contract || "",
        "№ замовл.": item.order_number,
        "Дата замовлення": orderDate,
        "Залишок на початок": parseNumber(item.summStart) || "",
        Прихід: parseNumber(item.summIn) || "",
        Розхід: parseNumber(item.summOut) || "",
        Залишок: parseNumber(item.summEnd) || "",
      };
      rows.push(row);
    });

    // Додаємо підсумок за день
    // const summaryItem = day.items.find((it) => it.order_number === "Підсумок за день");
    // if (summaryItem) {
    //   rows.push({
    //     Дата: "Разом",
    //     "№ замовл.": "",
    //     "Дата замовлення": "",
    //     "Залишок на початок": parseNumber(summaryItem.summStart),
    //     Прихід: parseNumber(summaryItem.summIn),
    //     Розхід: parseNumber(summaryItem.summOut),
    //     Залишок: parseNumber(summaryItem.summEnd),
    //   });
    // }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Рух коштів");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(dataBlob, "CashFlow.xlsx");
};



  // Групування даних за датою
  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const date = row.orderDate?.split(" ")[0] || "Без дати";
      if (!acc[date]) acc[date] = [];
      acc[date].push(row);
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, items]) => ({ date, items }));
  }, [data]);

  // Фільтрація по пошуку
  const filteredData = useMemo(() => {
    if (!searchTerm) return groupedData;
    return groupedData
      .map((day) => {
        const filteredItems = day.items.filter((item) =>
          Object.values(item).some((val) =>
            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        return filteredItems.length ? { ...day, items: filteredItems } : null;
      })
      .filter(Boolean);
  }, [groupedData, searchTerm]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Рух коштів</h1>

      <button
        onClick={exportToExcel}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Експорт в Excel
      </button>


      <div className="flex flex-wrap gap-4 mb-4 items-end">
        {role !== "Dealer" && (
          <ContractorsSelect
            value={kontrKod}
            onChange={setKontrKod}
            role={role}
          />
        )}

        <div>
          <label className="block mb-1 font-semibold">Від:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">До:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

      
      </div>

      {loading ? (
        <div>Завантаження...</div>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100 text-center">
            <tr>
              <th className="border px-3 py-2">Дата</th>
              <th className="border px-3 py-2">№ замовл.</th>
              <th className="border px-3 py-2">Залишок на початок</th>
              <th className="border px-3 py-2">Прихід</th>
              <th className="border px-3 py-2">Розхід</th>
              <th className="border px-3 py-2">Залишок</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Немає даних
                </td>
              </tr>
            ) : (
              filteredData.map((day, di) => {
                // шукаємо "Підсумок за день"
                const summaryItem = day.items.find(
                  (it) => it.order_number === "Підсумок за день"
                );

                return (
                  <React.Fragment key={di}>
                    {/* Рядки даних */}
                    {day.items.map((item, i) => {
                      const isSummary = item.order_number === "Підсумок за день";
                      const isCash = item.order_number === "Каса";

                      let rowClass = "text-center";
                      if (isSummary) return null;
                      else if (isCash) rowClass += " bg-gray-100 font-semibold";

                      return (
                        <tr key={i} className={rowClass}>
                          <td className="border px-3 py-2">
                            {i === 0 ? day.date : item.contract}
                          </td>
                          <td className="border px-3 py-2">{item.order_number}</td>
                          <td className="border px-3 py-2">
                            {parseNumber(item.summStart).toFixed(2)}
                          </td>
                          <td className="border px-3 py-2">
                            {parseNumber(item.summIn)
                              ? parseNumber(item.summIn).toFixed(2)
                              : ""}
                          </td>
                          <td className="border px-3 py-2">
                            {parseNumber(item.summOut)
                              ? parseNumber(item.summOut).toFixed(2)
                              : ""}
                          </td>
                          <td className="border px-3 py-2">
                            {isNaN(parseFloat(item.summEnd))
                              ? item.summEnd
                              : parseNumber(item.summEnd).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Підсумок "Разом" для дня */}
                    {summaryItem && (
                      <tr className="bg-green-600 text-white font-bold text-center">
                        <td className="border px-3 py-2" colSpan="2">
                          Разом:
                        </td>
                        <td className="border px-3 py-2">
                          {parseNumber(summaryItem.summStart).toFixed(2)}
                        </td>
                        <td className="border px-3 py-2">
                          {parseNumber(summaryItem.summIn).toFixed(2)}
                        </td>
                        <td className="border px-3 py-2">
                          {parseNumber(summaryItem.summOut).toFixed(2)}
                        </td>
                        <td className="border px-3 py-2">
                          {isNaN(parseFloat(summaryItem.summEnd))
                            ? summaryItem.summEnd
                            : parseNumber(summaryItem.summEnd).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CashFlowPage;
