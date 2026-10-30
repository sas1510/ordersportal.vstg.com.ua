import DealerSelectWithAll from "./DealerSelectWithAll";
import { DEALER_REPORT_GROUP_OPTIONS, dealerGroupForSelection } from "../utils/dealerReportGroups";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useDealerContext } from "../hooks/useDealerContext";
import { FaArrowRight, FaBoxes, FaChartLine, FaMoneyBillWave, FaSearch, FaUsers } from "react-icons/fa";
import "./DealerReportsPage.css";

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function hasPositiveValue(value) {
  return Number(value || 0) > 0;
}

export default function DealerReportsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const { isAdmin, role, isLoading: contextLoading } = useDealerContext();

  const initialFrom = query.get("date_from") || monthStart.toISOString().slice(0, 10);
  const initialTo = query.get("date_to") || monthEnd.toISOString().slice(0, 10);

  const [dateInputs, setDateInputs] = useState({ from: initialFrom, to: initialTo });
  const [searchParams, setSearchParams] = useState({ from: initialFrom, to: initialTo });
  const [selection, setSelection] = useState("__ALL__");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (contextLoading) {
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      setError("Недостатньо прав для перегляду цих звітів.");
      return;
    }

    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get("/dealer-portal-reports/", {
          params: {
            date_from: searchParams.from,
            date_to: searchParams.to,
            dealer_group: dealerGroupForSelection(selection) || undefined,
            contractor_guid: selection !== "__ALL__" && !dealerGroupForSelection(selection) ? selection : undefined,
          },
        });
        if (!cancelled) {
          setReportData(res.data);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Не вдалося завантажити звіти дилерів.",
        );
        setReportData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReports();
    return () => {
      cancelled = true;
    };
  }, [contextLoading, isAdmin, searchParams, selection]);

  const totals = reportData?.totals || {};
  const dealers = reportData?.dealers || [];
  const regions = reportData?.regions || [];
  const topDealers = reportData?.top_dealers || [];
  const insights = reportData?.insights || {};

  const cards = useMemo(
    () => [
      {
        icon: <FaUsers />,
        label: "Дилери у звіті",
        value: formatNumber(totals.dealers_count),
      },
      {
        icon: <FaChartLine />,
        label: "Замовлення",
        value: formatNumber(totals.orders_count),
      },
      {
        icon: <FaBoxes />,
        label: "Конструкції",
        value: formatNumber(totals.total_constructions),
      },
      {
        icon: <FaMoneyBillWave />,
        label: "Загальний оборот",
        value: formatCurrency(totals.total_turnover),
        hint: hasPositiveValue(totals.avg_check) ? "Сер. чек: " + formatCurrency(totals.avg_check) : null,
      },
    ],
    [totals],
  );

  const handleSearch = () => {
    setSearchParams({ ...dateInputs });
  };

  const openDealerReport = (contractorGuid) => {
    const params = new URLSearchParams({
      contractor_guid: contractorGuid,
      date_from: searchParams.from,
      date_to: searchParams.to,
    });
    navigate("/statistics?" + params.toString());
  };

  return (
    <div className="dealer-reports-page">
      <section className="dealer-reports-hero">
        <div>
          <div className="dealer-reports-hero__eyebrow">Звіти дилерів</div>
          <h1>Порівняння дилерів для {role === "admin" ? "адміністратора" : "менеджера"}</h1>
          <p>
            Зведений звіт по всіх доступних дилерах із можливістю відкрити детальну аналітику кожного.
          </p>
        </div>
        {insights?.top_region_name ? (
          <div className="dealer-reports-hero__badge">
            Лідер-регіон: <strong>{insights.top_region_name}</strong>
          </div>
        ) : null}
      </section>

      <section className="dealer-reports-toolbar">
        <div><span>Дилер / група</span><DealerSelectWithAll value={selection} onChange={setSelection} extraOptions={["admin", "director"].includes(role) ? DEALER_REPORT_GROUP_OPTIONS : []} /></div>
        <label>
          <span>З</span>
          <input
            type="date"
            value={dateInputs.from}
            onChange={(e) => setDateInputs((prev) => ({ ...prev, from: e.target.value }))}
          />
        </label>
        <label>
          <span>До</span>
          <input
            type="date"
            value={dateInputs.to}
            onChange={(e) => setDateInputs((prev) => ({ ...prev, to: e.target.value }))}
          />
        </label>
        <button onClick={handleSearch} disabled={loading}>
          <FaSearch />
          <span>{loading ? "Завантаження..." : "Сформувати"}</span>
        </button>
      </section>

      <p className="operational-report-hint"><strong>Які замовлення враховано:</strong> без вибору групи — лише зі станом 1С «Подтверждено». Вони можуть бути у виробництві, готовими або відвантаженими — це окремі етапи виконання. При виборі групи «Дилери», «Філіали», «Експорт» або «Наша фірма» використовується ширший набір статусів, тому змінюються також правила підрахунку показників.</p>
      {error ? <div className="dealer-reports-state is-error">{error}</div> : null}
      {!error && loading ? <div className="dealer-reports-state">Формуємо звіт по дилерах…</div> : null}

      {!error && !loading ? (
        <>
          <section className="dealer-reports-cards">
            {cards.map((card) => (
              <article key={card.label} className="dealer-reports-card">
                <div className="dealer-reports-card__icon">{card.icon}</div>
                <div className="dealer-reports-card__label">{card.label}</div>
                <div className="dealer-reports-card__value">{card.value}</div>
                {card.hint ? <div className="dealer-reports-card__hint">{card.hint}</div> : null}
              </article>
            ))}
          </section>

          <section className="dealer-reports-grid">
            <article className="dealer-reports-panel">
              <div className="dealer-reports-panel__header">
                <h3>Топ дилерів</h3>
                <span>{dealers.length} у вибірці</span>
              </div>
              <div className="dealer-reports-table-wrap">
                <table className="dealer-reports-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Дилер</th>
                      <th>Область</th>
                      <th>Замовлення</th>
                      <th>Оборот</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDealers.map((item) => (
                      <tr key={item.contractor_guid}>
                        <td>{formatNumber(item.turnover_rank)}</td>
                        <td>{item.dealer_name || "—"}</td>
                        <td>{item.region_name || "—"}</td>
                        <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                        <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                        <td>
                          <button className="dealer-reports-link" onClick={() => openDealerReport(item.contractor_guid)}>
                            Відкрити <FaArrowRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dealer-reports-panel">
              <div className="dealer-reports-panel__header">
                <h3>Регіони</h3>
                <span>Порівняння областей</span>
              </div>
              <div className="dealer-reports-table-wrap">
                <table className="dealer-reports-table">
                  <thead>
                    <tr>
                      <th>Область</th>
                      <th>Дилери</th>
                      <th>Замовлення</th>
                      <th>Сер. чек</th>
                      <th>Оборот</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((item) => (
                      <tr key={item.region_name}>
                        <td>{item.region_name || "—"}</td>
                        <td>{hasPositiveValue(item.dealers_count) ? formatNumber(item.dealers_count) : "—"}</td>
                        <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                        <td>{hasPositiveValue(item.avg_check) ? formatCurrency(item.avg_check) : "—"}</td>
                        <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="dealer-reports-panel dealer-reports-panel--full">
            <div className="dealer-reports-panel__header">
              <h3>Усі доступні дилери</h3>
              <span>Відкрити детальний звіт можна по кожному дилеру окремо</span>
            </div>
            <div className="dealer-reports-table-wrap">
              <table className="dealer-reports-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Дилер</th>
                    <th>Область</th>
                    <th>Менеджер</th>
                    <th>Замовлення</th>
                    <th>Конструкції</th>
                    <th>Оборот</th>
                    <th>Сер. чек</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dealers.map((item, index) => (
                    <tr key={item.contractor_guid}>
                      <td>{index + 1}</td>
                      <td>{item.dealer_name || "—"}</td>
                      <td>{item.region_name || "—"}</td>
                      <td>{item.main_manager_name || "—"}</td>
                      <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                      <td>{hasPositiveValue(item.total_constructions) ? formatNumber(item.total_constructions) : "—"}</td>
                      <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                      <td>{hasPositiveValue(item.avg_check) ? formatCurrency(item.avg_check) : "—"}</td>
                      <td>
                        <button className="dealer-reports-link" onClick={() => openDealerReport(item.contractor_guid)}>
                          Детально <FaArrowRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}


