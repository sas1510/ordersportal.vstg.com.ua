import React, { useState, useContext, useMemo } from "react";
import axiosInstance from "../api/axios";
import ContractorsSelect from "../components/ContractorsSelect";
import { RoleContext } from "../context/RoleContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function DebtPage() {
  const [kontrKod, setKontrKod] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState([]);

  const { role: userRole } = useContext(RoleContext);
  const isDealer = userRole === "Dealer";

  const loadData = async () => {
    if (!isDealer && !kontrKod) {
      alert("Виберіть контрагента!");
      return;
    }
    if (!start || !end) {
      alert("Заповніть всі поля дати!");
      return;
    }

    try {
      const res = await axiosInstance.get("/debt/movement", {
        params: { kontrKod: kontrKod ? kontrKod : "", start, end },
      });

      let sortedData = res.data.sort(
        (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
      );

      // Витягуємо авансовий договір і ставимо його першим
      const advance = sortedData.find((r) => !r.orderNumber);
      const others = sortedData.filter((r) => r.orderNumber);

      if (advance) {
        sortedData = [advance, ...others];
      }

      setData(sortedData);
    } catch (error) {
      console.error(error);
      alert("Помилка завантаження даних");
    }
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("Немає даних для експорту");
      return;
    }

    const rows = [
      ["Документ", "№ замовл.", "Статус", "Залишок на початок", "Прихід", "Розхід", "Залишок на кінець"]
    ];

    let totalStart = 0,
      totalIn = 0,
      totalOut = 0,
      totalEnd = 0;

    data.forEach((r, idx) => {
      const isAdvance = !r.orderNumber;
      if (isAdvance && idx === 0) {
        rows.push([
          r.contract || "Авансовий договір",
          "",
          r.orderStatus || "",
          r.summStart || 0,
          r.summIn || 0,
          r.summOut || 0,
          r.summEnd || 0,
        ]);
      } else {
        rows.push([
          "",
          r.orderNumber || "-",
          r.orderStatus || "",
          r.summStart || 0,
          r.summIn || 0,
          r.summOut || 0,
          r.summEnd || 0,
        ]);

        // у підсумок рахуємо лише не авансові
        totalStart += r.summStart || 0;
        totalIn += r.summIn || 0;
        totalOut += r.summOut || 0;
        totalEnd += r.summEnd || 0;
      }
    });

    rows.push(["Підсумок:", "", "", totalStart, totalIn, totalOut, totalEnd]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DebtMovement");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "DebtMovement.xlsx");
  };

  // підсумок теж рахуємо без авансового
  const totals = useMemo(() => {
    return data
      .filter((r) => r.orderNumber) // тільки не авансові
      .reduce(
        (acc, r) => {
          acc.start += r.summStart || 0;
          acc.in += r.summIn || 0;
          acc.out += r.summOut || 0;
          acc.end += r.summEnd || 0;
          return acc;
        },
        { start: 0, in: 0, out: 0, end: 0 }
      );
  }, [data]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6 bg-gray-50 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold text-[#004080]">Рух заборгованості</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <ContractorsSelect value={kontrKod} onChange={setKontrKod} role={userRole} />
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border border-gray-400 rounded-md px-3 py-2"
        />
        <button
          onClick={loadData}
          className="bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
        >
          🔍 Завантажити
        </button>
        <button
          onClick={exportToExcel}
          className="bg-gradient-to-r from-[#10b981] to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
        >
          📄 Експорт в XLS
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow">
        <table className="min-w-[1000px] w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200 text-gray-700 select-none">
            <tr>
              <th className="border px-3 py-2 text-left">Документ</th>
              <th className="border px-3 py-2 text-left">№ замовл.</th>
              <th className="border px-3 py-2 text-left">Статус</th>
              <th className="border px-3 py-2 text-right">Залишок на початок</th>
              <th className="border px-3 py-2 text-right">Прихід</th>
              <th className="border px-3 py-2 text-right">Розхід</th>
              <th className="border px-3 py-2 text-right">Залишок на кінець</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-600">
                  Немає даних
                </td>
              </tr>
            ) : (
              <>
                {data.map((r, idx) => {
                  const isAdvance = !r.orderNumber;
                  return (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${isAdvance && idx === 0 ? "bg-yellow-100 font-bold" : ""}`}
                    >
                      <td className="border px-3 py-2">
                        {isAdvance && idx === 0 ? r.contract || "Авансовий договір" : ""}
                      </td>
                      <td className="border px-3 py-2">{r.orderNumber || ""}</td>
                      <td className="border px-3 py-2">{r.orderStatus || ""}</td>
                      <td className="border px-3 py-2 text-right">{r.summStart?.toFixed(2) || "0.00"}</td>
                      <td className="border px-3 py-2 text-right">{r.summIn?.toFixed(2) || "0.00"}</td>
                      <td className="border px-3 py-2 text-right">{r.summOut?.toFixed(2) || "0.00"}</td>
                      <td className="border px-3 py-2 text-right">{r.summEnd?.toFixed(2) || "0.00"}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-gray-100">
                  <td className="border px-3 py-2 text-center">Підсумок:</td>
                  <td className="border px-3 py-2"></td>
                  <td className="border px-3 py-2"></td>
                  <td className="border px-3 py-2 text-right">{totals.start.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{totals.in.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{totals.out.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{totals.end.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
