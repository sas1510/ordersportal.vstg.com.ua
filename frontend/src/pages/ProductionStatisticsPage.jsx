import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import { FaSearch, FaExclamationTriangle } from "react-icons/fa";
import "./ProductionStatisticsPage.css";
import { useNotification } from "../hooks/useNotification";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  const { addNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rawData, setRawData] = useState(null);
  const [dealerData, setDealerData] = useState(null);

  const [dateInputs, setDateInputs] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`,
  });

  const [searchParams, setSearchParams] = useState({ ...dateInputs });

  // Використовуємо useCallback для функції завантаження
  const loadAllData = useCallback(async (retries = 2) => {
    // 1. Перевірка для адміна (якщо дилер не обраний)
    if (isAdmin && !dealerGuid) {
      setRawData(null);
      setDealerData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
  const params = {
    date_from: searchParams.from,
    date_to: searchParams.to,
    contractor_guid: dealerGuid
  };

  const [resFull, resOrder] = await Promise.allSettled([
    axiosInstance.get("/full-statistics/", { params }),
    axiosInstance.get("/order-statistics/", { params }),
  ]);

  // Перевірка full statistics
  if (resFull.status === "rejected") {
    const status = resFull.reason?.response?.status;
    const message =
      resFull.reason?.response?.data?.detail ||
      resFull.reason?.response?.data?.error ||
      "Помилка завантаження статистики";

    setError(`Full statistics: ${message}`);
    setLoading(false);
    return;
  }

  // Перевірка order statistics
  if (resOrder.status === "rejected") {
    const status = resOrder.reason?.response?.status;
    const message =
      resOrder.reason?.response?.data?.detail ||
      resOrder.reason?.response?.data?.error ||
      "Помилка завантаження замовлень";

    setError(`Order statistics: ${message}`);
    setLoading(false);
    return;
  }

  // recovery перевірка
  if (
    resFull.value.data?.error === "database_recovery" ||
    resOrder.value.data?.error === "database_recovery"
  ) {
    const msg =
      resFull.value.data?.detail ||
      resOrder.value.data?.detail ||
      "База даних оновлюється";

    setError(msg);
    setLoading(false);
    return;
  }

  setRawData(resFull.value.data);
  setDealerData(resOrder.value.data);
  setLoading(false);

} catch (err) {
  if (process.env.NODE_ENV === "development") {
    console.error("Error loading statistics data:", err);
  }

  setError("Критична помилка завантаження");
  setLoading(false);
}
  }, [searchParams, dealerGuid, isAdmin, addNotification]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      loadAllData();
    }
    return () => { isMounted = false; };
  }, [loadAllData, refreshTrigger]);

  const handleSearch = () => {
    setSearchParams({ ...dateInputs });
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="portal-body ">
      <div className="max-w-[1334px] w-full mx-auto column mt-10 gap-4">
      <div className="column">
        <h2 className="page-title-analytics">Статистика</h2>
        <div className="controls-row row ai-center jc-sb wrap gap-2">
          <div className="year-selector row ai-center gap-2">
            <input
              type="date"
              value={dateInputs.from}
              onChange={(e) => setDateInputs({ ...dateInputs, from: e.target.value })}
              className="year-select-custom"
            />
            <input
              type="date"
              value={dateInputs.to}
              onChange={(e) => setDateInputs({ ...dateInputs, to: e.target.value })}
              className="year-select-custom"
            />

            {isAdmin && <DealerSelect value={dealerGuid} onChange={setDealerGuid} />}

            <button
              className="btn-search-stats"
              onClick={handleSearch}
              disabled={loading || (isAdmin && !dealerGuid)}
            >
              <FaSearch /> {loading ? "Завантаження..." : "Сформувати"}
            </button>
          </div>
        </div>
      </div>

      <div className="stats-content-area">
        {/* 1. ПОМИЛКА */}
        {error ? (
          <div className="error-empty-state column align-center jc-center" style={{ minHeight: "400px" }}>
            <FaExclamationTriangle className="text-red mb-16" style={{ fontSize: "64px" }} />
            <h3 className="font-size-24 weight-600 mb-8">Дані тимчасово недоступні</h3>
            {/* <p className="text-grey mb-8 text-center">{error}</p> */}
            <p className="text-grey mb-24 text-center">Спробуйте повторити запит через декілька хвилин</p>
            <button className="btn-search-stats" onClick={handleSearch}>Повторити запит</button>
          </div>
        ) : (
          <>
            {/* 2. ВИБІР ДИЛЕРА ДЛЯ АДМІНА */}
            {isAdmin && !dealerGuid ? (
              <div className="empty-state-info column align-center jc-center" style={{ minHeight: "400px" }}>
                <p className="text-grey">Будь ласка, оберіть дилера для перегляду статистики</p>
              </div>
            ) : (
              <>
                {/* 3. LOADER */}
                {loading && !rawData ? (
                  <div className="loading-spinner-wrapper">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <>
                    {/* 4. КОНТЕНТ */}
                    {rawData || dealerData ? (
                      <ProductionStatisticsBlock
                        rawData={rawData}
                        dealerData={dealerData}
                        dateRange={searchParams}
                      />
                    ) : (
                      /* 5. ПОРОЖНІЙ СТАН */
                      !loading && (
                        <div className="empty-state-info column align-center jc-center" style={{ minHeight: "400px" }}>
                          <FaExclamationTriangle className="text-grey mb-16" style={{ fontSize: "64px" }} />
                          <h3>Дані відсутні</h3>
                          <p className="text-grey">Спробуйте змінити період або повторити запит</p>
                        </div>
                      )
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}