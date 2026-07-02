import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../api/axios";
import {
  FaBoxes,
  FaCheckCircle,
  FaClock,
  FaCogs,
  FaCubes,
  FaExclamationTriangle,
  FaFilter,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaPalette,
  FaSearch,
  FaShippingFast,
  FaSlidersH,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./ProductionStatisticsPage.css";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import ProfileSystemChart from "../components/charts/ProfileSystemChart";
import ProfileColorChart from "../components/charts/ProfileColorChart";
import ComplexityDonut from "../components/charts/ComplexityDonut";
import ComplexityTreemap from "../components/charts/ComplexityTreeMap";

const ABC_COLORS = {
  A: "#c75d2c",
  B: "#d99b35",
  C: "#356a5d",
  Other: "#7f8c8d",
};

const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна",
  Вікно: "Вікна",
  "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна",
  "Французький балкон": "Вікна",
  "Двері безшовне зварювання": "Двері",
  Двері: "Двері",
  "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері",
  "Двері Lampre": "Двері",
  Лиштва: "Додатки",
  "Москітні сітки": "Додатки",
  Підвіконня: "Додатки",
  Відливи: "Додатки",
  Інше: "Додатки",
};

const STATUS_LABELS = {
  all: "Усі",
  "Вчасно": "Вчасно",
  "Запізнення": "Запізнення",
  "Не виготовлено": "Не виготовлено",
};

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const daysFormatter = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA");

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatPercent(value) {
  return `${percentFormatter.format(Number(value || 0))}%`;
}

function formatDays(value) {
  return daysFormatter.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

function calculateDaysBetween(startValue, endValue) {
  if (!startValue || !endValue) {
    return null;
  }

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (end <= start) {
    return 0;
  }

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const target = new Date(end);
  target.setHours(0, 0, 0, 0);

  let workingDays = 0;

  while (current < target) {
    current.setDate(current.getDate() + 1);

    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isWeekend) {
      workingDays += 1;
    }
  }

  return workingDays;
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) {
    return `rgba(47, 93, 82, ${alpha})`;
  }

  const [r, g, b] = [0, 2, 4].map((index) =>
    Number.parseInt(clean.slice(index, index + 2), 16),
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TimelinessTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="production-stats-tooltip">
      <div className="production-stats-tooltip__title">Клас {label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="production-stats-tooltip__row">
          <span>{item.name}</span>
          <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon, label, value, hint }) {
  return (
    <div className="production-kpi-card">
      <div className="production-kpi-card__icon">{icon}</div>
      <div className="production-kpi-card__label">{label}</div>
      <div className="production-kpi-card__value">{value}</div>
      {hint ? <div className="production-kpi-card__hint">{hint}</div> : null}
    </div>
  );
}

export default function ProductionStatisticsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { dealerGuid, setDealerGuid, isAdmin, isLoading: dealerContextLoading } =
    useDealerContext();
  const orderDetailsRef = useRef(null);
  const constructionDetailsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [unifiedData, setUnifiedData] = useState(null);
  const [selectedAbc, setSelectedAbc] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeConstructionCategory, setActiveConstructionCategory] = useState(null);
  const [activeConstructionSubCategory, setActiveConstructionSubCategory] =
    useState(null);

  const [dateInputs, setDateInputs] = useState({
    from: monthStart.toISOString().slice(0, 10),
    to: monthEnd.toISOString().slice(0, 10),
  });
  const [searchParams, setSearchParams] = useState({
    from: monthStart.toISOString().slice(0, 10),
    to: monthEnd.toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (dealerContextLoading) {
      return;
    }

    if (isAdmin && !dealerGuid) {
      setDashboardData(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const params = {
          date_from: searchParams.from,
          date_to: searchParams.to,
          contractor_guid: dealerGuid,
        };
        const [timelinessResponse, unifiedResponse] = await Promise.all([
          axiosInstance.get("/production-timeliness/", { params }),
          axiosInstance.get("/production-unified-analytics/", { params }),
        ]);

        if (!isCancelled) {
          setDashboardData(timelinessResponse.data);
          setUnifiedData(unifiedResponse.data);
        }
      } catch (err) {
        if (isCancelled) {
          return;
        }

        const message =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Не вдалося завантажити статистику виробництва";
        setError(message);
        setDashboardData(null);
        setUnifiedData(null);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [dealerContextLoading, dealerGuid, isAdmin, searchParams]);

  const summary = dashboardData?.summary || [];
  const orders = dashboardData?.orders || [];
  const meta = dashboardData?.meta || {};
  const profileSystems = unifiedData?.profile_systems || [];
  const furniture = unifiedData?.furniture || [];
  const profileColors = unifiedData?.profile_colors || [];
  const volumeDynamics = unifiedData?.volume_dynamics || [];
  const efficiencyDynamics = unifiedData?.efficiency_dynamics || [];
  const constructionPortfolio = unifiedData?.construction_portfolio || [];

  const abcTabs = useMemo(() => {
    const present = Array.from(new Set(summary.map((item) => item.abc).filter(Boolean)));
    return ["all", ...present];
  }, [summary]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const abcMatch = selectedAbc === "all" || order.abc === selectedAbc;
      const statusMatch =
        selectedStatus === "all" || order.production_status === selectedStatus;
      return abcMatch && statusMatch;
    }).map((order) => ({
      ...order,
      production_days: calculateDaysBetween(order.order_date, order.ready_production_max),
    }));
  }, [orders, selectedAbc, selectedStatus]);

  const chartData = useMemo(() => {
    return summary.map((item) => ({
      abc: item.abc,
      "Вчасно": item.in_time_count,
      "Запізнення": item.delayed_count,
      "Не виготовлено": item.not_finished_count,
    }));
  }, [summary]);

  const completedOrders = useMemo(() => {
    return [...orders]
      .map((item) => ({
        ...item,
        production_days: calculateDaysBetween(item.order_date, item.ready_production_max),
      }))
      .filter((item) => item.production_days !== null);
  }, [orders]);

  const fastestByAbc = useMemo(() => {
    const groups = {};

    completedOrders.forEach((order) => {
      const abcKey = order.abc || "Other";
      if (!groups[abcKey]) {
        groups[abcKey] = [];
      }
      groups[abcKey].push(order);
    });

    return Object.entries(groups)
      .sort(([abcA], [abcB]) => {
        const order = { A: 1, B: 2, C: 3, Other: 4 };
        return (order[abcA] || 99) - (order[abcB] || 99);
      })
      .map(([abc, items]) => ({
        abc,
        items: [...items]
          .sort((a, b) => Number(a.production_days || 0) - Number(b.production_days || 0))
          .slice(0, 1),
      }));
  }, [completedOrders]);

  const inTimeProductionDays = useMemo(() => {
    const stats = completedOrders
      .filter((order) => order.production_status === "Вчасно")
      .reduce(
        (accumulator, order) => {
          const abcKey = order.abc || "Other";
          const days = Number(order.production_days || 0);

          accumulator.totalDays += days;
          accumulator.totalCount += 1;

          if (!accumulator.byAbc[abcKey]) {
            accumulator.byAbc[abcKey] = { totalDays: 0, totalCount: 0 };
          }

          accumulator.byAbc[abcKey].totalDays += days;
          accumulator.byAbc[abcKey].totalCount += 1;

          return accumulator;
        },
        { totalDays: 0, totalCount: 0, byAbc: {} },
      );

    const overallAverage =
      stats.totalCount > 0 ? stats.totalDays / stats.totalCount : null;

    const averageByAbc = Object.fromEntries(
      Object.entries(stats.byAbc).map(([abcKey, value]) => [
        abcKey,
        value.totalCount > 0 ? value.totalDays / value.totalCount : null,
      ]),
    );

    return { overallAverage, averageByAbc };
  }, [completedOrders]);

  const profileSystemsForChart = useMemo(
    () =>
      profileSystems.map((item) => ({
        ProfileSystem: item.profile_system,
        OrdersCount: item.orders_count,
      })),
    [profileSystems],
  );

  const profileColorsForChart = useMemo(
    () =>
      profileColors.map((item) => ({
        ProfileColor: item.name,
        OrdersCount: item.orders_count,
      })),
    [profileColors],
  );

  const profileSystemsSorted = useMemo(
    () => [...profileSystems].sort((a, b) => b.total_constructions - a.total_constructions),
    [profileSystems],
  );

  const groupedConstructionPortfolio = useMemo(() => {
    const groups = {};

    constructionPortfolio.forEach((item) => {
      const category =
        CATEGORY_MAPPING[item.construction_type_name_ua?.trim()] || "Додатки";

      if (!groups[category]) {
        groups[category] = {
          name: category,
          total_quantity: 0,
          unique_orders_count: 0,
          items: [],
        };
      }

      groups[category].total_quantity += Number(item.total_quantity || 0);
      groups[category].unique_orders_count += Number(item.unique_orders_count || 0);
      groups[category].items.push(item);
    });

    return Object.values(groups)
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) => Number(b.total_quantity || 0) - Number(a.total_quantity || 0),
        ),
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity);
  }, [constructionPortfolio]);

  const constructionDonutData = useMemo(
    () =>
      groupedConstructionPortfolio.map((group) => ({
        name: group.name,
        value: group.total_quantity,
      })),
    [groupedConstructionPortfolio],
  );

  const activeConstructionGroup = useMemo(
    () =>
      groupedConstructionPortfolio.find(
        (group) => group.name === activeConstructionCategory,
      ) || null,
    [groupedConstructionPortfolio, activeConstructionCategory],
  );

  const constructionSubCategories = useMemo(() => {
    if (!activeConstructionGroup) {
      return [];
    }

    return Array.from(
      new Set(
        activeConstructionGroup.items
          .map((item) => item.construction_type_name_ua)
          .filter(Boolean),
      ),
    );
  }, [activeConstructionGroup]);

  const constructionTreemapData = useMemo(() => {
    if (!activeConstructionGroup) {
      return [];
    }

    return activeConstructionGroup.items
      .filter((item) => {
        if (!activeConstructionSubCategory) {
          return true;
        }
        return item.construction_type_name_ua === activeConstructionSubCategory;
      })
      .map((item) => ({
        name: `${item.construction_type_name_ua || item.item_name_ua} (${item.complexity_ua || "Стандарт"})`,
        value: Number(item.total_quantity || 0),
      }))
      .filter((item) => item.value > 0);
  }, [activeConstructionGroup, activeConstructionSubCategory]);

  const latestVolumePoint = useMemo(
    () => (volumeDynamics.length ? volumeDynamics[volumeDynamics.length - 1] : null),
    [volumeDynamics],
  );

  const latestEfficiencyPoint = useMemo(
    () =>
      efficiencyDynamics.length
        ? efficiencyDynamics[efficiencyDynamics.length - 1]
        : null,
    [efficiencyDynamics],
  );

  const handleSearch = () => {
    setSelectedAbc("all");
    setSelectedStatus("all");
    setShowOrderDetails(false);
    setActiveConstructionCategory(null);
    setActiveConstructionSubCategory(null);
    setSearchParams({ ...dateInputs });
  };

  const handleTimelinessBarClick = (entry, statusLabel) => {
    const abc = entry?.payload?.abc;
    if (!abc) {
      return;
    }

    setSelectedAbc(abc);
    setSelectedStatus(statusLabel);
    setShowOrderDetails(true);

    requestAnimationFrame(() => {
      orderDetailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const hasData = summary.length > 0 || orders.length > 0;

  const handleConstructionCategorySelect = (categoryName) => {
    setActiveConstructionCategory(categoryName);
    setActiveConstructionSubCategory(null);
  };

  useEffect(() => {
    if (!activeConstructionCategory) {
      return;
    }

    requestAnimationFrame(() => {
      constructionDetailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [activeConstructionCategory]);

  return (
    <div className="portal-body">
      <div className="production-page-shell">
        <section className="production-page-hero">
          <div>
            <div className="production-page-eyebrow">ABC production timeline</div>
            <h1 className="production-page-title">Статистика виробництва</h1>
            <p className="production-page-subtitle">
              Контроль своєчасності виготовлення по класах ABC, відсотку виконання
              та замовленнях із найбільшим відхиленням.
            </p>
          </div>

          <div className="production-page-filters">
            <label className="production-filter">
              <span>Від</span>
              <input
                type="date"
                value={dateInputs.from}
                onChange={(e) =>
                  setDateInputs((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </label>

            <label className="production-filter">
              <span>До</span>
              <input
                type="date"
                value={dateInputs.to}
                onChange={(e) =>
                  setDateInputs((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </label>

            {isAdmin ? (
              <div className="production-filter production-filter--dealer">
                <span>Дилер</span>
                <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
              </div>
            ) : null}

            <button
              className="production-filter-button"
              onClick={handleSearch}
              disabled={loading || (isAdmin && !dealerGuid)}
            >
              <FaSearch />
              <span>{loading ? "Завантаження..." : "Сформувати"}</span>
            </button>
          </div>
        </section>

        {error ? (
          <div className="production-state-card">
            <FaExclamationTriangle className="production-state-card__icon is-error" />
            <h3>Дані тимчасово недоступні</h3>
            <p>{error}</p>
            <button className="production-filter-button" onClick={handleSearch}>
              Повторити запит
            </button>
          </div>
        ) : null}

        {!error && isAdmin && !dealerGuid && !loading ? (
          <div className="production-state-card">
            <FaFilter className="production-state-card__icon" />
            <h3>Оберіть дилера</h3>
            <p>Для побудови статистики адміністратору потрібно вибрати контрагента.</p>
          </div>
        ) : null}

        {!error && loading ? (
          <div className="production-state-card">
            <div className="loading-spinner"></div>
            <h3>Формуємо статистику</h3>
            <p>Підтягуємо ABC-дані, виробництво та деталізацію замовлень.</p>
          </div>
        ) : null}

        {!error && !loading && !hasData && (!isAdmin || dealerGuid) ? (
          <div className="production-state-card">
            <FaHourglassHalf className="production-state-card__icon" />
            <h3>За цей період немає даних</h3>
            <p>Спробуйте розширити діапазон дат або вибрати іншого дилера.</p>
          </div>
        ) : null}

        {!error && !loading && hasData ? (
          <>
            <section className="production-kpi-grid">
              <div className="production-average-card">
                <div className="production-average-card__eyebrow">Середній чек</div>
                <div className="production-average-card__value">
                  {formatCurrency(meta.avg_check)}
                </div>
                <div className="production-average-card__footer">
                  <span>За період {formatDate(searchParams.from)} - {formatDate(searchParams.to)}</span>
                  <strong>{formatNumber(meta.orders_count)} замовлень</strong>
                </div>
              </div>

              <KpiCard
                icon={<FaCheckCircle />}
                label="Вчасно"
                value={formatPercent(meta.in_time_percent)}
                hint={
                  inTimeProductionDays.overallAverage !== null
                    ? `${formatNumber(meta.in_time_count)} замовлень • сер. ${formatDays(inTimeProductionDays.overallAverage)} дн.`
                    : `${formatNumber(meta.in_time_count)} замовлень`
                }
              />
              <KpiCard
                icon={<FaClock />}
                label="Запізнення"
                value={formatPercent(meta.delayed_percent)}
                hint={`${formatNumber(meta.delayed_count)} замовлень`}
              />
              <KpiCard
                icon={<FaHourglassHalf />}
                label="Не виготовлено"
                value={formatPercent(meta.not_finished_percent)}
                hint={`${formatNumber(meta.not_finished_count)} замовлень`}
              />
              <KpiCard
                icon={<FaMoneyBillWave />}
                label="Оборот"
                value={formatCurrency(meta.total_sum)}
                hint="Сума замовлень за період"
              />
              <KpiCard
                icon={<FaBoxes />}
                label="Конструкції"
                value={formatNumber(meta.total_constructions)}
                hint={`Виготовлено: ${formatNumber(meta.produced_total)}`}
              />
              <KpiCard
                icon={<FaShippingFast />}
                label="Сер. затримка"
                value={`${formatNumber(meta.avg_delay_days)} дн.`}
                hint={`Макс. затримка: ${formatNumber(meta.max_delay_days)} дн.`}
              />
            </section>

            <section className="production-accent-grid">
              <article className="production-panel production-panel--soft production-panel--systems">
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Profile systems</div>
                    <h3>Профільні системи</h3>
                  </div>
                  <div className="production-panel__badge">
                    <FaSlidersH />
                    <span>{profileSystems.length} систем</span>
                  </div>
                </div>

                <div className="production-profile-spotlight">
                  {profileSystemsSorted.length ? (
                    <div className="production-profile-list">
                      <div className="production-profile-list__head">
                        <span>Система</span>
                        <span>Конструкції</span>
                        <span>Замовлення</span>
                        <span>Сер. чек</span>
                        <span>Оборот</span>
                      </div>

                      {profileSystemsSorted.map((item) => (
                        <div key={item.profile_system} className="production-profile-row">
                          <div className="production-profile-row__name">
                            {item.profile_system}
                          </div>
                          <div>{formatNumber(item.total_constructions)}</div>
                          <div>{formatNumber(item.orders_count)}</div>
                          <div>{formatCurrency(item.avg_check)}</div>
                          <div>{formatCurrency(item.total_sum)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="production-empty-inline">
                      Профільні системи за цей період не знайдено.
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="production-panel production-panel--category">
              <div className="production-panel__header">
                <div>
                  <div className="production-panel__eyebrow">Portfolio by category</div>
                  <h3>Категорії виробів</h3>
                </div>
                <div className="production-panel__badge">
                  <FaBoxes />
                  <span>{groupedConstructionPortfolio.length} категорії</span>
                </div>
              </div>

              <div className="production-category-donut">
                {constructionDonutData.length ? (
                  <ComplexityDonut
                    data={constructionDonutData}
                    onSectorClick={handleConstructionCategorySelect}
                    height="420px"
                  />
                ) : (
                  <div className="production-empty-inline">
                    Дані по категоріях відсутні.
                  </div>
                )}
              </div>
            </section>

            {activeConstructionGroup ? (
              <section
                ref={constructionDetailsRef}
                className="production-panel production-panel--category-detail"
              >
                <div className="production-detail-header">
                  <h3 className="production-detail-title">
                    Деталізація:{" "}
                    <span>{activeConstructionGroup.name}</span>
                  </h3>
                  <button
                    className="production-detail-close"
                    onClick={() => {
                      setActiveConstructionCategory(null);
                      setActiveConstructionSubCategory(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="production-chips">
                  <button
                    className={`production-chip ${!activeConstructionSubCategory ? "is-active" : ""}`}
                    onClick={() => setActiveConstructionSubCategory(null)}
                  >
                    Всі типи
                  </button>
                  {constructionSubCategories.map((subCategory) => (
                    <button
                      key={subCategory}
                      className={`production-chip ${activeConstructionSubCategory === subCategory ? "is-active" : ""}`}
                      onClick={() =>
                        setActiveConstructionSubCategory(subCategory)
                      }
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>

                <div className="production-detail-caption">
                  Розподіл за складністю виготовлення (шт)
                </div>

                <div className="production-detail-treemap">
                  <ComplexityTreemap
                    data={constructionTreemapData}
                    activeGroup={activeConstructionGroup.name}
                    height="520px"
                  />
                </div>
              </section>
            ) : null}

            <section className="production-summary-grid">
              {summary.map((item) => {
                const abcColor = ABC_COLORS[item.abc] || ABC_COLORS.Other;
                const inTimeAverageDays = inTimeProductionDays.averageByAbc[item.abc];
                return (
                  <article
                    key={item.abc}
                    className="production-summary-card"
                    style={{
                      "--abc-color": abcColor,
                      "--abc-soft-color": hexToRgba(abcColor, 0.14),
                    }}
                  >
                    <div className="production-summary-card__header">
                      <div className="production-summary-card__badge">
                        Клас {item.abc}
                      </div>
                      <div className="production-summary-card__percent">
                        {formatPercent(item.in_time_percent)}
                      </div>
                    </div>

                    <div className="production-summary-card__body">
                      <div>
                        <div className="production-summary-card__main">
                          {formatNumber(item.orders_count)}
                        </div>
                        <div className="production-summary-card__label">
                          замовлень у роботі
                        </div>
                      </div>

                      <div className="production-summary-card__progress">
                        <span style={{ width: `${Math.min(item.in_time_percent, 100)}%` }} />
                      </div>

                      <div className="production-summary-card__stats">
                        <span>
                          Вчасно: {formatNumber(item.in_time_count)}
                          {inTimeAverageDays !== null && inTimeAverageDays !== undefined
                            ? ` • ${formatDays(inTimeAverageDays)} дн.`
                            : ""}
                        </span>
                        <span>Запізнення: {formatNumber(item.delayed_count)}</span>
                        <span>Не завершено: {formatNumber(item.not_finished_count)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="production-content-grid">
              <article className="production-panel">
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Timeliness mix</div>
                    <h3>Своєчасність по ABC</h3>
                  </div>
                </div>

                <div className="production-chart-wrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} barGap={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8dfd1" vertical={false} />
                      <XAxis dataKey="abc" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip content={<TimelinessTooltip />} />
                      <Bar
                        dataKey="Вчасно"
                        fill="#356a5d"
                        radius={[8, 8, 0, 0]}
                        onClick={(entry) => handleTimelinessBarClick(entry, "Вчасно")}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="Запізнення"
                        fill="#c75d2c"
                        radius={[8, 8, 0, 0]}
                        onClick={(entry) => handleTimelinessBarClick(entry, "Запізнення")}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="Не виготовлено"
                        fill="#d3b27f"
                        radius={[8, 8, 0, 0]}
                        onClick={(entry) => handleTimelinessBarClick(entry, "Не виготовлено")}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="production-chart-hint">
                  Натисніть на будь-який стовпець, щоб відкрити деталізацію по
                  відповідному ABC-класу та статусу.
                </div>
              </article>

              <article className="production-panel">
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Fastest orders</div>
                    <h3>Найшвидші по категоріях ABC</h3>
                  </div>
                </div>

                <div className="production-fastest-groups">
                  {fastestByAbc.length ? (
                    fastestByAbc.map((group) => (
                      <div key={group.abc} className="production-fastest-group">
                        <div
                          className="production-fastest-group__badge"
                          style={{
                            "--abc-color": ABC_COLORS[group.abc] || ABC_COLORS.Other,
                            "--abc-soft-color": hexToRgba(
                              ABC_COLORS[group.abc] || ABC_COLORS.Other,
                              0.14,
                            ),
                          }}
                        >
                          Клас {group.abc}
                        </div>

                        <div className="production-fastest-group__list">
                          {group.items.map((order) => (
                            <div
                              key={order.order_id || order.order_number}
                              className="production-fastest-item"
                            >
                              <div>
                                <div className="production-delay-item__title">
                                  {order.order_number || "Без номера"}
                                </div>
                                <div className="production-delay-item__meta">
                                  замовлення {formatDate(order.order_date)} • готово{" "}
                                  {formatDate(order.ready_production_max)}
                                </div>
                              </div>
                              <div className="production-fastest-item__value">
                                {formatNumber(order.production_days)} дн.
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="production-empty-inline">
                      Немає готових замовлень для побудови рейтингу швидкості.
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="production-content-grid production-content-grid--profiles">
              <article className="production-panel">
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Profile distribution</div>
                    <h3>Розподіл по профільних системах</h3>
                  </div>
                  <div className="production-panel__badge">
                    <FaCubes />
                    <span>Топ за замовленнями</span>
                  </div>
                </div>

                <div className="production-profile-chart">
                  {profileSystemsForChart.length ? (
                    <ProfileSystemChart data={profileSystemsForChart} height="360px" />
                  ) : (
                    <div className="production-empty-inline">
                      Немає даних для побудови графіка систем.
                    </div>
                  )}
                </div>
              </article>

              <article className="production-panel">
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Profile colors</div>
                    <h3>Кольори профілю</h3>
                  </div>
                  <div className="production-panel__badge">
                    <FaPalette />
                    <span>{profileColors.length} кольорів</span>
                  </div>
                </div>

                <div className="production-profile-chart">
                  {profileColorsForChart.length ? (
                    <ProfileColorChart data={profileColorsForChart} height="360px" />
                  ) : (
                    <div className="production-empty-inline">
                      Немає даних по кольорах профілю.
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="production-panel production-panel--wide">
              <div>
                <div className="production-panel__header">
                  <div>
                    <div className="production-panel__eyebrow">Furniture and extras</div>
                    <h3>Фурнітура</h3>
                  </div>
                  <div className="production-panel__badge">
                    <FaCogs />
                    <span>{furniture.length} позицій</span>
                  </div>
                </div>

                <div className="production-furniture-list">
                  {furniture.length ? (
                    furniture.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="production-furniture-item">
                        <div className="production-furniture-item__top">
                          <span className="production-furniture-item__rank">
                            #{index + 1}
                          </span>
                          <span className="production-furniture-item__title">
                            {item.name}
                          </span>
                        </div>
                        <div className="production-furniture-item__meta">
                          <span>{formatNumber(item.orders_count)} замовлень</span>
                          <span>{formatNumber(item.total_constructions)} конструкцій</span>
                          <strong>{formatCurrency(item.total_sum)}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="production-empty-inline">
                      Немає даних по фурнітурі.
                    </div>
                  )}
                </div>

              </div>
            </section>

            {showOrderDetails ? (
              <section
                className="production-panel production-panel--table"
                ref={orderDetailsRef}
              >
                <div className="production-panel__header production-panel__header--stacked">
                  <div className="production-detail-header">
                    <div>
                      <div className="production-panel__eyebrow">Order details</div>
                      <h3>Деталізація замовлень</h3>
                    </div>
                    <button
                      type="button"
                      className="production-detail-close"
                      onClick={() => setShowOrderDetails(false)}
                      aria-label="Закрити деталізацію замовлень"
                    >
                      ×
                    </button>
                  </div>

                  <div className="production-chart-hint">
                    Відкрито для {selectedAbc === "all" ? "усіх ABC" : `класу ${selectedAbc}`} і
                    {" "}
                    {STATUS_LABELS[selectedStatus]?.toLowerCase() || "усіх статусів"}.
                  </div>

                  <div className="production-chip-groups">
                    <div className="production-chips">
                      {abcTabs.map((tab) => (
                        <button
                          key={tab}
                          className={`production-chip ${selectedAbc === tab ? "is-active" : ""}`}
                          onClick={() => setSelectedAbc(tab)}
                        >
                          {tab === "all" ? "Усі ABC" : `Клас ${tab}`}
                        </button>
                      ))}
                    </div>

                    <div className="production-chips">
                      {Object.entries(STATUS_LABELS).map(([statusKey, label]) => (
                        <button
                          key={statusKey}
                          className={`production-chip ${selectedStatus === statusKey ? "is-active" : ""}`}
                          onClick={() => setSelectedStatus(statusKey)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="production-table-scroll">
                  <table className="production-table">
                    <thead>
                      <tr>
                        <th>ABC</th>
                        <th>Замовлення</th>
                        <th>Дата</th>
                        <th>План</th>
                        <th>Факт</th>
                        <th>Статус</th>
                        <th>Затримка</th>
                        <th>Сума</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length ? (
                        filteredOrders.map((order) => (
                          <tr key={order.order_id || `${order.order_number}-${order.calc_period}`}>
                            <td>
                              <span
                                className="production-abc-pill"
                                style={{
                                  backgroundColor:
                                    ABC_COLORS[order.abc] || ABC_COLORS.Other,
                                }}
                              >
                                {order.abc}
                              </span>
                            </td>
                            <td>
                              <div className="production-table__title">
                                {order.order_number || "Без номера"}
                              </div>
                              <div className="production-table__subtitle">
                                {order.client_order_number || "Клієнтський номер відсутній"}
                              </div>
                            </td>
                            <td>{formatDate(order.order_date)}</td>
                            <td>{formatDate(order.planned_production_date)}</td>
                            <td>{formatDate(order.ready_production_max)}</td>
                            <td>
                              <span
                                className={`production-status-pill ${order.production_status === "Вчасно" ? "is-good" : ""} ${order.production_status === "Запізнення" ? "is-bad" : ""} ${order.production_status === "Не виготовлено" ? "is-neutral" : ""}`}
                              >
                                {order.production_status || "—"}
                              </span>
                              {order.production_status === "Вчасно" &&
                              order.production_days !== null ? (
                                <div className="production-table__subtitle">
                                  виготовлено за {formatNumber(order.production_days)} дн.
                                </div>
                              ) : null}
                            </td>
                            <td>{order.delay_bucket || "—"}</td>
                            <td>{formatCurrency(order.order_sum)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8">
                            <div className="production-empty-inline">
                              Немає замовлень для поточних фільтрів.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
