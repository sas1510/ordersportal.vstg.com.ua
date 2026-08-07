import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBoxes, FaChartLine, FaMoneyBillWave, FaSearch, FaUsers } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosInstance from "../api/axios";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";
import "./DealerReportsPage.css";
import "./OrdersReportDashboardPage.css";

const STATUSES = [
  { status: "Новий", title: "Нові", className: "is-new" },
  { status: "Очікуємо підтвердження", title: "Очікують підтвердження", className: "is-confirmation" },
  { status: "Очікуємо оплату", title: "Очікують оплату", className: "is-payment" },
];

const DEALER_CHART_COLORS = ["#95c11f", "#6bb3d6", "#f6bf6a", "#ef9691", "#8e7cc3", "#4fb286"];
const REGION_CHART_COLORS = ["#95c11f", "#6bb3d6", "#f6bf6a", "#ef9691", "#4fb286", "#8e7cc3"];
const STATUS_CHART_COLORS = ["#4d93b6", "#c88a2f", "#cc6e67"];

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const dateInput = (date) => date.toISOString().slice(0, 10);
const ALL_MANAGERS_VALUE = "__ALL_MANAGERS__";
const ALL_REGIONS_VALUE = "__ALL_REGIONS__";

const currentMonthStart = () => {
  const date = new Date();
  return dateInput(new Date(date.getFullYear(), date.getMonth(), 1));
};

function getAge(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { text: "Дата невідома", minutes: -1, date: null };
  }

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const text = days
    ? String(days) + " дн. " + String(hours) + " год."
    : String(hours) + " год. " + String(minutes % 60) + " хв.";

  return { text, minutes, date };
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function hasPositiveValue(value) {
  return Number(value || 0) > 0;
}

function normalizeManagerKey(value) {
  return value || "__NO_MANAGER__";
}

function normalizeRegionName(value) {
  const regionName = String(value || "").trim();
  if (!regionName) {
    return "Не визначено";
  }

  if (regionName.toUpperCase().includes("РУТА МАГАЗИН")) {
    return "Чернівецька область";
  }

  return regionName;
}

function buildDealerTotals(items) {
  const dealersCount = items.length;
  const ordersCount = items.reduce(function (sum, item) {
    return sum + Number(item.orders_count || 0);
  }, 0);
  const totalConstructions = items.reduce(function (sum, item) {
    return sum + Number(item.total_constructions || 0);
  }, 0);
  const totalTurnover = items.reduce(function (sum, item) {
    return sum + Number(item.total_turnover || 0);
  }, 0);

  return {
    dealers_count: dealersCount,
    orders_count: ordersCount,
    total_constructions: totalConstructions,
    total_turnover: totalTurnover,
    avg_check: ordersCount > 0 ? totalTurnover / ordersCount : 0,
  };
}

function buildRegionAggregates(items) {
  const regionMap = new Map();

  items.forEach(function (item) {
    const regionName = normalizeRegionName(item.region_name);
    if (!regionMap.has(regionName)) {
      regionMap.set(regionName, {
        region_name: regionName,
        dealers_count: 0,
        orders_count: 0,
        total_constructions: 0,
        total_turnover: 0,
        avg_check: 0,
      });
    }

    const region = regionMap.get(regionName);
    region.dealers_count += 1;
    region.orders_count += Number(item.orders_count || 0);
    region.total_constructions += Number(item.total_constructions || 0);
    region.total_turnover += Number(item.total_turnover || 0);
  });

  return Array.from(regionMap.values())
    .map(function (item) {
      return {
        ...item,
        avg_check: item.orders_count > 0 ? item.total_turnover / item.orders_count : 0,
      };
    })
    .sort(function (a, b) {
      return Number(b.total_turnover || 0) - Number(a.total_turnover || 0);
    });
}

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="orders-dashboard__chart-tooltip">
      <strong>{label}</strong>
      {payload.map(function (item) {
        const value = item.dataKey === "turnover" || item.dataKey === "avg_check"
          ? formatCurrency(item.value)
          : formatNumber(item.value);
        return (
          <div key={item.dataKey}>{item.name + ": " + value}</div>
        );
      })}
    </div>
  );
}

export default function OrdersReportDashboardPage() {
  const navigate = useNavigate();
  const {
    dealerGuid,
    setDealerGuid,
    isAdmin,
    isSuperAdmin,
    isLoading: dealerContextLoading,
  } = useDealerContext();

  const [viewMode, setViewMode] = useState("statuses");
  const [dateFrom, setDateFrom] = useState(currentMonthStart);
  const [dateTo, setDateTo] = useState(dateInput(new Date()));

  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dealerReportsData, setDealerReportsData] = useState(null);
  const [dealerReportsLoading, setDealerReportsLoading] = useState(false);
  const [dealerReportsError, setDealerReportsError] = useState("");
  const [selectedManagerGuid, setSelectedManagerGuid] = useState(ALL_MANAGERS_VALUE);
  const [selectedRegionName, setSelectedRegionName] = useState(ALL_REGIONS_VALUE);
  const [activeStatus, setActiveStatus] = useState(STATUSES[0].status);

  const loadStatusReport = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError("Вкажіть коректний період звітності.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      if (response.data?.status !== "success") {
        throw new Error();
      }
      setCalculations(response.data?.data?.calculation || []);
    } catch (requestError) {
      setCalculations([]);
      setError(requestError.response?.data?.error || "Не вдалося завантажити дані звіту.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const loadDealerReports = useCallback(async () => {
    if (!isAdmin || dealerContextLoading) {
      return;
    }

    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setDealerReportsError("Вкажіть коректний період звітності.");
      return;
    }

    setDealerReportsLoading(true);
    setDealerReportsError("");

    try {
      const response = await axiosInstance.get("/dealer-portal-reports/", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      setDealerReportsData(response.data || null);
    } catch (requestError) {
      setDealerReportsData(null);
      setDealerReportsError(
        requestError?.response?.data?.detail ||
          requestError?.response?.data?.error ||
          "Не вдалося завантажити дилерський звіт.",
      );
    } finally {
      setDealerReportsLoading(false);
    }
  }, [dateFrom, dateTo, dealerContextLoading, isAdmin]);


  useEffect(() => {
    loadStatusReport();
    // initial load only; further refreshes happen by explicit user action
  }, []);


  const visibleCalculations = useMemo(() => {
    if (!dealerGuid || dealerGuid === "__ALL__") {
      return calculations;
    }

    return calculations.filter(function (calculation) {
      return String(calculation.dealerId || "").toLowerCase() === String(dealerGuid).toLowerCase();
    });
  }, [calculations, dealerGuid]);
  const grouped = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map(function (item) {
      return [item.status, []];
    }));

    visibleCalculations.forEach(function (calculation) {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (!orders.length) {
        result[STATUSES[0].status].push({
          number: calculation.number || "Без номера",
          dealer: calculation.dealer || "Без дилера",
          dateValue: calculation.dateRaw,
        });
        return;
      }

      orders.forEach(function (order) {
        if (Object.hasOwn(result, order.status)) {
          result[order.status].push({
            number: order.number || "Без номера",
            dealer: calculation.dealer || "Без дилера",
            dateValue: order.createDate || order.dateRaw || calculation.dateRaw,
          });
        }
      });
    });

    Object.values(result).forEach(function (orders) {
      orders.sort(function (a, b) {
        return getAge(b.dateValue).minutes - getAge(a.dateValue).minutes;
      });
    });

    return result;
  }, [visibleCalculations]);

  const statusChartData = useMemo(function () {
    return STATUSES.map(function (item, index) {
      return {
        ...item,
        value: grouped[item.status].length,
        fill: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length],
      };
    });
  }, [grouped]);

  const activeStatusMeta = useMemo(function () {
    return STATUSES.find(function (item) {
      return item.status === activeStatus;
    }) || STATUSES[0];
  }, [activeStatus]);

  const activeStatusOrders = grouped[activeStatusMeta.status] || [];

  const dealerTotals = dealerReportsData?.totals || {};
  const dealers = dealerReportsData?.dealers || [];
  const topDealers = dealerReportsData?.top_dealers || [];
  const regions = dealerReportsData?.regions || [];
  const dealerInsights = dealerReportsData?.insights || {};

  const managerOptions = useMemo(function () {
    if (!isSuperAdmin) {
      return [];
    }

    const managerMap = new Map();

    dealers.forEach(function (item) {
      const managerGuid = String(item.main_manager_guid || "").trim().toLowerCase();
      if (!managerGuid) {
        return;
      }

      if (!managerMap.has(managerGuid)) {
        managerMap.set(managerGuid, {
          guid: managerGuid,
          name: item.main_manager_name || "Без менеджера",
        });
      }
    });

    return Array.from(managerMap.values()).sort(function (a, b) {
      return a.name.localeCompare(b.name, "uk");
    });
  }, [dealers, isSuperAdmin]);

  useEffect(function () {
    if (!isSuperAdmin) {
      setSelectedManagerGuid(ALL_MANAGERS_VALUE);
      return;
    }

    if (selectedManagerGuid === ALL_MANAGERS_VALUE) {
      return;
    }

    const exists = managerOptions.some(function (item) {
      return item.guid === selectedManagerGuid;
    });

    if (!exists) {
      setSelectedManagerGuid(ALL_MANAGERS_VALUE);
    }
  }, [isSuperAdmin, managerOptions, selectedManagerGuid]);

  const managerFilteredDealers = useMemo(function () {
    if (!isSuperAdmin || selectedManagerGuid === ALL_MANAGERS_VALUE) {
      return dealers;
    }

    return dealers.filter(function (item) {
      return normalizeManagerKey(item.main_manager_guid) === selectedManagerGuid;
    });
  }, [dealers, isSuperAdmin, selectedManagerGuid]);

  const regionOptions = useMemo(function () {
    const regionMap = new Map();

    managerFilteredDealers.forEach(function (item) {
      const regionName = normalizeRegionName(item.region_name);
      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, {
          value: regionName,
          label: regionName,
        });
      }
    });

    return Array.from(regionMap.values()).sort(function (a, b) {
      return a.label.localeCompare(b.label, "uk");
    });
  }, [managerFilteredDealers]);

  useEffect(function () {
    if (selectedRegionName === ALL_REGIONS_VALUE) {
      return;
    }

    const exists = regionOptions.some(function (item) {
      return item.value === selectedRegionName;
    });

    if (!exists) {
      setSelectedRegionName(ALL_REGIONS_VALUE);
    }
  }, [regionOptions, selectedRegionName]);

  const activeDealers = useMemo(function () {
    if (selectedRegionName === ALL_REGIONS_VALUE) {
      return managerFilteredDealers;
    }

    return managerFilteredDealers.filter(function (item) {
      return normalizeRegionName(item.region_name) === selectedRegionName;
    });
  }, [managerFilteredDealers, selectedRegionName]);

  const activeDealerTotals = useMemo(function () {
    if ((!isSuperAdmin || selectedManagerGuid === ALL_MANAGERS_VALUE) && selectedRegionName === ALL_REGIONS_VALUE) {
      return dealerTotals;
    }

    return buildDealerTotals(activeDealers);
  }, [activeDealers, dealerTotals, isSuperAdmin, selectedManagerGuid, selectedRegionName]);

  const activeTopDealers = useMemo(function () {
    const source = (isSuperAdmin && selectedManagerGuid !== ALL_MANAGERS_VALUE) || selectedRegionName !== ALL_REGIONS_VALUE ? activeDealers : topDealers;
    return [...source]
      .sort(function (a, b) {
        const turnoverDiff = Number(b.total_turnover || 0) - Number(a.total_turnover || 0);
        if (turnoverDiff !== 0) {
          return turnoverDiff;
        }
        return (a.dealer_name || "").localeCompare(b.dealer_name || "", "uk");
      })
      .slice(0, 10);
  }, [activeDealers, isSuperAdmin, selectedManagerGuid, selectedRegionName, topDealers]);

  const activeRegions = useMemo(function () {
    if ((!isSuperAdmin || selectedManagerGuid === ALL_MANAGERS_VALUE) && selectedRegionName === ALL_REGIONS_VALUE) {
      return regions;
    }

    return buildRegionAggregates(activeDealers);
  }, [activeDealers, isSuperAdmin, regions, selectedManagerGuid, selectedRegionName]);

  const activeDealerInsights = useMemo(function () {
    if ((!isSuperAdmin || selectedManagerGuid === ALL_MANAGERS_VALUE) && selectedRegionName === ALL_REGIONS_VALUE) {
      return dealerInsights;
    }

    const topRegion = activeRegions[0] || null;
    return {
      ...dealerInsights,
      top_region_name: topRegion?.region_name || null,
      top_region_turnover: topRegion?.total_turnover || null,
      top_region_avg_check: topRegion?.avg_check || null,
    };
  }, [activeRegions, dealerInsights, isSuperAdmin, selectedManagerGuid, selectedRegionName]);

  const dealerCards = useMemo(function () {
    return [
      {
        icon: <FaUsers />,
        label: "Дилери у звіті",
        value: formatNumber(activeDealerTotals.dealers_count),
      },
      {
        icon: <FaChartLine />,
        label: "Замовлення",
        value: formatNumber(activeDealerTotals.orders_count),
      },
      {
        icon: <FaBoxes />,
        label: "Конструкції",
        value: formatNumber(activeDealerTotals.total_constructions),
      },
      {
        icon: <FaMoneyBillWave />,
        label: "Загальний оборот",
        value: formatCurrency(activeDealerTotals.total_turnover),
        hint: hasPositiveValue(activeDealerTotals.avg_check)
          ? "Сер. чек: " + formatCurrency(activeDealerTotals.avg_check)
          : null,
      },
    ];
  }, [activeDealerTotals]);

  const topDealersChartData = useMemo(function () {
    return activeTopDealers.slice(0, 5).map(function (item) {
      return {
        name: item.dealer_name || "Без назви",
        turnover: Number(item.total_turnover || 0),
        orders: Number(item.orders_count || 0),
      };
    });
  }, [activeTopDealers]);

  const regionChartData = useMemo(function () {
    return activeRegions.slice(0, 5).map(function (item) {
      return {
        name: normalizeRegionName(item.region_name),
        turnover: Number(item.total_turnover || 0),
      };
    });
  }, [activeRegions]);

  const statusTotal = Object.values(grouped).reduce(function (sum, orders) {
    return sum + orders.length;
  }, 0);
  const dashboardTotal = viewMode === "dealers" ? Number(activeDealerTotals.dealers_count || 0) : statusTotal;
  const dashboardTotalLabel = viewMode === "dealers" ? "Дилерів у звіті" : "Потребують уваги";

  useEffect(function () {
    const firstAvailable = STATUSES.find(function (item) {
      return (grouped[item.status] || []).length > 0;
    });

    setActiveStatus(function (current) {
      if (STATUSES.some(function (item) { return item.status === current; })) {
        return current;
      }
      return firstAvailable?.status || STATUSES[0].status;
    });
  }, [grouped]);

  const openOrder = function (number) {
    return "/admin-order?search=" + encodeURIComponent(number) + "&date_from=" + dateFrom + "&date_to=" + dateTo;
  };

  const openDealerReport = function (contractorGuid) {
    const params = new URLSearchParams({
      contractor_guid: contractorGuid,
      date_from: dateFrom,
      date_to: dateTo,
    });
    navigate("/statistics?" + params.toString());
  };

  return (
    <main className="orders-dashboard orders-dashboard--reports-mixed">
      <section className="orders-dashboard__panel">
        <div className="orders-dashboard__header">
          <div>
            <h1>Звіти за замовленнями</h1>
            <p>
              {viewMode === "dealers"
                ? "Загальна картина по дилерах менеджера або всього порталу."
                : "Кількість за дилерами та час очікування. Найдовші очікування — зверху."}
            </p>
          </div>
          <div className="orders-dashboard__total">
            <span>{dashboardTotalLabel}</span>
            <strong>{dashboardTotal}</strong>
          </div>
        </div>

        <div className="orders-dashboard__filters">
          <div className="orders-dashboard__view-switcher">
            <button type="button" className={viewMode === "statuses" ? "is-active" : ""} onClick={function () { setViewMode("statuses"); }}>
              Статуси
            </button>
            <button type="button" className={viewMode === "dealers" ? "is-active" : ""} onClick={function () { setViewMode("dealers"); }}>
              Дилери
            </button>
          </div>

          {viewMode === "statuses" && isAdmin ? (
            <label>
              Дилер
              <DealerSelectWithAll value={dealerGuid || "__ALL__"} onChange={setDealerGuid} />
            </label>
          ) : null}

          {viewMode === "dealers" && isSuperAdmin ? (
            <label>
              Менеджер
              <select value={selectedManagerGuid} onChange={function (event) { setSelectedManagerGuid(event.target.value); }}>
                <option value={ALL_MANAGERS_VALUE}>Всі менеджери</option>
                {managerOptions.map(function (item) {
                  return <option key={item.guid} value={item.guid}>{item.name}</option>;
                })}
              </select>
            </label>
          ) : null}

          {viewMode === "dealers" ? (
            <label>
              Область
              <select value={selectedRegionName} onChange={function (event) { setSelectedRegionName(event.target.value); }}>
                <option value={ALL_REGIONS_VALUE}>Всі області</option>
                {regionOptions.map(function (item) {
                  return <option key={item.value} value={item.value}>{item.label}</option>;
                })}
              </select>
            </label>
          ) : null}

          <label>
            Від
            <input type="date" value={dateFrom} max={dateTo} onChange={function (event) { setDateFrom(event.target.value); }} />
          </label>
          <label>
            До
            <input type="date" value={dateTo} min={dateFrom} onChange={function (event) { setDateTo(event.target.value); }} />
          </label>

          <button type="button" onClick={viewMode === "dealers" ? loadDealerReports : loadStatusReport} disabled={viewMode === "statuses" ? loading : dealerReportsLoading}>
            <FaSearch />
            {viewMode === "dealers"
              ? dealerReportsLoading ? "Завантаження..." : "Показати звіт"
              : loading ? "Завантаження..." : "Показати звіт"}
          </button>
        </div>

        {viewMode === "statuses" ? (
          <>
            {error ? <p className="orders-dashboard__error">{error}</p> : null}

            <section className="orders-dashboard__charts-grid orders-dashboard__charts-grid--statuses">
              <article className="dealer-reports-panel orders-dashboard__chart-panel">
                <div className="dealer-reports-panel__header">
                  <h3>Статуси замовлень</h3>
                  <span>Натисніть на сектор для деталізації</span>
                </div>

                <div className="orders-dashboard__chart-wrap">
                  {statusChartData.some(function (item) { return item.value > 0; }) ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="title"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={56}
                          paddingAngle={2}
                          activeIndex={STATUSES.findIndex(function (item) { return item.status === activeStatus; })}
                          onClick={function (entry) {
                            if (entry?.status) {
                              setActiveStatus(entry.status);
                            }
                          }}
                          cursor="pointer"
                        >
                          {statusChartData.map(function (entry, index) {
                            return <Cell key={entry.status} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />;
                          })}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="orders-dashboard__chart-empty">Немає даних для побудови діаграми.</div>
                  )}
                </div>

                <div className="orders-dashboard__chart-legend orders-dashboard__chart-legend--buttons">
                  {statusChartData.map(function (item, index) {
                    return (
                      <button
                        type="button"
                        key={item.status}
                        className={"orders-dashboard__legend-item orders-dashboard__legend-button" + (activeStatus === item.status ? " is-active" : "")}
                        onClick={function () { setActiveStatus(item.status); }}
                      >
                        <span className="orders-dashboard__legend-dot" style={{ backgroundColor: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length] }}></span>
                        <span>{item.title}</span>
                        <strong>{loading ? "?" : item.value}</strong>
                      </button>
                    );
                  })}
                </div>
              </article>

              <section className="orders-dashboard__details orders-dashboard__details--single">
                <h2>{activeStatusMeta.title} ({loading ? "?" : activeStatusOrders.length})</h2>
                <div className="orders-dashboard__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Замовлення</th>
                        <th>Дилер</th>
                        <th>Створено</th>
                        <th>Очікування</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4">Завантаження даних...</td>
                        </tr>
                      ) : activeStatusOrders.length ? activeStatusOrders.map(function (order, index) {
                        const age = getAge(order.dateValue);
                        return (
                          <tr key={order.number + index}>
                            <td><a href={openOrder(order.number)}>{order.number}</a></td>
                            <td>{order.dealer}</td>
                            <td>{age.date ? age.date.toLocaleString("uk-UA") : "?"}</td>
                            <td className="orders-dashboard__age">{age.text}</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="4">Немає замовлень у цьому статусі.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          </>
        ) : (
          <>
            {dealerReportsError ? <div className="dealer-reports-state is-error">{dealerReportsError}</div> : null}
            {!dealerReportsError && dealerReportsLoading ? <div className="dealer-reports-state">Формуємо звіт по дилерах…</div> : null}

            {!dealerReportsError && !dealerReportsLoading ? (
              <>
                <section className="dealer-reports-cards orders-dashboard__dealer-cards">
                  {dealerCards.map(function (card) {
                    return (
                      <article key={card.label} className="dealer-reports-card">
                        <div className="dealer-reports-card__icon">{card.icon}</div>
                        <div className="dealer-reports-card__label">{card.label}</div>
                        <div className="dealer-reports-card__value">{card.value}</div>
                        {card.hint ? <div className="dealer-reports-card__hint">{card.hint}</div> : null}
                      </article>
                    );
                  })}
                </section>

                <section className="orders-dashboard__charts-grid">
                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header">
                      <h3>Топ дилерів по обороту</h3>
                      <span>{topDealersChartData.length ? "Останній період" : "Немає даних"}</span>
                    </div>
                    <div className="orders-dashboard__chart-wrap">
                      {topDealersChartData.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={topDealersChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={70} />
                            <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} tickFormatter={function (value) { return formatNumber(value); }} />
                            <Tooltip content={<CustomChartTooltip />} />
                            <Bar dataKey="turnover" name="Оборот" radius={[6, 6, 0, 0]}>
                              {topDealersChartData.map(function (entry, index) {
                                return <Cell key={entry.name} fill={DEALER_CHART_COLORS[index % DEALER_CHART_COLORS.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="orders-dashboard__chart-empty">Немає даних для побудови діаграми.</div>
                      )}
                    </div>
                  </article>

                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header">
                      <h3>Області по обороту</h3>
                      <span>{activeDealerInsights?.top_region_name ? "Лідер: " + normalizeRegionName(activeDealerInsights.top_region_name) : "Немає даних"}</span>
                    </div>
                    <div className="orders-dashboard__chart-wrap">
                      {regionChartData.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <PieChart>
                            <Pie data={regionChartData} dataKey="turnover" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={56} paddingAngle={2}>
                              {regionChartData.map(function (entry, index) {
                                return <Cell key={entry.name} fill={REGION_CHART_COLORS[index % REGION_CHART_COLORS.length]} />;
                              })}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="orders-dashboard__chart-empty">Немає даних для побудови діаграми.</div>
                      )}
                    </div>
                    {regionChartData.length ? (
                      <div className="orders-dashboard__chart-legend">
                        {regionChartData.map(function (item, index) {
                          return (
                            <div key={item.name} className="orders-dashboard__legend-item">
                              <span className="orders-dashboard__legend-dot" style={{ backgroundColor: REGION_CHART_COLORS[index % REGION_CHART_COLORS.length] }}></span>
                              <span>{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                </section>

                <section className={"dealer-reports-grid " + (isSuperAdmin ? "is-admin" : "is-manager")}>
                  {!isSuperAdmin && activeTopDealers.length ? (
                    <article className="dealer-reports-panel">
                      <div className="dealer-reports-panel__header">
                        <h3>Топ дилерів</h3>
                        <span>Швидкий зріз по лідерах обороту</span>
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
                            {activeTopDealers.map(function (item, index) {
                              return (
                                <tr key={item.contractor_guid}>
                                  <td>{hasPositiveValue(item.turnover_rank) ? formatNumber(item.turnover_rank) : index + 1}</td>
                                  <td>{item.dealer_name || "—"}</td>
                                  <td>{normalizeRegionName(item.region_name) || "—"}</td>
                                  <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                                  <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                                  <td>
                                    <button className="dealer-reports-link" onClick={function () { openDealerReport(item.contractor_guid); }}>
                                      Відкрити <FaArrowRight />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ) : null}

                  {isSuperAdmin ? (
                    <article className="dealer-reports-panel">
                      <div className="dealer-reports-panel__header">
                        <h3>Області</h3>
                        <span>{activeDealerInsights?.top_region_name ? "Лідер: " + normalizeRegionName(activeDealerInsights.top_region_name) : "Порівняння областей"}</span>
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
                            {activeRegions.length ? activeRegions.map(function (item) {
                              return (
                                <tr key={item.region_name}>
                                  <td>{normalizeRegionName(item.region_name) || "—"}</td>
                                  <td>{hasPositiveValue(item.dealers_count) ? formatNumber(item.dealers_count) : "—"}</td>
                                  <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                                  <td>{hasPositiveValue(item.avg_check) ? formatCurrency(item.avg_check) : "—"}</td>
                                  <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                                </tr>
                              );
                            }) : (
                              <tr>
                                <td colSpan="5">Немає даних по областях.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ) : null}
                </section>

                <section className="dealer-reports-panel dealer-reports-panel--full orders-dashboard__all-dealers-panel">
                  <div className="dealer-reports-panel__header">
                    <h3>Всі дилери</h3>
                    <span>Повний список доступних дилерів у вибраному періоді</span>
                  </div>
                  <div className="dealer-reports-table-wrap">
                    <table className="dealer-reports-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Дилер</th>
                          <th>Область</th>
                          {/* <th>Менеджер</th> */}
                          <th>Замовлення</th>
                          <th>Конструкції</th>
                          <th>Оборот</th>
                          <th>Сер. чек</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDealers.length ? activeDealers.map(function (item, index) {
                          return (
                            <tr key={item.contractor_guid}>
                              <td>{hasPositiveValue(item.turnover_rank) ? formatNumber(item.turnover_rank) : index + 1}</td>
                              <td>{item.dealer_name || "—"}</td>
                              <td>{normalizeRegionName(item.region_name) || "—"}</td>
                              {/* <td>{item.main_manager_name || "—"}</td> */}
                              <td>{hasPositiveValue(item.orders_count) ? formatNumber(item.orders_count) : "—"}</td>
                              <td>{hasPositiveValue(item.total_constructions) ? formatNumber(item.total_constructions) : "—"}</td>
                              <td>{hasPositiveValue(item.total_turnover) ? formatCurrency(item.total_turnover) : "—"}</td>
                              <td>{hasPositiveValue(item.avg_check) ? formatCurrency(item.avg_check) : "—"}</td>
                              <td>
                                <button className="dealer-reports-link" onClick={function () { openDealerReport(item.contractor_guid); }}>
                                  Детально <FaArrowRight />
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="8">Немає дилерів у вибраному періоді.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
