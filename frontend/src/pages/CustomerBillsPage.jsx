import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import "./CustomerBillsPage.css";
import { FaFilePdf, FaSearch } from "react-icons/fa";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import CreateCustomerBillModal from "./CreateCustomerBillModal";
import { useNotification } from "../components/notification/Notifications";
/* =========================
   HELPERS
   ========================= */

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

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("uk-UA") : "—";

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* =========================
   COMPONENT
   ========================= */

const CustomerBillsPage = () => {
  const {
    dealerGuid,
    setDealerGuid,
    isAdmin,
    currentUser,
  } = useDealerContext();

  const USER_ROLE = currentUser?.role;

  const { dateFrom: defaultFrom, dateTo: defaultTo } =
    getCurrentMonthRange();

  const [bills, setBills] = useState([]);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState("");

  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const { addNotification } = useNotification();

  /* =========================
     FETCH
     ========================= */

  const fetchBills = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        date_from: dateFrom,
        date_to: dateTo,
      };

      if (isAdmin) {
        if (!dealerGuid) {
          setBills([]);
          setLoading(false);
          return;
        }
        params.contractor = dealerGuid;
      }

      const res = await axiosInstance.get(
        "/payments/dealers/bills/",
        { params }
      );

      setBills(res.data?.items || []);
    } catch (err) {
      console.error(err);
      const errorMsg = "Не вдалося завантажити список рахунків";
      setError(errorMsg);

      // ⬅️ Додаємо сповіщення про помилку
     
    } finally {
      setLoading(false);
    }
  };


  /* =========================
     EFFECTS
     ========================= */

  useEffect(() => {
  // dealer / customer → одразу вантажимо
  if (!isAdmin) {
    fetchBills();
    return;
  }

  // admin → тільки після вибору дилера
  if (isAdmin && dealerGuid) {
    fetchBills();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dealerGuid, isAdmin]);


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

  

  /* =========================
     RENDER
     ========================= */

  return (
    <div className="customer-bills-page">

      {/* ===== PAGE HEADER ===== */}
      <div className="customer-bills-header">
        <h1 className="page-title">Рахунки</h1>

        <div className="bills-filter">

          {/* Dates */}
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

          {/* ADMIN: dealer select */}
          {isAdmin && (
            <div className="filter-item-bill">
              <label>Дилер</label>
              <DealerSelect
                value={dealerGuid}
                onChange={setDealerGuid}
              />
            </div>
          )}

          {/* Search */}
          <button
            className="btn btn-filter"
            onClick={fetchBills}
            disabled={!dealerGuid}
          >
            <FaSearch className="btn-icon" />
            <span>Пошук</span>
          </button>

          {/* CREATE BILL */}
          {USER_ROLE === "customer" && (
            <button
              className="btn btn-create-bill"
              onClick={() => setIsCreateBillOpen(true)}
            >
              <i className="fa-solid fa-plus" />
              Додати рахунок
            </button>
          )}
        </div>
      </div>
      

      {/* ===== CONTENT ===== */}
      <div className="customer-bills-panel">
        {error ? (
    
          <div className="error-empty-state column align-center jc-center">
            <span className="icon icon-warning text-red font-size-48 mb-16"></span>
            <h3 className="font-size-20 weight-600 mb-8">Упс! Не вдалося завантажити дані</h3>
            <p className="text-grey mb-24 text-center">
                Виникла проблема під час з'єднання із сервером. <br/>
                Перевірте інтернет та спробуйте ще раз.
            </p>
               <button 
            className="btn btn-primary" 
            onClick={fetchBills}
          >
            <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }} />
            Спробувати ще раз
          </button>
      
        </div>
        ) : bills.length === 0 ? (
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

      {/* ===== MODAL ===== */}
      <CreateCustomerBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        onSuccess={fetchBills}
        // contractorGuid={dealerGuid}   // ✅ ВАЖЛИВО
      />


    </div>
    
  );
};

export default CustomerBillsPage;
