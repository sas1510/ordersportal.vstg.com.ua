import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../api/axios";
import {
  FaBox,  FaCalendarAlt,
  FaCheckCircle,
  FaBoxes,
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaCogs,
  FaCubes,
  FaExclamationTriangle,
  FaFilter,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaPalette,
  FaUsers,
  FaSearch,
  FaSyncAlt,
  FaShippingFast,
  FaSlidersH,
  FaTrophy,
  FaMedal,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./ProductionStatisticsPage.css";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import ComplexityDonut from "../components/charts/ComplexityDonut";
import ComplexityTreemap from "../components/charts/ComplexityTreeMap";
import { AppIcon } from "../components/Icons/AppIcon";

const ABC_COLORS = {
  A: "#B4D947",
  B: "#6B98BF",
  C: "#ED8B33",
  Other: "#7f8c8d",
};

const ABC_PRODUCTION_HINTS = {
  A: "\u0412\u0438\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u0440\u043e\u0442\u044f\u0433\u043e\u043c 5-10 \u0440\u043e\u0431\u043e\u0447\u0438\u0445 \u0434\u043d\u0456\u0432",
  B: "\u0412\u0438\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u0440\u043e\u0442\u044f\u0433\u043e\u043c 11-20 \u0440\u043e\u0431\u043e\u0447\u0438\u0445 \u0434\u043d\u0456\u0432",
  C: "\u0412\u0438\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u043e\u043d\u0430\u0434 20 \u0440\u043e\u0431\u043e\u0447\u0438\u0445 \u0434\u043d\u0456\u0432",
  Other: "\u0412\u0438\u0440\u043e\u0431\u043d\u0438\u0447\u0438\u0439 \u0433\u0440\u0430\u0444\u0456\u043a",
};

const ABC_CARD_ORDER = ["A", "B", "C"];

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

const PROFILE_SYSTEM_GROUPS = [
  {
    key: "windows-60",
    label: "Вікна 60 мм",
    matchers: [/^Olimpia$/i, /^WDS 5-S "GOST"$/i, /^WDS 5-S "PLUS\+"$/i, /^SL60$/i],
  },
  {
    key: "doors-60",
    label: "Двері 60 мм",
    matchers: [/^WDS 60mm \(door\)$/i, /^Proline Дверi \(60мм\)$/i],
  },
  {
    key: "windows-70",
    label: "Вікна 70 мм",
    matchers: [
      /^WDS\(70mm\) ДСТУ$/i,
      /^WDS\(70mm\) PLUS$/i,
      /^WDS 6-S "GOST"$/i,
      /^WDS 6-S "PLUS\+"$/i,
      /^Proline ECO$/i,
      /^Proline ЕСО$/i,
    ],
  },
  {
    key: "doors-70",
    label: "Двері 70 мм",
    matchers: [/^WDS 70mm \(door\)$/i, /^Proline Дверi \(70мм\)$/i],
  },
  {
    key: "windows-76",
    label: "Вікна 76 мм",
    matchers: [
      /^WDS 76 AD Pro$/i,
      /^WDS 76 AD Standart$/i,
      /^Вікна 76 AD Pro БЕЗШОВКА$/i,
      /^Вікна 76 AD Standart БЕЗШОВКА$/i,
      /^WDS 76 MD Pro$/i,
      /^WDS 76 MD Pro БЕЗШОВКА$/i,
      /^WDS SL 76$/i,
    ],
  },
  {
    key: "doors-76",
    label: "Двері 76 мм",
    matchers: [
      /^WDS AD 76 door STANDART$/i,
      /^Двері AD STANDART БЕЗШОВКА$/i,
      /^Двері AD PREMIUM БЕЗШОВКА$/i,
      /^WDS AD 76 door PREMIUM$/i,
    ],
  },
  {
    key: "windows-74",
    label: "Вікна 74 мм",
    matchers: [/^Gealan 8000 Вікна$/i],
  },
  {
    key: "doors-panel-78",
    label: "Двері / панель 78 мм",
    matchers: [/^PE78N Panel$/i],
  },
  {
    key: "other",
    label: "Інше",
    matchers: [/^Рама під склопакет$/i, /^Без конструкций$/i],
  },
];

const STATUS_LABELS = {
  all: "Усі",
  "Вчасно": "Вчасно",
  "Запізнення": "Запізнення",
  "У виробництві": "У виробництві",
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

function formatRoundedPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function formatDays(value) {
  return daysFormatter.format(Number(value || 0));
}

function formatDate(value, locale = "uk-UA") {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale).format(parsed);
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

function formatCurrencyPlain(value) {
  return `${formatNumber(Math.round(Number(value || 0)))} грн`;
}

function formatCompactThousands(value) {
  const amount = Number(value || 0);
  if (!amount) {
    return "0 тис.";
  }

  return `${formatNumber(Math.round(amount / 1000))} тис.`;
}

function calculateComparisonPercent(currentValue, leaderValue) {
  const current = Number(currentValue || 0);
  const leader = Number(leaderValue || 0);

  if (leader <= 0) {
    return 0;
  }

  return Math.max(0, Math.min((current / leader) * 100, 100));
}

function formatAnalyticsMetricValue(metricKey, value) {
  if (metricKey === "total_sum" || metricKey === "avg_check") {
    return formatCurrency(value);
  }

  return formatNumber(value);
}

function resolveProfileSystemGroup(profileSystemName) {
  const normalizedName = String(profileSystemName || "").trim();

  const matchedGroup = PROFILE_SYSTEM_GROUPS.find((group) =>
    group.matchers.some((matcher) => matcher.test(normalizedName)),
  );

  return matchedGroup?.label || "Інше";
}

function TimelinessTooltip({ active, payload, label, isDark = true }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`production-stats-tooltip ${isDark ? "is-dark" : "is-light"}`}>
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

function TopMetricCard({ icon, label, value, hint, tone = "default" }) {
  return (
    <div className={`production-top-metric production-top-metric--${tone}`}>
      <div className="production-top-metric__icon">{icon}</div>
      <div className="production-top-metric__label">{label}</div>
      <div className="production-top-metric__value">{value}</div>
      {hint ? <div className="production-top-metric__hint">{hint}</div> : null}
    </div>
  );
}

function ComparisonGauge({
  label,
  percent,
  valueLabel,
  color,
  iconName,
}) {
  const safePercent = Math.max(0, Math.min(Number(percent || 0), 100));

  return (
    <article
      className="production-design__dealer-gauge"
      style={{
        "--dealer-gauge-color": color,
        "--dealer-gauge-value": `${safePercent}%`,
      }}
    >
      <span className="production-design__dealer-gauge-label">{label}</span>
      <div className="production-design__dealer-gauge-ring">
        <div className="production-design__dealer-gauge-center">
          {iconName ? (
            <span className="production-design__dealer-gauge-icon">
              <AppIcon name={iconName} />
            </span>
          ) : null}
          {formatRoundedPercent(safePercent)}
        </div>
      </div>
      <strong>{valueLabel}</strong>
    </article>
  );
}

function ProductionRingCard({
  inTimePercent,
  inTimeCount,
  averageProductionDays,
  delayedPercent,
  delayedCount,
  notFinishedCount,
  totalOrders,
  onSelectStatus,
}) {
  const { t, i18n } = useTranslation();
  const [selectedSection, setSelectedSection] = useState(null);

  const STATUS = {
    inTime: "Вчасно",
    delayed: "Запізнення",
    notFinished: "У виробництві",
  };

  const inTimeValue = Number(inTimeCount || 0);
  const delayedValue = Number(delayedCount || 0);
  const notFinishedValue = Number(notFinishedCount || 0);

  const completedOrders = inTimeValue + delayedValue;

  const statusData = [
    {
      name: STATUS.delayed,
      value: delayedValue,
      color: "#ED8B33",
    },
    {
      name: STATUS.inTime,
      value: inTimeValue,
      color: "#B4D947",
    },
  ].filter((item) => item.value > 0);

  const statusColors = statusData.map((item) => item.color);

  const displayedTotal =
    Number(totalOrders || 0) ||
    completedOrders + notFinishedValue;

  const selectSection = (sectionName) => {
    setSelectedSection(sectionName);
    onSelectStatus?.(sectionName);
  };

  return (
    <div className="production-ring-card production-ring-card--figma">

      {/* Вчасно */}

      <button
        type="button"
        className={`production-ring-card__figma-metric production-ring-card__figma-metric--in-time ${
          selectedSection === STATUS.inTime ? "is-selected" : ""
        }`}
        onClick={() => selectSection(STATUS.inTime)}
      >
        <span className="production-ring-card__figma-title">
          {t("production_statistics.in_time")}
        </span>

        <strong className="production-ring-card__figma-value">
          <span className="production-ring-card__figma-icon">
            <AppIcon name="FactorySuccessGreenIcon" />
          </span>

          {formatPercent(inTimePercent)}
        </strong>

        <small>
          {formatNumber(inTimeCount)} {t("production_statistics.order")}
          <br />
          {t("production_statistics.average")} {formatDays(averageProductionDays)} {t("production_statistics.units_pieces")}.
        </small>
      </button>

      {/* Лінія від Вчасно */}

      <span
        className="production-ring-card__figma-line production-ring-card__figma-line--left"
        aria-hidden="true"
      />

      {/* Діаграма */}

      <div className="production-ring-card__figma-chart">
        <ComplexityDonut
          data={statusData}
          colors={statusColors}
          centerLabel={t("production_statistics.total")}
          centerUnit={t("production_statistics.order")}
          centerValue={displayedTotal}
          centerIconName="listCalc"
          showLegend={false}
          showLabels={false}
          showTooltip={false}
          selectedName={selectedSection}
          onSectorClick={selectSection}
          height="320px"
          hoverScale
          startAngle={90}
        />
      </div>

      {/* Лінія від помаранчевого сектора */}

      {delayedValue > 0 ? (
        <span
          className="production-ring-card__figma-line production-ring-card__figma-line--delay-diagonal"
          aria-hidden="true"
        />
      ) : null}

      {delayedValue > 0 ? (
        <span
          className="production-ring-card__figma-line production-ring-card__figma-line--delay-horizontal"
          aria-hidden="true"
        />
      ) : null}

      {/* Запізнення */}

      <button
        type="button"
        className={`production-ring-card__figma-metric production-ring-card__figma-metric--delayed ${
          selectedSection === STATUS.delayed ? "is-selected" : ""
        }`}
        onClick={() => selectSection(STATUS.delayed)}
      >
        <span className="production-ring-card__figma-title">
          {t("production_statistics.delayed")}
        </span>

        <strong className="production-ring-card__figma-value">
          <span className="production-ring-card__figma-icon">
            <AppIcon name="FactorySuccessIcon" />
          </span>

          {formatPercent(delayedPercent)}
        </strong>

        <small>{formatNumber(delayedCount)} {t("production_statistics.order")}</small>
      </button>

      {/* У виробництві */}

      <button
        type="button"
        className={`production-ring-card__figma-metric production-ring-card__figma-metric--not-finished ${
          selectedSection === STATUS.notFinished ? "is-selected" : ""
        }`}
        onClick={() => selectSection(STATUS.notFinished)}
      >
        <span className="production-ring-card__figma-title">
          {t("production_statistics.in_production")}
        </span>

        <strong className="production-ring-card__figma-value">
          <span className="production-ring-card__figma-icon">
            <AppIcon name="InFactoryIcon" />
          </span>

          {formatNumber(notFinishedCount)}
        </strong>

        <small>{formatNumber(notFinishedCount)} {t("production_statistics.order")}</small>
      </button>
    </div>
  );
}

export default function ProductionStatisticsPage() {
  const { t, i18n } = useTranslation();
  const getProductionStatusLabel = (status) => {
    const key = {
      "Вчасно": "in_time",
      "Запізнення": "delayed",
      "У виробництві": "in_production",
      all: "all_abc",
    }[status];
    return key ? t(`production_statistics.${key}`) : status;
  };
  const [queryParams] = useSearchParams();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { dealerGuid, setDealerGuid, isAdmin, isLoading: dealerContextLoading } =
    useDealerContext();
  const initialFrom = queryParams.get("date_from") || monthStart.toISOString().slice(0, 10);
  const initialTo = queryParams.get("date_to") || monthEnd.toISOString().slice(0, 10);
  const requestedDealerGuid = queryParams.get("contractor_guid") || "";
  const pageRootRef = useRef(null);
  const orderDetailsRef = useRef(null);
  const constructionDetailsRef = useRef(null);
  const returnScrollPositionRef = useRef(null);
  const returnScrollContainerRef = useRef(null);
  const timelinessChartRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [unifiedData, setUnifiedData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedAbc, setSelectedAbc] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeConstructionCategory, setActiveConstructionCategory] = useState(null);
  const [activeConstructionSubCategory, setActiveConstructionSubCategory] =
    useState(null);
  const [activeAnalyticsSection, setActiveAnalyticsSection] = useState("systems");
  const [activeAnalyticsMetric, setActiveAnalyticsMetric] = useState("total_constructions");
  const [returnScrollPosition, setReturnScrollPosition] = useState(null);
  const [timelinessChartWidth, setTimelinessChartWidth] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }

    return document.body.classList.contains("dark-theme");
  });

  const [dateInputs, setDateInputs] = useState({
    from: initialFrom,
    to: initialTo,
  });
  const [searchParams, setSearchParams] = useState({
    from: initialFrom,
    to: initialTo,
  });

  useEffect(() => {
    if (!dealerContextLoading && isAdmin && requestedDealerGuid && requestedDealerGuid !== dealerGuid) {
      setDealerGuid(requestedDealerGuid);
    }
  }, [dealerContextLoading, dealerGuid, isAdmin, requestedDealerGuid, setDealerGuid]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const syncTheme = () => {
      setIsDarkTheme(document.body.classList.contains("dark-theme"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = timelinessChartRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setTimelinessChartWidth(Math.max(Math.floor(element.clientWidth || 0), 0));
    };

    updateWidth();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(element);
    }

    window.addEventListener("resize", updateWidth);
    const frameId = requestAnimationFrame(updateWidth);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener("resize", updateWidth);
      cancelAnimationFrame(frameId);
    };
  }, [dashboardData]);

  useEffect(() => {
    if (dealerContextLoading) {
      return;
    }

    if (isAdmin && !dealerGuid) {
      setDashboardData(null);
      setUnifiedData(null);
      setComparisonData(null);
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
        const [timelinessResponse, unifiedResponse, comparisonResponse] = await Promise.all([
          axiosInstance.get("/production-timeliness/", { params }),
          axiosInstance.get("/production-unified-analytics/", { params }),
          axiosInstance.get("/dealer-portal-comparison/", { params }),
        ]);

        if (!isCancelled) {
          setDashboardData(timelinessResponse.data);
          setUnifiedData(unifiedResponse.data);
          setComparisonData(comparisonResponse.data);
        }
      } catch (err) {
        if (isCancelled) {
          return;
        }

        const message =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          t("production_statistics.load_error");
        setError(message);
        setDashboardData(null);
        setUnifiedData(null);
        setComparisonData(null);
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
  }, [dealerContextLoading, dealerGuid, isAdmin, searchParams, t]);

  const summary = dashboardData?.summary || [];
  const orders = dashboardData?.orders || [];
  const meta = dashboardData?.meta || {};
  const completedTopOrdersCount = Number(meta.in_time_count || 0) + Number(meta.delayed_count || 0);
  const topInTimePercent = completedTopOrdersCount > 0 ? (Number(meta.in_time_count || 0) / completedTopOrdersCount) * 100 : 0;
  const topDelayedPercent = completedTopOrdersCount > 0 ? (Number(meta.delayed_count || 0) / completedTopOrdersCount) * 100 : 0;

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
      "У виробництві": item.not_finished_count,
    }));
  }, [summary]);

  const timelinessChartHeight = useMemo(() => {
    if (timelinessChartWidth <= 420) {
      return 430;
    }
    if (timelinessChartWidth <= 720) {
      return 500;
    }
    return 560;
  }, [timelinessChartWidth]);

  const timelinessTheme = useMemo(() => {
    if (isDarkTheme) {
      return {
        grid: "#585450",
        axis: "#aeaeae",
        ticks: "#ffffff",
        legend: "#aeaeae",
      };
    }

    return {
      grid: "#d8dee7",
      axis: "#8a97a8",
      ticks: "#314154",
      legend: "#5f6d7e",
    };
  }, [isDarkTheme]);

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

  const fastestCards = useMemo(() => {
    return ["A", "B", "C"].map((abcKey) => {
      const group = fastestByAbc.find((item) => item.abc === abcKey);
      return {
        abc: abcKey,
        order: group?.items?.[0] || null,
      };
    });
  }, [fastestByAbc]);

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

  const abcSummaryCards = useMemo(() => {
    const summaryMap = new Map(summary.map((item) => [item.abc, item]));

    return ABC_CARD_ORDER.map((abcKey) => {
      const existing = summaryMap.get(abcKey);
      return (
        existing || {
          abc: abcKey,
          in_time_percent: 0,
          orders_count: 0,
          in_time_count: 0,
          delayed_count: 0,
          not_finished_count: 0,
        }
      );
    });
  }, [summary]);

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

  const groupedProfileSystems = useMemo(() => {
    const groupsMap = new Map(
      PROFILE_SYSTEM_GROUPS.map((group) => [
        group.label,
        {
          key: group.key,
          label: group.label,
          items: [],
        },
      ]),
    );

    profileSystemsSorted.forEach((item) => {
      const groupLabel = resolveProfileSystemGroup(item.profile_system);
      const targetGroup = groupsMap.get(groupLabel) || groupsMap.get("Інше");

      if (!targetGroup) {
        return;
      }

      targetGroup.items.push({
        label: item.profile_system,
        total_constructions: Number(item.total_constructions || 0),
        orders_count: Number(item.orders_count || 0),
        total_sum: Number(item.total_sum || 0),
        avg_check: Number(item.avg_check || 0),
      });
    });

    return Array.from(groupsMap.values())
      .map((group) => ({
        ...group,
        displayLabel:
          group.label === "Інше"
            ? `Інше (${Array.from(
                new Set(group.items.map((item) => item.label).filter(Boolean)),
              ).join(", ")})`
            : group.label,
        items: [...group.items].sort(
          (left, right) => Number(right.total_constructions || 0) - Number(left.total_constructions || 0),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [profileSystemsSorted]);

  const analyticsSections = useMemo(
    () => [
      {
        key: "systems",
        label: t("production_statistics.profile_systems"),
        icon: "windows",
        iconKind: "app",
        eyebrow: "Profile systems",
        count: profileSystems.length,
        countLabel: t("production_statistics.systems"),
        groupedItems: groupedProfileSystems,
        items: profileSystemsSorted.map((item) => ({
          label: item.profile_system,
          total_constructions: Number(item.total_constructions || 0),
          orders_count: Number(item.orders_count || 0),
          total_sum: Number(item.total_sum || 0),
          avg_check: Number(item.avg_check || 0),
        })),
        metrics: [
          { key: "total_constructions", label: t("production_statistics.constructions"), icon: "windows", accent: "#B4D947" },
          { key: "orders_count", label: t("production_statistics.orders"), icon: "listCalc", accent: "#6B98BF" },
          { key: "avg_check", label: t("production_statistics.average_check"), icon: "moneyGreen", accent: "#6B98BF" },
          { key: "total_sum", label: t("production_statistics.turnover"), icon: "money", accent: "#6B98BF" },
        ],
      },
      {
        key: "colors",
        label: t("production_statistics.profile_colors"),
        icon: "filters",
        iconKind: "app",
        eyebrow: "Profile colors",
        count: profileColors.length,
        countLabel: t("production_statistics.colors"),
        items: profileColors.map((item) => ({
          label: item.name,
          total_constructions: Number(item.total_constructions || 0),
          orders_count: Number(item.orders_count || 0),
          total_sum: Number(item.total_sum || 0),
        })),
        metrics: [
          { key: "total_constructions", label: t("production_statistics.constructions"), icon: "windows", accent: "#B4D947" },
          { key: "orders_count", label: t("production_statistics.orders"), icon: "listCalc", accent: "#6B98BF" },
          { key: "total_sum", label: t("production_statistics.turnover"), icon: "money", accent: "#6B98BF" },
        ],
      },
      {
        key: "hardware",
        label: t("production_statistics.hardware"),
        iconKind: "fa",
        eyebrow: "Hardware and extras",
        count: furniture.length,
        countLabel: t("production_statistics.positions"),
        items: furniture.map((item) => ({
          label: item.name,
          total_constructions: Number(item.total_constructions || 0),
          orders_count: Number(item.orders_count || 0),
          total_sum: Number(item.total_sum || 0),
        })),
        metrics: [
          { key: "total_constructions", label: t("production_statistics.constructions"), icon: "windows", accent: "#B4D947" },
          { key: "orders_count", label: t("production_statistics.orders"), icon: "listCalc", accent: "#6B98BF" },
          { key: "total_sum", label: t("production_statistics.turnover"), icon: "money", accent: "#6B98BF" },
        ],
      },
    ],
    [furniture, groupedProfileSystems, profileColors, profileSystems.length, profileSystemsSorted, t],
  );

  const activeAnalyticsConfig = useMemo(() => {
    return (
      analyticsSections.find((item) => item.key === activeAnalyticsSection) ||
      analyticsSections[0] ||
      null
    );
  }, [activeAnalyticsSection, analyticsSections]);

  useEffect(() => {
    if (!activeAnalyticsConfig) {
      return;
    }

    const hasMetric = activeAnalyticsConfig.metrics.some(
      (metric) => metric.key === activeAnalyticsMetric,
    );

    if (!hasMetric) {
      setActiveAnalyticsMetric(activeAnalyticsConfig.metrics[0]?.key || "total_constructions");
    }
  }, [activeAnalyticsConfig, activeAnalyticsMetric]);

  const activeAnalyticsMetricConfig = useMemo(() => {
    return (
      activeAnalyticsConfig?.metrics.find((item) => item.key === activeAnalyticsMetric) ||
      activeAnalyticsConfig?.metrics[0] ||
      null
    );
  }, [activeAnalyticsConfig, activeAnalyticsMetric]);

  const analyticsDisplayItems = useMemo(() => {
    if (!activeAnalyticsConfig || !activeAnalyticsMetricConfig) {
      return [];
    }

    return [...activeAnalyticsConfig.items]
      .sort(
        (left, right) =>
          Number(right[activeAnalyticsMetricConfig.key] || 0) -
          Number(left[activeAnalyticsMetricConfig.key] || 0),
      )
      .slice(0, 17);
  }, [activeAnalyticsConfig, activeAnalyticsMetricConfig]);

  const analyticsGroupedDisplayItems = useMemo(() => {
    if (activeAnalyticsSection !== "systems" || !activeAnalyticsConfig?.groupedItems?.length) {
      return [];
    }

    return activeAnalyticsConfig.groupedItems.map((group) => ({
      ...group,
      total_constructions: group.items.reduce(
        (sum, item) => sum + Number(item.total_constructions || 0),
        0,
      ),
      orders_count: group.items.reduce(
        (sum, item) => sum + Number(item.orders_count || 0),
        0,
      ),
      total_sum: group.items.reduce(
        (sum, item) => sum + Number(item.total_sum || 0),
        0,
      ),
      avg_check: group.items.length
        ? group.items.reduce((sum, item) => sum + Number(item.avg_check || 0), 0) /
          group.items.length
        : 0,
    }));
  }, [activeAnalyticsConfig, activeAnalyticsMetric, activeAnalyticsSection]);

  const analyticsMaxValue = useMemo(() => {
    const sourceItems =
      activeAnalyticsSection === "systems" && analyticsGroupedDisplayItems.length
        ? analyticsGroupedDisplayItems
        : analyticsDisplayItems;

    return Math.max(
      ...sourceItems.map((item) => Number(item[activeAnalyticsMetric] || 0)),
      1,
    );
  }, [
    activeAnalyticsMetric,
    activeAnalyticsSection,
    analyticsDisplayItems,
    analyticsGroupedDisplayItems,
  ]);

  const analyticsScaleValues = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) =>
      Math.round((analyticsMaxValue / 5) * index),
    );
  }, [analyticsMaxValue]);

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

  const comparisonSelectedDealer = comparisonData?.selected_dealer || null;
  const comparisonTotals = comparisonData?.totals || {};
  const comparisonInsights = comparisonData?.insights || {};
  const comparisonLeaderboard = useMemo(() => {
    return Array.isArray(comparisonData?.leaderboard)
      ? comparisonData.leaderboard
      : [];
  }, [comparisonData]);

  const comparisonLeader = useMemo(() => {
    if (!comparisonLeaderboard.length || !comparisonSelectedDealer) {
      return null;
    }

    const selectedRegion = normalizeRegionName(comparisonSelectedDealer.region_name || "");
    const regionalLeaderboard = comparisonLeaderboard.filter((item) => {
      return normalizeRegionName(item.region_name || "") === selectedRegion;
    });
    const source = regionalLeaderboard.length ? regionalLeaderboard : comparisonLeaderboard;

    return [...source].sort((left, right) => {
      const leftRegionalRank = Number(left.region_turnover_rank || Number.MAX_SAFE_INTEGER);
      const rightRegionalRank = Number(right.region_turnover_rank || Number.MAX_SAFE_INTEGER);
      if (regionalLeaderboard.length && leftRegionalRank !== rightRegionalRank) {
        return leftRegionalRank - rightRegionalRank;
      }

      const leftRank = Number(left.turnover_rank || Number.MAX_SAFE_INTEGER);
      const rightRank = Number(right.turnover_rank || Number.MAX_SAFE_INTEGER);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return Number(right.total_turnover || 0) - Number(left.total_turnover || 0);
    })[0];
  }, [comparisonLeaderboard, comparisonSelectedDealer]);

  const comparisonMetricCards = useMemo(() => {
    if (!comparisonSelectedDealer) {
      return [];
    }

    return [
      {
        key: "turnover",
        label: t("production_statistics.turnover"),
        color: "#5CCCBD",
        iconName: "money",
        percent: calculateComparisonPercent(
          comparisonSelectedDealer.total_turnover,
          comparisonLeader?.total_turnover,
        ),
        valueLabel: formatCurrencyPlain(comparisonSelectedDealer.total_turnover),
      },
      {
        key: "orders",
        label: t("production_statistics.orders"),
        color: "#F28A29",
        iconName: "listCalc",
        percent: calculateComparisonPercent(
          comparisonSelectedDealer.orders_count,
          comparisonLeader?.orders_count,
        ),
        valueLabel: `${formatNumber(comparisonSelectedDealer.orders_count)} ${t("production_statistics.orders")}`,
      },
      {
        key: "constructions",
        label: t("production_statistics.constructions"),
        color: "#6B99BF",
        iconName: "windows",
        percent: calculateComparisonPercent(
          comparisonSelectedDealer.total_constructions,
          comparisonLeader?.total_constructions,
        ),
        valueLabel: `${formatNumber(comparisonSelectedDealer.total_constructions)} ${t("production_statistics.constructions")}`,
      },
      {
        key: "avg-check",
        label: t("production_statistics.average_check"),
        color: "#944FD1",
        iconName: "moneyGreen",
        percent: calculateComparisonPercent(
          comparisonSelectedDealer.avg_check,
          comparisonLeader?.avg_check,
        ),
        valueLabel: formatCurrencyPlain(comparisonSelectedDealer.avg_check),
      },
    ];
  }, [comparisonLeader, comparisonSelectedDealer, t]);

  const comparisonOverallPercent = useMemo(() => {
    if (!comparisonMetricCards.length) {
      return 0;
    }

    const totalPercent = comparisonMetricCards.reduce(
      (sum, item) => sum + Number(item.percent || 0),
      0,
    );

    return totalPercent / comparisonMetricCards.length;
  }, [comparisonMetricCards]);

  const handleSearch = () => {
    setSelectedAbc("all");
    setSelectedStatus("all");
    setShowOrderDetails(false);
    setActiveConstructionCategory(null);
    setActiveConstructionSubCategory(null);
    setReturnScrollPosition(null);
    returnScrollPositionRef.current = null;
    setSearchParams({ ...dateInputs });
  };

  const getScrollContainer = () => {
    if (returnScrollContainerRef.current) {
      return returnScrollContainerRef.current;
    }

    let current = pageRootRef.current?.parentElement || null;

    while (current) {
      const styles = window.getComputedStyle(current);
      const overflowY = styles.overflowY;
      const isScrollable =
        (overflowY === "auto" || overflowY === "scroll") &&
        current.scrollHeight > current.clientHeight;

      if (isScrollable) {
        returnScrollContainerRef.current = current;
        return current;
      }

      current = current.parentElement;
    }

    const fallback =
      document.scrollingElement || document.documentElement || document.body;
    returnScrollContainerRef.current = fallback;
    return fallback;
  };

  const rememberScrollPosition = () => {
    const scrollContainer = getScrollContainer();
    const currentPosition =
      scrollContainer?.scrollTop ??
      window.scrollY ??
      window.pageYOffset ??
      document.documentElement.scrollTop ??
      0;

    returnScrollContainerRef.current = scrollContainer;
    returnScrollPositionRef.current = currentPosition;
    setReturnScrollPosition(currentPosition);
  };

  const handleRingStatusClick = (statusLabel) => {
    rememberScrollPosition();
    setSelectedAbc("all");
    setSelectedStatus(statusLabel);
    setShowOrderDetails(true);

    requestAnimationFrame(() => {
      orderDetailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleTimelinessBarClick = (entry, statusLabel) => {
    const abc = entry?.payload?.abc;
    if (!abc) {
      return;
    }

    rememberScrollPosition();
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
    rememberScrollPosition();
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

  const handleReturnToPreviousPosition = () => {
    const targetPosition = returnScrollPositionRef.current ?? returnScrollPosition;

    if (targetPosition === null || targetPosition === undefined) {
      return;
    }

    const nextTop = Math.max(targetPosition - 16, 0);
    const scrollingElement =
      returnScrollContainerRef.current ||
      getScrollContainer() ||
      document.scrollingElement ||
      document.documentElement ||
      document.body;

    if (scrollingElement && typeof scrollingElement.scrollTo === "function") {
      scrollingElement.scrollTo({
        top: nextTop,
        behavior: "smooth",
      });
    } else if (scrollingElement) {
      scrollingElement.scrollTop = nextTop;
    }
  };

  const showReturnToPreviousButton =
    returnScrollPosition !== null &&
    (showOrderDetails || Boolean(activeConstructionGroup));

  return (
    <main ref={pageRootRef} className={`production-design ${isDarkTheme ? "is-dark" : "is-light"}`}>
      <section className="production-design__hero">
        <div>
          <div className="production-design__eyebrow">ABC production timeline</div>
          <h1>{t("production_statistics.title")}</h1>
          <p>{t("production_statistics.subtitle")}</p>
        </div>
        <div className="production-design__filters">
          <div className="production-design__filters-stack">
            {isAdmin ? <div className="production-design__dealer"><span>{t("production_statistics.dealer")}</span><DealerSelect value={dealerGuid} onChange={setDealerGuid} /></div> : null}
            <div className="production-design__date-range">
              <label><span>{t("production_statistics.from")}</span><input type="date" value={dateInputs.from} onChange={(event) => setDateInputs((prev) => ({ ...prev, from: event.target.value }))} /></label>
              <label><span>{t("production_statistics.to")}</span><input type="date" value={dateInputs.to} onChange={(event) => setDateInputs((prev) => ({ ...prev, to: event.target.value }))} /></label>
            </div>
          </div>
          <button type="button" onClick={handleSearch} disabled={loading || (isAdmin && !dealerGuid)}><AppIcon name="AnalyticsSearchIcon" className="w-[20px] h-[20px]" />{loading ? t("production_statistics.generating") : t("production_statistics.generate")}</button>
        </div>
      </section>

      {error ? <section className="production-design__state"><FaExclamationTriangle /><h2>{t("production_statistics.data_unavailable")}</h2><p>{error}</p><button type="button" onClick={handleSearch}>{t("production_statistics.retry")}</button></section> : null}
      {!error && loading ? <section className="production-design__state"><div className="loading-spinner" /><h2>{t("production_statistics.generating_statistics")}</h2></section> : null}
      {!error && isAdmin && !dealerGuid && !loading ? <section className="production-design__state"><FaFilter /><h2>{t("production_statistics.select_dealer")}</h2><p>{t("production_statistics.select_dealer_hint")}</p></section> : null}

      {!error && !loading && hasData ? <>
        <section className="production-design__kpi">
          <article className="production-design__average-card">
            <div className="production-design__eyebrow">{t("production_statistics.average_check")}</div>
            <strong className="production-design__average-value">
              <AppIcon name="money" className="w-[30px] h-[27px] color-[#B4D947] mt-1.5 mr-2" />
              {formatCurrency(meta.avg_check)}
            </strong>
            <div className="production-design__period"><AppIcon name="CalendarIcon" className="w-[30px] h-[27px]" /><span>{t("production_statistics.for_period")}<b>{formatDate(searchParams.from, i18n.language)} - {formatDate(searchParams.to, i18n.language)}</b></span></div>
            <div className="production-design__counts">
  <span className="production-design__count-item">
    <small>{t("production_statistics.orders")}</small>

    <div className="production-design__count-value">
      <AppIcon
        name="listCalc"
        className="w-[20px] h-[20px]"
      />
      <b>{formatNumber(meta.orders_count)}</b>
    </div>
  </span>

  <span className="production-design__count-item">
    <small>{t("production_statistics.constructions")}</small>

    <div className="production-design__count-value">
      <AppIcon
        name="windows"
        className="w-[20px] h-[20px]"
      />
      <b>{formatNumber(meta.total_constructions)}</b>
    </div>
  </span>
</div>
          </article>
          <ProductionRingCard inTimePercent={topInTimePercent} inTimeCount={meta.in_time_count} averageProductionDays={inTimeProductionDays.overallAverage} delayedPercent={topDelayedPercent} delayedCount={meta.delayed_count} notFinishedCount={meta.not_finished_count} totalOrders={meta.orders_count} onSelectStatus={handleRingStatusClick} />
          <div className="production-design__summary-stack">
            <article><div className="production-design__eyebrow">{t("production_statistics.turnover")}</div><strong><AppIcon name="money" className="w-[30px] h-[27px] color-[#9FD3FF]" />{formatCurrency(meta.total_sum)}</strong><span>{t("production_statistics.turnover_hint")}</span></article>
            <article><div className="production-design__eyebrow">{t("production_statistics.average_delay")}</div><strong><AppIcon name="AverageWaitingIcon" className="w-[33px] h-[30px]" />{formatDays(meta.avg_delay_days)} дн.</strong><span>{t("production_statistics.max_delay", { days: formatDays(meta.max_delay_days) })}</span></article>
          </div>
        </section>

        <section className="production-design__dashboard-grid">
          <article className="production-design__panel production-design__panel--profile-donut">
            <div className="production-design__panel-heading"><div><div className="production-design__eyebrow">Portfolio by category</div><h2 className="uppercase font-bold">{t("production_statistics.categories")}</h2></div></div>
            {constructionDonutData.length ? <ComplexityDonut data={constructionDonutData}
    colors={[
        "#B4D947",
        "#ED8B33",
        "#9FD3FF",
        "#A8A8A8",
        "#D7C53B",
        "#7EBAF2",
    ]}
   onSectorClick={handleConstructionCategorySelect} height="560px" /> : <div className="production-design__empty">{t("production_statistics.no_data")}</div>}
          </article>
          <div className="production-design__abc-column">
            {abcSummaryCards.map((item) => <article key={item.abc} className="production-design__abc-card" style={{ "--abc": ABC_COLORS[item.abc] || ABC_COLORS.Other }}>
              <header>
                <b>{t("production_statistics.class", { value: item.abc })}</b>
                <p>{ABC_PRODUCTION_HINTS[item.abc] || ABC_PRODUCTION_HINTS.Other}</p>
                <span>{formatPercent(item.in_time_percent)}</span>
              </header>
              <div className="production-design__abc-volume"><strong>{formatNumber(item.orders_count)}</strong><small>{t("production_statistics.orders_in_progress").split("\n").map((line, index) => <span key={index}>{line}{index === 0 ? <br /> : null}</span>)}</small></div>
              <div className="production-design__progress"><i style={{ width: Math.min(Number(item.in_time_percent || 0), 100) + "%" }} /></div>
              <footer>
                <div><span>{t("production_statistics.in_time")}:</span><b>{formatNumber(item.in_time_count)}{inTimeProductionDays.averageByAbc[item.abc] !== null && inTimeProductionDays.averageByAbc[item.abc] !== undefined ? ` • ${formatDays(inTimeProductionDays.averageByAbc[item.abc])} дн.` : ""}</b></div>
                <div><span>{t("production_statistics.delayed")}:</span><b>{formatNumber(item.delayed_count)}</b></div>
                <div><span>{t("production_statistics.in_production")}:</span><b>{formatNumber(item.not_finished_count)}</b></div>
              </footer>
            </article>)}
          </div>
          <article className="production-design__panel production-design__panel--timeliness">
            <div className="production-design__panel-heading"><div><div className="production-design__eyebrow">Timeliness mix</div><h2 className="uppercase font-bold mb-3">{t("production_statistics.timeliness_abc")}</h2></div></div>
            <div ref={timelinessChartRef} className="production-design__timeliness-chart-shell">
              {timelinessChartWidth > 0 ? (
                <BarChart width={timelinessChartWidth} height={timelinessChartHeight} data={chartData} barCategoryGap="32%" barSize={timelinessChartWidth <= 420 ? 34 : timelinessChartWidth <= 720 ? 44 : 64}>
                  <CartesianGrid strokeDasharray="3 3" stroke={timelinessTheme.grid} vertical={false} />
                  <XAxis dataKey="abc" tickLine={false} axisLine={{ stroke: timelinessTheme.axis }} stroke={timelinessTheme.ticks} />
                  <YAxis tickLine={false} axisLine={{ stroke: timelinessTheme.axis }} stroke={timelinessTheme.axis} allowDecimals={false} />
                  <Tooltip content={<TimelinessTooltip isDark={isDarkTheme} />} />
                  <Legend verticalAlign="bottom" iconType="square" iconSize={10} formatter={(value) => getProductionStatusLabel(value)} wrapperStyle={{ paddingTop: 12, color: timelinessTheme.legend, fontSize: 12 }} />
                  <Bar dataKey="Вчасно" stackId="production-status" fill="#b4d947" onClick={(entry) => handleTimelinessBarClick(entry, "Вчасно")} cursor="pointer" />
                  <Bar dataKey="Запізнення" stackId="production-status" fill="#ed8b33" onClick={(entry) => handleTimelinessBarClick(entry, "Запізнення")} cursor="pointer" />
                  <Bar dataKey="У виробництві" stackId="production-status" fill="#6b98bf" radius={[4, 4, 0, 0]} onClick={(entry) => handleTimelinessBarClick(entry, "У виробництві")} cursor="pointer" />
                </BarChart>
              ) : null}
            </div>
            <p>{t("production_statistics.timeliness_hint")}</p>
          </article>
        </section>

               <section className="production-design__panel production-design__fastest">
          <div className="production-design__panel-heading"><div><div className="production-design__eyebrow">Fastest orders</div><h2 className="uppercase font-bold">{t("production_statistics.fastest_abc")}</h2></div></div>
          <div className="production-design__fastest-grid">
            {fastestCards.map(({ abc, order }) => (
              <div key={abc} className="production-design__fastest-col">
                <span
                  className="production-design__fastest-badge"
                  style={{ "--fastest-color": ABC_COLORS[abc] || ABC_COLORS.Other }}
                >
                  Клас {abc}
                </span>
                <article className="production-design__fastest-card">
                  <div>
                    <b>{order?.order_number || "—"}</b>
                    <small>
                      {order
                        ? t("production_statistics.order_ready", { orderDate: formatDate(order.order_date, i18n.language), readyDate: formatDate(order.ready_production_max, i18n.language) })
                        : t("production_statistics.no_orders")}
                    </small>
                  </div>
                  <strong style={{ color: "#B4D947" }}>
                    {order ? `${formatDays(order.production_days)} дн.` : "—"}
                  </strong>
                </article>
              </div>
            ))}
          </div>
        </section>

 

        {comparisonSelectedDealer ? <section className="production-design__dealer-comparison">
          <div className="production-design__dealer-shell">
            <header className="production-design__dealer-head">
              <div className="production-design__dealer-head-copy">
                <div className="production-design__eyebrow">{t("production_statistics.dealer_comparison")}</div>
                <div className="production-design__dealer-head-title">
                  <h2>{comparisonSelectedDealer.dealer_name}</h2>
                  <span>{t("production_statistics.comparison_top")}</span>
                </div>
              </div>
              <div className="production-design__dealer-ranks">
                <div>
                  <strong>
                    <FaTrophy />
                    {formatNumber(comparisonSelectedDealer.region_turnover_rank)}
                  </strong>
                  <small>{t("production_statistics.in_region")}</small>
                </div>
              </div>
            </header>

            <div className="production-design__dealer-main">
              <article className="production-design__dealer-panel production-design__dealer-panel--metrics">
                <div className="production-design__dealer-panel-head">
                  <h3>{t("production_statistics.comparison_top")}</h3>
                  <span>{t("production_statistics.comparison_hint")}</span>
                </div>
                <div className="production-design__dealer-gauges">
                  {comparisonMetricCards.map((item) => (
                    <ComparisonGauge
                      key={item.key}
                      label={item.label}
                      percent={item.percent}
                      valueLabel={item.valueLabel}
                      color={item.color}
                      iconName={item.iconName}
                    />
                  ))}
                </div>
              </article>

              <aside className="production-design__dealer-panel production-design__dealer-panel--overall">
                <span className="production-design__dealer-overall-label">
                  {t("production_statistics.overall_level")}
                </span>
                <div
                  className="production-design__dealer-overall-ring"
                  style={{ "--dealer-overall-value": `${comparisonOverallPercent}%` }}
                >
                  <div className="production-design__dealer-overall-center">
                    <span className="production-design__dealer-gauge-icon">
                      <FaMedal />
                    </span>
                    {formatRoundedPercent(comparisonOverallPercent)}
                  </div>
                </div>
                <p>{t("production_statistics.average_vs_leader")}</p>
                <div className="production-design__dealer-profit-card">
                  <span>{t("production_statistics.expected_profit")}</span>
                  <strong>+{formatCurrencyPlain(comparisonInsights.extra_profit_vs_region_20 || 0)}</strong>
                 <small>{t("production_statistics.profit_hint")}</small>
                </div>
              </aside>
            </div>

          </div>
        </section> : null}

        <section className="production-design__panel production-design__analytics-switcher">
          <div className="production-design__analytics-head">
            <div>
              <div className="production-design__eyebrow">
                {activeAnalyticsConfig?.eyebrow || "Profile systems"}
              </div>
              <h2>{activeAnalyticsConfig?.label || t("production_statistics.profile_systems")}</h2>
            </div>
            <span>
              {formatNumber(activeAnalyticsConfig?.count || 0)} {activeAnalyticsConfig?.countLabel || ""}
            </span>
          </div>

          <div className="production-design__analytics-tabs">
            {analyticsSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={section.key === activeAnalyticsSection ? "is-active" : ""}
                onClick={() => setActiveAnalyticsSection(section.key)}
              >
                {section.iconKind === "app" ? (
                  <AppIcon name={section.icon} />
                ) : (
                  <FaCogs />
                )}
                {section.label}
              </button>
            ))}
          </div>

          {activeAnalyticsSection === "systems" && analyticsGroupedDisplayItems.length ? (
            <div className="production-design__analytics-chart">
              <div className="production-design__analytics-rows">
                {[...analyticsGroupedDisplayItems]
                  .sort(
                    (left, right) =>
                      Number(right[activeAnalyticsMetric] || 0) -
                      Number(left[activeAnalyticsMetric] || 0),
                  )
                  .map((group) => {
                    const metricValue = Number(group[activeAnalyticsMetric] || 0);
                    return (
                      <article
                        key={`${activeAnalyticsSection}-${group.label}`}
                        className="production-design__analytics-row"
                      >
                        <b title={group.displayLabel || group.label}>{group.displayLabel || group.label}</b>
                        <div className="production-design__analytics-row-track">
                          <i
                            style={{
                              width: `${(metricValue / analyticsMaxValue) * 100}%`,
                            }}
                          />
                        </div>
                        <span>{formatAnalyticsMetricValue(activeAnalyticsMetric, metricValue)}</span>
                      </article>
                    );
                  })}
              </div>

              <div className="production-design__analytics-scale">
                {analyticsScaleValues.map((value, index) => (
                  <span key={`${value}-${index}`}>
                    {activeAnalyticsMetric === "avg_check"
                      ? formatCurrency(value)
                      : activeAnalyticsMetric === "total_sum"
                        ? formatCurrency(value)
                        : activeAnalyticsMetric === "orders_count"
                          ? `${formatNumber(value)} ${t("production_statistics.units_orders")}`
                          : `${formatNumber(value)} ${t("production_statistics.units_pieces")}`}
                  </span>
                ))}
              </div>
            </div>
          ) : analyticsDisplayItems.length ? (
            <div className="production-design__analytics-chart">
              <div className="production-design__analytics-rows">
                {analyticsDisplayItems.map((item) => {
                  const metricValue = Number(item[activeAnalyticsMetric] || 0);
                  return (
                    <article key={`${activeAnalyticsSection}-${item.label}`} className="production-design__analytics-row">
                      <b title={item.label}>{item.label}</b>
                      <div className="production-design__analytics-row-track">
                        <i
                          style={{
                            width: `${(metricValue / analyticsMaxValue) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{formatAnalyticsMetricValue(activeAnalyticsMetric, metricValue)}</span>
                    </article>
                  );
                })}
              </div>

              <div className="production-design__analytics-scale">
                {analyticsScaleValues.map((value, index) => (
                  <span key={`${value}-${index}`}>
                    {formatNumber(value)}
                  </span>
                ))}
              </div>

              <div className="production-design__analytics-axis-label">
                {activeAnalyticsMetric === "avg_check"
                  ? t("production_statistics.average_check")
                  : activeAnalyticsMetric === "total_sum"
                    ? `${t("production_statistics.turnover")}, грн`
                    : activeAnalyticsMetric === "orders_count"
                      ? `${t("production_statistics.orders")}, ${t("production_statistics.units_pieces")}`
                      : `${t("production_statistics.constructions")}, ${t("production_statistics.units_pieces")}`}
              </div>
            </div>
          ) : (
            <div className="production-design__empty">{t("production_statistics.no_data")}</div>
          )}

          <div className="production-design__analytics-metrics">
            {(activeAnalyticsConfig?.metrics || []).map((metric) => (
              <button
                key={metric.key}
                type="button"
                className={metric.key === activeAnalyticsMetric ? "is-active" : ""}
                onClick={() => setActiveAnalyticsMetric(metric.key)}
              >
                <AppIcon name={metric.icon} />
                {metric.label}
              </button>
            ))}
          </div>
        </section>

        {activeConstructionGroup ? <section ref={constructionDetailsRef} className="production-design__panel production-design__details"><button type="button" onClick={() => { setActiveConstructionCategory(null); setActiveConstructionSubCategory(null); }}>×</button><div className="production-design__panel-heading"><div><div className="production-design__eyebrow">Construction details</div><h2>{t("production_statistics.order_details")}: {activeConstructionGroup.name}</h2></div></div><ComplexityTreemap data={constructionTreemapData} activeGroup={activeConstructionGroup.name} height="520px" /></section> : null}

        {showOrderDetails ? <section ref={orderDetailsRef} className="production-design__panel production-design__orders">
          <button type="button" onClick={() => setShowOrderDetails(false)} aria-label={t("production_statistics.close_details")}>×</button>
          <div className="production-design__panel-heading"><div><div className="production-design__eyebrow">Order details</div><h2>{t("production_statistics.order_details")}</h2><p className="production-design__orders-caption">{t("production_statistics.opened_for", { scope: selectedAbc === "all" ? t("production_statistics.all_classes") : t("production_statistics.class_scope", { value: selectedAbc }), status: selectedStatus === "all" ? t("production_statistics.all_statuses") : getProductionStatusLabel(selectedStatus).toLowerCase() })}</p></div></div>
          <div className="production-design__order-filters">
            <div>{abcTabs.map((tab) => <button key={tab} type="button" className={selectedAbc === tab ? "is-active" : ""} onClick={() => setSelectedAbc(tab)}>{tab === "all" ? t("production_statistics.all_abc") : t("production_statistics.class", { value: tab })}</button>)}</div>
            <div>{Object.entries(STATUS_LABELS).map(([key, label]) => <button key={key} type="button" className={selectedStatus === key ? "is-active" : ""} onClick={() => setSelectedStatus(key)}>{getProductionStatusLabel(label)}</button>)}</div>
          </div>
          <table><thead><tr><th>ABC</th><th>{t("production_statistics.orders")}</th><th>{t("production_statistics.date")}</th><th>{t("production_statistics.plan")}</th><th>{t("production_statistics.fact")}</th><th>{t("production_statistics.status")}</th><th>{t("production_statistics.delay")}</th><th>{t("production_statistics.sum")}</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.order_id || order.order_number}><td><b className="production-design__abc-pill">{order.abc}</b></td><td><strong>{order.order_number}</strong><small>{order.client_order_number || ""}</small></td><td>{formatDate(order.order_date, i18n.language)}</td><td>{formatDate(order.planned_production_date, i18n.language)}</td><td>{formatDate(order.ready_production_max, i18n.language)}</td><td><div className="production-design__status-stack"><span className={`production-design__status production-design__status--${order.production_status === "Вчасно" ? "good" : order.production_status === "Запізнення" ? "late" : "idle"}`}>{getProductionStatusLabel(order.production_status)}</span>{order.production_status === "Вчасно" && order.production_days !== null ? <small className="production-design__status-caption">{t("production_statistics.made_in", { days: formatDays(order.production_days) })}</small> : null}</div></td><td>{order.delay_bucket || "—"}</td><td>{formatCurrency(order.order_sum)}</td></tr>) : <tr><td colSpan="8" className="production-design__orders-empty">{t("production_statistics.orders_empty")}</td></tr>}</tbody></table>
          <div className="production-design__orders-mobile-list">
            {filteredOrders.length ? filteredOrders.map((order) => <article key={`mobile-${order.order_id || order.order_number}`} className="production-design__order-card">
              <div className="production-design__order-card-head">
                <b className="production-design__abc-pill">{order.abc}</b>
                <div>
                  <strong>{order.order_number}</strong>
                  {order.client_order_number ? <small>{order.client_order_number}</small> : null}
                </div>
                <div className="production-design__status-stack">
                  <span className={`production-design__status production-design__status--${order.production_status === "Вчасно" ? "good" : order.production_status === "Запізнення" ? "late" : "idle"}`}>{getProductionStatusLabel(order.production_status)}</span>
                  {order.production_status === "Вчасно" && order.production_days !== null ? <small className="production-design__status-caption">{t("production_statistics.made_in", { days: formatDays(order.production_days) })}</small> : null}
                </div>
              </div>
              <div className="production-design__order-card-grid">
                <div><span>{t("production_statistics.date")}</span><strong>{formatDate(order.order_date, i18n.language)}</strong></div>
                <div><span>{t("production_statistics.plan")}</span><strong>{formatDate(order.planned_production_date, i18n.language)}</strong></div>
                <div><span>{t("production_statistics.fact")}</span><strong>{formatDate(order.ready_production_max, i18n.language)}</strong></div>
                <div><span>{t("production_statistics.delay")}</span><strong>{order.delay_bucket || "—"}</strong></div>
                <div className="is-wide"><span>{t("production_statistics.sum")}</span><strong>{formatCurrency(order.order_sum)}</strong></div>
              </div>
            </article>) : <div className="production-design__orders-empty production-design__orders-empty--mobile">{t("production_statistics.orders_empty")}</div>}
          </div>
        </section> : null}
        {showReturnToPreviousButton ? <button type="button" className="production-design__return-button" onClick={handleReturnToPreviousPosition} aria-label={t("production_statistics.return_up")}><span>↑</span></button> : null}
      </> : null}
    </main>
  );
}
