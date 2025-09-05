import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import ContractorsSelect from "../components/ContractorsSelect";
import { RoleContext } from "../context/RoleContext";

export default function CustomerBills({ role }) {
  const [kodKontr, setKodKontr] = useState("");
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { role: userRole } = useContext(RoleContext);
  const navigate = useNavigate();

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/customerbill/list", {
        params: role !== "Dealer" ? { kodKontr } : {}
      });
      setBills(res.data);
      filterByDate(res.data, fromDate, toDate);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Помилка при отриманні рахунків");
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (billsList, from, to) => {
    let filtered = billsList;
    if (from) filtered = filtered.filter(b => new Date(b.date) >= new Date(from));
    if (to) filtered = filtered.filter(b => new Date(b.date) <= new Date(to));
    setFilteredBills(filtered);
  };

  const handleAddBill = () => {
    navigate("/create-bill");
  };

  const handleDateChange = () => {
    filterByDate(bills, fromDate, toDate);
  };

  const handleOpenPDF = async (guidOrBase64, isBase64 = false) => {
    try {
      let fileURL;

      if (isBase64) {
        // Base64 -> Blob
        const byteCharacters = atob(guidOrBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], { type: "application/pdf" });
        fileURL = URL.createObjectURL(file);
      } else {
        // Завантажуємо PDF через API (blob)
        const res = await axiosInstance.get(`/customerbill/pdf`, {
          params: { guid: guidOrBase64 },
          responseType: "blob",
        });
        fileURL = URL.createObjectURL(res.data);
      }

      // Відкриваємо PDF у новій вкладці
      window.open(fileURL, "_blank");

      // Через деякий час звільняємо пам’ять
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000 * 60);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Помилка при відкритті PDF");
    }
  };

  return (
    <div className="p-4">
      <h2>Рахунки клієнтів</h2>

      {role !== "Dealer" && (
        <ContractorsSelect value={kodKontr} onChange={setKodKontr} role={userRole} />
      )}

      <div className="mt-2 flex gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          onBlur={handleDateChange}
          className="border p-1 rounded"
          placeholder="Дата з"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          onBlur={handleDateChange}
          className="border p-1 rounded"
          placeholder="Дата по"
        />
        <button onClick={fetchBills} className="bg-blue-500 text-white p-2 rounded">
          Пошук
        </button>
        <button onClick={handleAddBill} className="bg-green-500 text-white p-2 rounded">
          Додати рахунок
        </button>
      </div>

      {loading && <p className="mt-2">Завантаження...</p>}

      {filteredBills.length > 0 ? (
        <table className="mt-4 border-collapse border border-gray-300 w-full">
          <thead>
            <tr>
              <th className="border p-2">Номер</th>
              <th className="border p-2">Дата</th>
              <th className="border p-2">Сума</th>
              <th className="border p-2">PDF</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill, idx) => (
              <tr key={idx}>
                <td className="border p-2">{bill.number}</td>
                <td className="border p-2">{bill.date}</td>
                <td className="border p-2">{bill.amount}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleOpenPDF(bill.guid)}
                    className="bg-gray-700 text-white p-1 rounded"
                  >
                    Відкрити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p className="mt-2">Рахунків не знайдено</p>
      )}
    </div>
  );
}
