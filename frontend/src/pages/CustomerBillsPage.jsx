import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import "./CustomerBillsPage.css";
import { FaFilePdf, FaSearch, FaSpinner } from "react-icons/fa";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import CreateCustomerBillModal from "./CreateCustomerBillModal";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";

/* =========================
   HELPERS
   ========================= */
const getCurrentMonthRange = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { dateFrom, dateTo };
};

// Updated locale to en-US for English formatting
const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
const formatMoney = (v, lang = "en-US") =>
  Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

/* =========================
   COMPONENT
   ========================= */
const CustomerBillsPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en-US";

  const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
  const { addNotification } = useNotification();
  const USER_ROLE = currentUser?.role;

  const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
  const [bills, setBills] = useState([]);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [loading, setLoading] = useState(!isAdmin);
  const [_error, setError] = useState("");
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

  const fetchBills = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      if (isAdmin && dealerGuid) params.contractor = dealerGuid;
      if (isAdmin && !dealerGuid) {
        setBills([]);
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get("/payments/dealers/bills/", {
        params,
      });
      setBills(res.data?.items || []);
    } catch (err) {
      setError(t("bills.error_loading"));
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching bills:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (billGuid, billNumber) => {
    if (!billGuid || billGuid === "undefined") {
      addNotification(t("bills.error_invalid_id"), "error");
      return;
    }

    setPdfDownloadingId(billGuid);

    try {
      const response = await axiosInstance.post(
        `/payments/get_bill_pdf/${billGuid}/`,
        {
          BillGuid: billGuid,
          contractor_guid: dealerGuid,
        },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification(t("bills.file_downloaded"), "success");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("PDF Download Error:", err);
      }
      addNotification(t("bills.error_downloading"), "error");
    } finally {
      setPdfDownloadingId(null);
    }
  };

  useEffect(() => {
    if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
  }, [dealerGuid, isAdmin]);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="portal-body">
      <div className="max-w-[1334px] mx-auto ">
        <div className="customer-bills-header">
          <h1 className="page-title">{t("bills.title")}</h1>
          <div className="bills-filter">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {isAdmin && (
              <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
            )}
            <button
              className="btn btn-filter-bill"
              onClick={fetchBills}
              disabled={isAdmin && !dealerGuid}
            >
              <FaSearch /> {t("common.search")}
            </button>
            {USER_ROLE === "customer" && (
              <button
                className="btn btn-create-bill"
                onClick={() => setIsCreateBillOpen(true)}
              >
                + {t("bills.add_bill")}
              </button>
            )}
          </div>
        </div>

        <div className="customer-bills-panel">
          <table className="customer-bills-table">
            <thead>
              <tr>
                <th>{t("bills.date")}</th>
                <th>{t("bills.bill_number")}</th>
                <th className="center">{t("bills.amount")}</th>
                <th className="center">{t("bills.file")}</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.BillGuid}>
                  <td>{formatDate(b.BillDate, currentLang)}</td>
                  <td className="text-bold">{b.BillNumber}</td>
                  <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
                  <td className="center">
                    <button
                      className="btn-bill-download"
                      disabled={pdfDownloadingId !== null}
                      onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
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
          {bills.length === 0 && (
            <div className="no-data-placeholder">
               {t("bills.no_bills_found")}
            </div>
          )}
        </div>

        <CreateCustomerBillModal
          isOpen={isCreateBillOpen}
          onClose={() => setIsCreateBillOpen(false)}
          onSuccess={fetchBills}
        />
      </div>
    </div>
  );
};

export default CustomerBillsPage;