import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import "./CustomerBillsPage.css";
import { FaFilePdf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus } from "react-icons/fa";


const USER = JSON.parse(localStorage.getItem("user") || "{}");
const CONTRACTOR_GUID = USER.user_id_1c;
const USER_ROLE = USER.role; 


const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const dateFrom = new Date(year, month, 1)
    .toISOString()
    .split("T")[0];

  const dateTo = new Date(year, month + 1, 0)
    .toISOString()
    .split("T")[0];

  return { dateFrom, dateTo };
};



const CustomerBillsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);


  const navigate = useNavigate();

  const fetchBills = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.get(
        `/dealers/${CONTRACTOR_GUID}/bills/`,
        {
          params: {
            date_from: dateFrom || null,
            date_to: dateTo || null,
          },
        }
      );

      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Помилка при завантаженні рахунків");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  /* =========================
     HELPERS
     ========================= */
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("uk-UA") : "—";

  const formatMoney = (v) =>
    Number(v || 0).toLocaleString("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* =========================
     STATES
     ========================= */
  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Завантаження…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="column align-center gap-14">
        <span className="icon icon-warning font-size-58 text-danger"></span>
        <div className="font-size-24 text-danger">{error}</div>
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
  <div className="customer-bills-page">

    {/* ===== PAGE HEADER ===== */}
    <div className="customer-bills-header">
      <h1 className="page-title">Рахунки</h1>

      <div className="bills-filter">
        <div className="filter-item-bill">
          <label>Дата з</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-item-bill">
          <label>Дата по</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <button className="btn btn-filter" onClick={fetchBills}>
          <FaSearch className="btn-icon" />
          <span>Пошук</span>
        </button>

        {USER_ROLE === "customer" && (
          <button
            className="btn btn-create-bill"
            onClick={() => navigate("/finance/create-bill")}
          >
            <FaPlus className="btn-icon" />
            <span>Додати рахунок</span>
          </button>
        )}

      </div>
    </div>

    {/* ===== CONTENT PANEL ===== */}
    <div className="customer-bills-panel">

      {bills.length === 0 ? (
        <div className="no-data">Немає рахунків</div>
      ) : (
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
              <tr key={b.BillGUID}>
                <td>{formatDate(b.BillDate)}</td>
                <td className="text-bold">{b.BillNumber}</td>
                <td className="center">
                  {formatMoney(b.TotalAmount)}
                </td>

                <td className="center">
                  <button
                    className="btn-bill-download"
                    title="Завантажити PDF (скоро)"
                    onClick={() => console.log("PDF MOCK", b.BillGUID)}
                  >
                    <FaFilePdf className="pdf-icon" />
                    <span>PDF</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  </div>
);
};


export default CustomerBillsPage;
