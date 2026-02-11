import React, { useState, useCallback, useEffect } from "react";
import axiosInstance from "../api/axios";
import { FaSearch, FaPercent } from "react-icons/fa";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import "./WDSCodesTable.css";
import { formatDateHumanShorter } from "../utils/formatters";

/* ===================== HELPERS ===================== */

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

/* ===================== COMPONENT ===================== */

const WDSCodesTable = () => {
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState(getMonthStart);
  const [dateTo, setDateTo] = useState(getToday);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  /* ===================== DATA LOADER ===================== */

  const loadData = useCallback(async () => {
    if (!dealerGuid) {
      setError("Оберіть дилера");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.get("/get_wds_codes/", {
        params: {
          contractor: dealerGuid,
          date_from: dateFrom,
          date_to: dateTo,
        },
      });

      setItems(res.data?.items || []);
    } catch (e) {
      console.error("WDS load error:", e);
      setError("Помилка завантаження WDS-кодів");
    } finally {
      setLoading(false);
    }
  }, [dealerGuid, dateFrom, dateTo]);

  /* ===================== FIRST LOAD ===================== */

  useEffect(() => {
    if (!isFirstLoad) return;
    if (!dealerGuid) return;

    loadData();
    setIsFirstLoad(false);
  }, [dealerGuid, isFirstLoad, loadData]);

  /* ===================== LOADING ===================== */

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Пошук акційних пропозицій…</div>
      </div>
    );
  }

  /* ===================== RENDER ===================== */

  return (
    //  <div className="wds-codes-page"></div>
    <div className="portal-body">
      {/* ===== HEADER ===== */}
      <div className="customer-bills-header">
        <h1 className="page-title" style={{marginTop: '10px'}}>
          <FaPercent className="icon" />
          Акційні WDS-коди
        </h1>

        {/* ===== FILTERS ===== */}
        <div className="wds-filter">
          <div className="filter-item-bill">
            <label>Дата з</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>

          <div className="filter-item-bill">
            <label>Дата по</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          {isAdmin && (
            <div className="filter-item-bill">
              <label>Дилер</label>
              <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
            </div>
          )}

          <button className="btn-filter" onClick={loadData} disabled={!dealerGuid}>
            <FaSearch />
            Показати
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="wds-codes-panel">
        {error ? (
          <div className="no-data text-danger">{error}</div>
        ) : items.length === 0 ? (
          <div className="no-data">За вказаний період акційних кодів не знайдено</div>
        ) : (
          <>
            {/* ===== DESKTOP TABLE ===== */}
            <div className="desktop-only">
              <table className="wds-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>WDS Код</th>
                    <th>№ Замовлення</th>
                    <th>Серія профілю</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => (
                    <tr key={index}>
                      <td>{formatDateHumanShorter(row.Date)}</td>
                      <td><span className="badge-wds">{row.WDSCode}</span></td>
                      <td className="text-bold">{row.OrderNumber}</td>
                      <td>{row.SerieName || "Стандарт"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== MOBILE CARDS ===== */}
            <div className="mobile-only wds-mobile-list">
              {items.map((row, index) => (
                <div className="wds-card" key={index}>
                  <div className="row"><span>Дата</span><b>{formatDateHumanShorter(row.Date)}</b></div>
                  <div className="row"><span>WDS</span><span className="badge-wds">{row.WDSCode}</span></div>
                  <div className="row"><span>Замовлення</span><b>{row.OrderNumber}</b></div>
                  <div className="row"><span>Серія</span>{row.SerieName || "Стандарт"}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WDSCodesTable;
