import React, { useState, useCallback, useEffect } from "react";
import axiosInstance from "../api/axios";
import { FaSearch, FaPercent } from "react-icons/fa";
import { useTranslation } from 'react-i18next'; // Імпорт
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import "./WDSCodesTable.css";

import { formatDateHumanShorter } from "../utils/formatters";

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const WDSCodesTable = () => {
  const { t, i18n } = useTranslation();
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState(getMonthStart);
  const [dateTo, setDateTo] = useState(getToday);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadData = useCallback(async () => {
    if (!dealerGuid) {
      setError(t('wds.error_select_dealer'));
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
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading WDS codes:", e);
      }
      setError(t('wds.error_load'));
    } finally {
      setLoading(false);
    }
  }, [dealerGuid, dateFrom, dateTo, t]);

  useEffect(() => {
    if (!isFirstLoad) return;
    if (!dealerGuid) return;

    loadData();
    setIsFirstLoad(false);
  }, [dealerGuid, isFirstLoad, loadData]);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">{t('wds.loading_text')}</div>
      </div>
    );
  }

  return (
    <div className="portal-body" style={{justifyContent: 'center'}} >
      <div className="max-w-[1334px] mx-auto ">
        <div className="customer-bills-header">
          <h1 className="page-title" style={{ marginTop: "10px" }}>
            <FaPercent className="icon" />
            {t('wds.title')}
          </h1>

          <div className="wds-filter">
            <div className="filter-item-bill">
              <label>{t('common.date_from')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-item-bill">
              <label>{t('common.date_to')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="filter-item-bill">
                <label>{t('common.dealer')}</label>
                <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
              </div>
            )}

            <button
              className="btn-filter"
              onClick={loadData}
              disabled={!dealerGuid}
            >
              <FaSearch />
              {t('common.show')}
            </button>
          </div>
        </div>

        <div className="wds-codes-panel">
          {error ? (
            <div className="no-data text-danger">{error}</div>
          ) : items.length === 0 ? (
            <div className="no-data">
              {t('wds.no_data')}
            </div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="desktop-only">
                <table className="wds-table">
                  <thead>
                    <tr>
                      <th>{t('wds.table_date')}</th>
                      <th>{t('wds.table_code')}</th>
                      <th>{t('wds.table_order_no')}</th>
                      <th>{t('wds.table_series')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, index) => (
                      <tr key={index}>
                        <td>{formatDateHumanShorter(row.Date, i18n.language)}</td>
                        <td>
                          <span className="badge-wds">{row.WDSCode}</span>
                        </td>
                        <td className="text-bold">{row.OrderNumber}</td>
                        <td>{row.SerieName || t('wds.default_series')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="mobile-only wds-mobile-list">
                {items.map((row, index) => (
                  <div className="wds-card" key={index}>
                    <div className="row">
                      <span>{t('wds.table_date')}</span>
                      <b>{formatDateHumanShorter(row.Date, i18n.language)}</b>
                    </div>
                    <div className="row">
                      <span>{t('wds.table_code_short')}</span>
                      <span className="badge-wds">{row.WDSCode}</span>
                    </div>
                    <div className="row">
                      <span>{t('wds.table_order_short')}</span>
                      <b>{row.OrderNumber}</b>
                    </div>
                    <div className="row">
                      <span>{t('wds.table_series_short')}</span>
                      {row.SerieName || t('wds.default_series')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WDSCodesTable;