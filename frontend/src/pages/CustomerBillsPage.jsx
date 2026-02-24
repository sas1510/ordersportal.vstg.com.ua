import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import "./CustomerBillsPage.css";
import { FaFilePdf, FaSearch, FaSpinner } from "react-icons/fa";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import CreateCustomerBillModal from "./CreateCustomerBillModal";
import { useNotification } from "../components/notification/Notifications";

/* =========================
   HELPERS
   ========================= */
const getCurrentMonthRange = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { dateFrom, dateTo };
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("uk-UA") : "—");
const formatMoney = (v) => Number(v || 0).toLocaleString("uk-UA", { minimumFractionDigits: 2 });

/* =========================
   COMPONENT
   ========================= */
const CustomerBillsPage = () => {
  const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
  const { addNotification } = useNotification();
  const USER_ROLE = currentUser?.role;

  const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
  const [bills, setBills] = useState([]);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState("");
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

  // Стан для конкретної кнопки PDF
  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

  const fetchBills = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      if (isAdmin && dealerGuid) params.contractor = dealerGuid;
      if (isAdmin && !dealerGuid) { setBills([]); setLoading(false); return; }

      const res = await axiosInstance.get("/payments/dealers/bills/", { params });
      setBills(res.data?.items || []);
    } catch (err) {
      setError("Не вдалося завантажити список");
    } finally {
      setLoading(false);
    }
  };
const handleDownloadPDF = async (billGuid, billNumber) => {
  if (!billGuid || billGuid === "undefined") {
    addNotification("Помилка: Невірний ID рахунку", "error");
    return;
  }

  setPdfDownloadingId(billGuid);

  try {
    const response = await axiosInstance.post(
      `/payments/get_bill_pdf/${billGuid}/`,
      { 
        BillGuid: billGuid, // Відповідає структурі 1С
        contractor_guid: dealerGuid // Потрібно для resolve_contractor, якщо ви Адмін
      },
      { responseType: "blob" }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    addNotification("Файл завантажено", "success");
  } catch (err) {
    addNotification("Помилка при завантаженні PDF", "error");
  } finally {
    setPdfDownloadingId(null);
  }
};

  useEffect(() => {
    if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
  }, [dealerGuid, isAdmin]);

  if (loading) return <div className="loading-text">Завантаження…</div>;

  return (
    <div className="portal-body">
      <div className="customer-bills-header">
        <h1 className="page-title">Рахунки</h1>
        <div className="bills-filter">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {isAdmin && <DealerSelect value={dealerGuid} onChange={setDealerGuid} />}
          <button className="btn btn-filter" onClick={fetchBills} disabled={isAdmin && !dealerGuid}>
            <FaSearch /> Пошук
          </button>
          {USER_ROLE === "customer" && (
            <button className="btn btn-create-bill" onClick={() => setIsCreateBillOpen(true)}>
               + Додати рахунок
            </button>
          )}
        </div>
      </div>

      <div className="customer-bills-panel">
        <table className="customer-bills-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>№ рахунку</th>
              <th className="center">Сума</th>
              <th className="center">Файл</th>
            </tr>
          </thead>
          <tbody>

            {bills.map((b) => (
              <tr key={b.BillGuid}> {/* Виправлено регістр */}
                <td>{formatDate(b.BillDate)}</td>
                <td className="text-bold">{b.BillNumber}</td>
                <td className="center">{formatMoney(b.TotalAmount)}</td>
                <td className="center">
                  <button
                    className="btn-bill-download"
                    disabled={pdfDownloadingId !== null}
                    onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)} // Виправлено регістр
                  >
                    {pdfDownloadingId === b.BillGuid ? (
                      <FaSpinner className="pdf-icon spinning" />
                    ) : (
                      <FaFilePdf className="pdf-icon" />
                    )}
                    <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateCustomerBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        onSuccess={fetchBills}
      />
    </div>
  );
};

export default CustomerBillsPage;