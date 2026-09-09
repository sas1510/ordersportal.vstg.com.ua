import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaArrowUp, FaBoxes, FaChartLine, FaMoneyBillWave, FaSearch, FaUsers } from "react-icons/fa";
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
  { status: "В обробці", title: "В обробці", className: "is-processing" },
  { status: "Очікуємо підтвердження", title: "Очікують підтвердження", className: "is-confirmation" },
  { status: "Очікуємо оплату", title: "Очікують оплату", className: "is-payment" },
];

const DEALER_CHART_COLORS = ["#95c11f", "#6bb3d6", "#f6bf6a", "#ef9691", "#8e7cc3", "#4fb286"];
const REGION_CHART_COLORS = ["#95c11f", "#6bb3d6", "#f6bf6a", "#ef9691", "#4fb286", "#8e7cc3"];
const STATUS_CHART_COLORS = ["#4d93b6", "#8e7cc3", "#c88a2f", "#cc6e67"];
const NEUFFER_DEALER_NAME = "Neuffer Fenster + Türen GmbH";

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const dateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const ALL_MANAGERS_VALUE = "__ALL_MANAGERS__";
const ALL_REGIONS_VALUE = "__ALL_REGIONS__";
const ALL_DEALERS_VALUE = "__ALL__";
const DEALER_GROUP_VALUES = {
  dealers: "__GROUP__DEALERS",
  ourCompany: "__GROUP__OUR_COMPANY",
  export: "__GROUP__EXPORT",
};
const DEALER_GROUP_TO_SQL_VALUE = {
  [DEALER_GROUP_VALUES.dealers]: "Дилера",
  [DEALER_GROUP_VALUES.ourCompany]: 'ТОВ "Наша фірма"',
  [DEALER_GROUP_VALUES.export]: "Експорт",
};
const DEALER_GROUP_OPTIONS = [
  { value: DEALER_GROUP_VALUES.dealers, label: "Дилера" },
  { value: DEALER_GROUP_VALUES.ourCompany, label: "Наша фірма" },
  { value: DEALER_GROUP_VALUES.export, label: "Експорт" },
];
const KPI_PROCESSING_GROUPS = [
  { key: "dealers", label: "Дилери", dealerGroup: "Дилера" },
  { key: "export", label: "Експорт", dealerGroup: "Експорт" },
];

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

function normalizeOrderCurrency(value) {
  const currency = String(value || "грн").trim();
  return currency || "грн";
}

function formatCurrencyAmount(value, currency) {
  return `${formatNumber(value)} ${normalizeOrderCurrency(currency)}`;
}

function buildCurrencyTotals(orders) {
  const totals = new Map();
  (Array.isArray(orders) ? orders : []).forEach(function (order) {
    if (order.status === "Відмова") return;
    const currency = normalizeOrderCurrency(order.currency);
    const key = currency.toLocaleLowerCase("uk-UA");
    const current = totals.get(key) || { currency, amount: 0 };
    current.amount += Number(order.amount || 0);
    totals.set(key, current);
  });
  return Array.from(totals.values()).sort(function (a, b) {
    return a.currency.localeCompare(b.currency, "uk");
  });
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

function isNeufferDealer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .includes("neuffer fenster");
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getCalculationProcessingHours(calculation) {
  const calculationDate = toDate(calculation.dateRaw);
  const firstOrderDate = (Array.isArray(calculation.orders) ? calculation.orders : [])
    .map(function (order) { return toDate(order.createDate || order.dateRaw); })
    .filter(Boolean)
    .sort(function (first, second) { return first - second; })[0];

  if (!calculationDate || !firstOrderDate || firstOrderDate < calculationDate) {
    return null;
  }

  return (firstOrderDate.getTime() - calculationDate.getTime()) / 3600000;
}

function getOrderProcessingHours(calculation, order) {
  const calculationDate = toDate(calculation.dateRaw);
  const orderDate = toDate(order?.createDate || order?.dateRaw);
  if (!calculationDate || !orderDate || orderDate < calculationDate) {
    return null;
  }
  return (orderDate.getTime() - calculationDate.getTime()) / 3600000;
}

function buildDealerProcessingStats(calculations) {
  const dealerMap = new Map();
  (Array.isArray(calculations) ? calculations : []).forEach(function (calculation) {
    const dealerKey = String(calculation.dealerId || calculation.dealer || "__NO_DEALER__").toLowerCase();
    if (!dealerMap.has(dealerKey)) {
      dealerMap.set(dealerKey, {
        dealer: calculation.dealer || "Без дилера",
        processedOrders: 0,
        totalProcessingHours: 0,
      });
    }
    const dealer = dealerMap.get(dealerKey);
    (Array.isArray(calculation.orders) ? calculation.orders : []).forEach(function (order) {
      if (order.status === "Відмова") return;
      const processingHours = getOrderProcessingHours(calculation, order);
      if (processingHours === null) return;
      dealer.processedOrders += 1;
      dealer.totalProcessingHours += processingHours;
    });
  });

  return Array.from(dealerMap.values())
    .filter(function (item) { return item.processedOrders > 0; })
    .map(function (item) {
      return {
        ...item,
        averageProcessingHours: item.totalProcessingHours / item.processedOrders,
      };
    })
    .sort(function (a, b) {
      return b.averageProcessingHours - a.averageProcessingHours || a.dealer.localeCompare(b.dealer, "uk");
    });
}

function buildProcessingDetails(calculations) {
  const dealerMap = new Map();
  const candidates = [];

  (Array.isArray(calculations) ? calculations : []).forEach(function (calculation) {
    const orders = (Array.isArray(calculation.orders) ? calculation.orders : []).map(function (order) {
      const processingHours = getOrderProcessingHours(calculation, order);
      const normalized = {
        number: order.number || "Без номера",
        status: order.status || "—",
        date: order.createDate || order.dateRaw || null,
        amount: Number(order.amount || 0),
        currency: normalizeOrderCurrency(order.currency || calculation.currency),
        processingHours,
      };
      if (order.status !== "Відмова" && processingHours !== null) {
        candidates.push({
          ...normalized,
          dealer: calculation.dealer || "Без дилера",
          parentNumber: calculation.number || "Без номера",
          calculationId: calculation.id || calculation.number,
        });
      }
      return normalized;
    });

    if (!orders.length) return;
    const dealerKey = String(calculation.dealerId || calculation.dealer || "__NO_DEALER__").toLowerCase();
    if (!dealerMap.has(dealerKey)) {
      dealerMap.set(dealerKey, { dealer: calculation.dealer || "Без дилера", orders: [] });
    }
    const validDurations = orders.map(function (order) { return order.processingHours; }).filter(function (value) { return value !== null; });
    dealerMap.get(dealerKey).orders.push({
      key: calculation.id || calculation.number || dealerKey + "-" + dealerMap.get(dealerKey).orders.length,
      parentNumber: calculation.number || "Без номера",
      calculationDate: calculation.dateRaw,
      averageProcessingHours: validDurations.length
        ? validDurations.reduce(function (sum, value) { return sum + value; }, 0) / validDurations.length
        : null,
      suborders: orders,
    });
  });

  candidates.sort(function (a, b) { return a.processingHours - b.processingHours; });
  const dealers = Array.from(dealerMap.values()).sort(function (a, b) {
    return a.dealer.localeCompare(b.dealer, "uk");
  });

  function enrichExtreme(candidate) {
    if (!candidate) return null;
    const dealer = dealers.find(function (item) { return item.dealer === candidate.dealer; });
    const parent = dealer?.orders.find(function (item) {
      return String(item.key) === String(candidate.calculationId) || item.parentNumber === candidate.parentNumber;
    });
    return { ...candidate, suborders: parent?.suborders || [] };
  }

  return {
    dealers,
    processedOrders: candidates.length,
    fastest: enrichExtreme(candidates[0]),
    longest: enrichExtreme(candidates[candidates.length - 1]),
  };
}

function buildManagerKpi(calculations, managerName) {
  const source = Array.isArray(calculations) ? calculations : [];
  const orders = source.flatMap(function (calculation) {
    return Array.isArray(calculation.orders) ? calculation.orders : [];
  });
  const processedOrders = source.flatMap(function (calculation) {
    return (Array.isArray(calculation.orders) ? calculation.orders : [])
      .filter(function (order) { return order.status !== "Відмова"; })
      .map(function (order) {
        const processingHours = getOrderProcessingHours(calculation, order);
        return processingHours === null ? null : {
          number: order.number || calculation.number || "Без номера",
          dealer: calculation.dealer || "Без дилера",
          processingHours,
        };
      })
      .filter(Boolean);
  }).sort(function (a, b) { return a.processingHours - b.processingHours; });
  const processedHours = source
    .map(getCalculationProcessingHours)
    .filter(function (value) { return value !== null; });
  const backlog = source.filter(function (calculation) {
    const ordersInCalculation = Array.isArray(calculation.orders) ? calculation.orders : [];
    return !ordersInCalculation.length || ordersInCalculation.some(function (order) {
      return order.status === "Очікуємо підтвердження";
    });
  }).length;
  const newCount = source.filter(function (calculation) {
    const ordersInCalculation = Array.isArray(calculation.orders) ? calculation.orders : [];
    return !ordersInCalculation.length || ordersInCalculation.some(function (order) {
      return order.status === "Новий";
    });
  }).length;
  const turnoverByCurrency = buildCurrencyTotals(orders);

  return {
    name: managerName || "Без менеджера",
    calculations: source.length,
    orders: orders.length,
    turnover: orders.reduce(function (sum, order) {
      return sum + (order.status === "Відмова" ? 0 : Number(order.amount || 0));
    }, 0),
    turnoverByCurrency,
    averageProcessingHours: processedHours.length
      ? processedHours.reduce(function (sum, value) { return sum + value; }, 0) / processedHours.length
      : null,
    processedCount: processedHours.length,
    backlog,
    newCount,
    fastestOrder: processedOrders[0] || null,
    longestOrder: processedOrders[processedOrders.length - 1] || null,
  };
}

function groupCalculationsByStatus(calculations) {
  const result = Object.fromEntries(STATUSES.map(function (item) {
    return [item.status, []];
  }));

  (Array.isArray(calculations) ? calculations : []).forEach(function (calculation) {
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
}

function formatHours(value) {
  if (value === null || value === undefined) return "—";
  const totalMinutes = Math.max(0, Math.round(Number(value) * 60));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) parts.push(days + " дн.");
  if (hours || days) parts.push(hours + " год.");
  parts.push(minutes + " хв.");

  return parts.join(" ");
}

function truncateChartLabel(value, maxLength = 20) {
  const label = String(value || "");
  return label.length > maxLength ? label.slice(0, maxLength - 1) + "…" : label;
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
  const processingDetailsRef = useRef(null);
  const {
    dealerGuid,
    setDealerGuid,
    isAdmin,
    isSuperAdmin,
    role,
    isLoading: dealerContextLoading,
  } = useDealerContext();

  const [viewMode, setViewMode] = useState("statuses");
  const [dateFrom, setDateFrom] = useState(currentMonthStart);
  const [dateTo, setDateTo] = useState(dateInput(new Date()));

  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingGroupCalculations, setProcessingGroupCalculations] = useState({});
  const [processingGroupsLoading, setProcessingGroupsLoading] = useState(false);
  const [processingGroupsError, setProcessingGroupsError] = useState("");

  const [dealerReportsData, setDealerReportsData] = useState(null);
  const [dealerReportsLoading, setDealerReportsLoading] = useState(false);
  const [dealerReportsError, setDealerReportsError] = useState("");
  const [dealerReportScopeUserId, setDealerReportScopeUserId] = useState("");
  const [statusScopeUserId, setStatusScopeUserId] = useState("");
  const [kpiScopeUserId, setKpiScopeUserId] = useState("");
  const [activeManagerOptions, setActiveManagerOptions] = useState([]);
  const [selectedManagerGuid, setSelectedManagerGuid] = useState(ALL_MANAGERS_VALUE);
  const [selectedRegionName, setSelectedRegionName] = useState(ALL_REGIONS_VALUE);
  const [activeStatus, setActiveStatus] = useState(STATUSES[0].status);
  const [activeStatusGroup, setActiveStatusGroup] = useState(KPI_PROCESSING_GROUPS[0].key);
  const [processingDetailsScope, setProcessingDetailsScope] = useState(null);
  const [processingDetailsOpen, setProcessingDetailsOpen] = useState(false);
  const canUseDealerGroups =
    role === "admin" || role === "director";
  const appliedDealerGroup = useMemo(
    function () {
      return canUseDealerGroups
        ? DEALER_GROUP_TO_SQL_VALUE[dealerGuid] || undefined
        : undefined;
    },
    [canUseDealerGroups, dealerGuid],
  );

  const loadStatusReport = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError("Вкажіть коректний період звітності.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          ...((viewMode === "kpi" ? kpiScopeUserId : viewMode === "statuses" ? statusScopeUserId : "")
            ? { scope_user_id: viewMode === "kpi" ? kpiScopeUserId : statusScopeUserId }
            : {}),
          ...(appliedDealerGroup
            ? { dealer_group: appliedDealerGroup }
            : {}),
        },
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
  }, [appliedDealerGroup, dateFrom, dateTo, kpiScopeUserId, statusScopeUserId, viewMode]);

  const loadProcessingGroupsReport = useCallback(async () => {
    if (!canUseDealerGroups || !dateFrom || !dateTo || dateFrom > dateTo) {
      return;
    }

    setProcessingGroupsLoading(true);
    setProcessingGroupsError("");
    try {
      const responses = await Promise.all(
        KPI_PROCESSING_GROUPS.map(function (group) {
          return axiosInstance.get("/order/get_orders_info_all/", {
            params: {
              date_from: dateFrom,
              date_to: dateTo,
              dealer_group: group.dealerGroup,
              ...((viewMode === "statuses" ? statusScopeUserId : kpiScopeUserId)
                ? { scope_user_id: viewMode === "statuses" ? statusScopeUserId : kpiScopeUserId }
                : {}),
            },
          });
        }),
      );
      setProcessingGroupCalculations(
        Object.fromEntries(
          KPI_PROCESSING_GROUPS.map(function (group, index) {
            return [group.key, responses[index]?.data?.data?.calculation || []];
          }),
        ),
      );
    } catch (requestError) {
      setProcessingGroupCalculations({});
      setProcessingGroupsError("Не вдалося завантажити показники за групами.");
    } finally {
      setProcessingGroupsLoading(false);
    }
  }, [canUseDealerGroups, dateFrom, dateTo, kpiScopeUserId, statusScopeUserId, viewMode]);

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
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          ...(dealerReportScopeUserId ? { scope_user_id: dealerReportScopeUserId } : {}),
        },
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
  }, [dateFrom, dateTo, dealerContextLoading, dealerReportScopeUserId, isAdmin]);

  const loadActiveManagerOptions = useCallback(async () => {
    if (!isSuperAdmin) {
      setActiveManagerOptions([]);
      return;
    }
    try {
      const response = await axiosInstance.get("/managers/");
      setActiveManagerOptions(response.data?.managers || []);
    } catch {
      setActiveManagerOptions([]);
    }
  }, [isSuperAdmin]);


  useEffect(function () {
    if (viewMode === "kpi") {
      loadStatusReport();
      loadProcessingGroupsReport();
    } else if (viewMode === "statuses") {
      loadStatusReport();
      if (canUseDealerGroups) {
        loadProcessingGroupsReport();
      }
    }
  }, [canUseDealerGroups, kpiScopeUserId, loadProcessingGroupsReport, loadStatusReport, statusScopeUserId, viewMode]);

  useEffect(function () {
    loadActiveManagerOptions();
  }, [loadActiveManagerOptions]);


  const visibleCalculations = useMemo(() => {
    if (
      !dealerGuid ||
      dealerGuid === ALL_DEALERS_VALUE ||
      Object.hasOwn(DEALER_GROUP_TO_SQL_VALUE, dealerGuid)
    ) {
      return calculations;
    }

    return calculations.filter(function (calculation) {
      return String(calculation.dealerId || "").toLowerCase() === String(dealerGuid).toLowerCase();
    });
  }, [calculations, dealerGuid]);

  const selectedManagerKpi = useMemo(function () {
    const selectedPerson = activeManagerOptions.find(function (item) {
      return String(item.id) === String(kpiScopeUserId);
    });
    return buildManagerKpi(
      visibleCalculations,
      selectedPerson
        ? (selectedPerson.full_name || selectedPerson.username)
        : isSuperAdmin ? "Всі менеджери" : "Мій портфель",
    );
  }, [activeManagerOptions, isSuperAdmin, kpiScopeUserId, visibleCalculations]);

  const processingGroupKpis = useMemo(function () {
    return KPI_PROCESSING_GROUPS.map(function (group) {
      const kpi = buildManagerKpi(processingGroupCalculations[group.key], group.label);
      return {
        ...kpi,
        key: group.key,
        name: group.label,
        averageProcessingHours: kpi.averageProcessingHours || 0,
      };
    });
  }, [processingGroupCalculations]);

  const selectedProcessingGroupKey = useMemo(function () {
    const selectedGroup = KPI_PROCESSING_GROUPS.find(function (group) {
      return group.dealerGroup === appliedDealerGroup;
    });
    return selectedGroup?.key || null;
  }, [appliedDealerGroup]);

  const visibleProcessingGroupKpis = useMemo(function () {
    return selectedProcessingGroupKey
      ? processingGroupKpis.filter(function (group) { return group.key === selectedProcessingGroupKey; })
      : processingGroupKpis;
  }, [processingGroupKpis, selectedProcessingGroupKey]);

  const turnoverCurrencySeries = useMemo(function () {
    return Array.from(new Set(visibleProcessingGroupKpis.flatMap(function (group) {
      return group.turnoverByCurrency.map(function (item) { return item.currency; });
    }))).map(function (currency, index) {
      return { currency, dataKey: `currency_${index}` };
    });
  }, [visibleProcessingGroupKpis]);

  const currencyTurnoverChartData = useMemo(function () {
    return visibleProcessingGroupKpis.map(function (group) {
      return turnoverCurrencySeries.reduce(function (row, series) {
        const total = group.turnoverByCurrency.find(function (item) { return item.currency === series.currency; });
        row[series.dataKey] = total?.amount || 0;
        return row;
      }, { name: group.name });
    });
  }, [turnoverCurrencySeries, visibleProcessingGroupKpis]);

  useEffect(function () {
    setProcessingDetailsOpen(false);
    setProcessingDetailsScope(selectedProcessingGroupKey);
    if (selectedProcessingGroupKey) {
      setActiveStatusGroup(selectedProcessingGroupKey);
    }
  }, [dealerGuid, selectedProcessingGroupKey]);

  const hasSelectedKpiDealer = Boolean(
    dealerGuid &&
    dealerGuid !== ALL_DEALERS_VALUE &&
    !Object.hasOwn(DEALER_GROUP_TO_SQL_VALUE, dealerGuid),
  );
  const showGroupedKpi = canUseDealerGroups && !hasSelectedKpiDealer && (!appliedDealerGroup || Boolean(selectedProcessingGroupKey));
  const selectedKpiDealerName = hasSelectedKpiDealer
    ? visibleCalculations[0]?.dealer || "Обраний дилер"
    : null;
  const dealerProcessingStats = useMemo(function () {
    return buildDealerProcessingStats(visibleCalculations);
  }, [visibleCalculations]);
  const dealerProcessingChartData = useMemo(function () {
    return dealerProcessingStats.slice(0, 10);
  }, [dealerProcessingStats]);
  const dealerProcessingChartHeight = Math.max(320, dealerProcessingChartData.length * 34 + 72);
  const effectiveProcessingDetailsScope = processingDetailsScope || (showGroupedKpi ? visibleProcessingGroupKpis[0]?.key : "selection");
  const processingDetailsConfig = useMemo(function () {
    const group = KPI_PROCESSING_GROUPS.find(function (item) { return item.key === effectiveProcessingDetailsScope; });
    const source = group ? processingGroupCalculations[group.key] : visibleCalculations;
    return {
      title: group ? group.label : selectedKpiDealerName || selectedManagerKpi.name,
      details: buildProcessingDetails(source),
    };
  }, [effectiveProcessingDetailsScope, processingGroupCalculations, selectedKpiDealerName, selectedManagerKpi.name, visibleCalculations]);

  const openProcessingDetails = useCallback(function (scope) {
    setProcessingDetailsScope(scope);
    setProcessingDetailsOpen(true);
    window.requestAnimationFrame(function () {
      const details = processingDetailsRef.current;
      if (!details) return;
      details.open = true;
      window.requestAnimationFrame(function () {
        details.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, []);

  useEffect(function () {
    if (!processingDetailsOpen) return;
    const frameId = window.requestAnimationFrame(function () {
      processingDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return function () {
      window.cancelAnimationFrame(frameId);
    };
  }, [processingDetailsConfig, processingDetailsOpen]);

  useEffect(
    function () {
      if (
        !canUseDealerGroups &&
        Object.hasOwn(DEALER_GROUP_TO_SQL_VALUE, dealerGuid)
      ) {
        setDealerGuid(ALL_DEALERS_VALUE);
      }
    },
    [canUseDealerGroups, dealerGuid, setDealerGuid],
  );
  const grouped = useMemo(function () {
    return groupCalculationsByStatus(visibleCalculations);
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

  const showGroupedStatuses = canUseDealerGroups && !hasSelectedKpiDealer && (!appliedDealerGroup || Boolean(selectedProcessingGroupKey));
  const statusGroupPanels = useMemo(function () {
    if (!showGroupedStatuses) {
      return [{ key: "all", label: selectedKpiDealerName || "Статуси замовлень", grouped, chartData: statusChartData }];
    }
    return KPI_PROCESSING_GROUPS.filter(function (group) {
      return !selectedProcessingGroupKey || group.key === selectedProcessingGroupKey;
    }).map(function (group) {
      const groupStatuses = groupCalculationsByStatus(processingGroupCalculations[group.key]);
      return {
        key: group.key,
        label: group.label,
        grouped: groupStatuses,
        chartData: STATUSES.map(function (item, index) {
          return { ...item, value: groupStatuses[item.status].length, fill: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length] };
        }),
      };
    });
  }, [grouped, processingGroupCalculations, selectedKpiDealerName, selectedProcessingGroupKey, showGroupedStatuses, statusChartData]);

  const activeStatusMeta = useMemo(function () {
    return STATUSES.find(function (item) {
      return item.status === activeStatus;
    }) || STATUSES[0];
  }, [activeStatus]);

  const activeStatusPanel = statusGroupPanels.find(function (panel) {
    return panel.key === activeStatusGroup;
  }) || statusGroupPanels[0];
  const activeStatusOrders = activeStatusPanel?.grouped?.[activeStatusMeta.status] || [];

  const dealerTotals = dealerReportsData?.totals || {};
  const dealers = dealerReportsData?.dealers || [];
  const topDealers = dealerReportsData?.top_dealers || [];
  const regions = dealerReportsData?.regions || [];
  const dealerInsights = dealerReportsData?.insights || {};

  const managerOptions = useMemo(function () {
    if (!isSuperAdmin) {
      return [];
    }

    return activeManagerOptions
      .filter(function (item) { return Boolean(item.guid); })
      .map(function (item) {
        return {
          guid: String(item.guid).toLowerCase(),
          name: item.full_name || item.username,
          role: item.role,
        };
      });
  }, [activeManagerOptions, isSuperAdmin]);

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

  const neufferDealer = useMemo(function () {
    return activeDealers.find(function (item) {
      return isNeufferDealer(item.dealer_name);
    }) || null;
  }, [activeDealers]);

  const activeDealerTotals = useMemo(function () {
    if ((!isSuperAdmin || selectedManagerGuid === ALL_MANAGERS_VALUE) && selectedRegionName === ALL_REGIONS_VALUE) {
      return dealerTotals;
    }

    return buildDealerTotals(activeDealers);
  }, [activeDealers, dealerTotals, isSuperAdmin, selectedManagerGuid, selectedRegionName]);

  const activeTopDealers = useMemo(function () {
    const source = (isSuperAdmin && selectedManagerGuid !== ALL_MANAGERS_VALUE) || selectedRegionName !== ALL_REGIONS_VALUE ? activeDealers : topDealers;
    return [...source]
      .filter(function (item) { return !isNeufferDealer(item.dealer_name); })
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
  const dashboardTotal = viewMode === "dealers"
    ? Number(activeDealerTotals.dealers_count || 0)
    : viewMode === "kpi"
      ? selectedManagerKpi.calculations
      : statusTotal;
  const dashboardTotalLabel = viewMode === "dealers"
    ? "Дилерів у звіті"
    : viewMode === "kpi"
      ? "Заявок у KPI"
      : "Потребують уваги";

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
    <main className={"orders-dashboard orders-dashboard--reports-mixed" + (viewMode === "kpi" ? " orders-dashboard--analytics" : "")}>
      <section className="orders-dashboard__panel">
        <div className="orders-dashboard__header">
          <div>
            <h1>Звіти за замовленнями</h1>
            <p>
              {viewMode === "dealers"
                ? ""
                : viewMode === "kpi"
                  ? ""
                  : ""}
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
            <button type="button" className={viewMode === "kpi" ? "is-active" : ""} onClick={function () { setViewMode("kpi"); }}>
              KPI
            </button>
          </div>

          {viewMode !== "dealers" && isAdmin ? (
            <label>
              Дилер
              <DealerSelectWithAll
                value={dealerGuid || ALL_DEALERS_VALUE}
                onChange={setDealerGuid}
                extraOptions={
                  canUseDealerGroups
                    ? DEALER_GROUP_OPTIONS
                    : []
                }
              />
            </label>
          ) : null}

          {viewMode === "dealers" && isSuperAdmin ? (
            <label>
              Менеджер / регіональний менеджер
              <select value={dealerReportScopeUserId} onChange={function (event) { setDealerReportScopeUserId(event.target.value); }}>
                <option value="">Всі менеджери</option>
                {activeManagerOptions.map(function (item) {
                  return <option key={item.id} value={item.id}>{item.full_name || item.username} ({item.role === "region_manager" ? "регіональний" : "менеджер"})</option>;
                })}
              </select>
            </label>
          ) : null}

          {viewMode === "statuses" && isSuperAdmin ? (
            <label>
              Менеджер / регіональний менеджер
              <select value={statusScopeUserId} onChange={function (event) { setStatusScopeUserId(event.target.value); }}>
                <option value="">Всі менеджери</option>
                {activeManagerOptions.map(function (item) {
                  return <option key={item.id} value={item.id}>{item.full_name || item.username} ({item.role === "region_manager" ? "регіональний" : "менеджер"})</option>;
                })}
              </select>
            </label>
          ) : null}

          {viewMode === "kpi" && isSuperAdmin ? (
            <label>
              Менеджер / регіональний менеджер
              <select value={kpiScopeUserId} onChange={function (event) { setKpiScopeUserId(event.target.value); }}>
                <option value="">Всі менеджери</option>
                {activeManagerOptions.map(function (item) {
                  return <option key={item.id} value={item.id}>{item.full_name || item.username} ({item.role === "region_manager" ? "регіональний" : "менеджер"})</option>;
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

          <button
            type="button"
            onClick={function () {
              if (viewMode === "dealers") {
                loadDealerReports();
                return;
              }
              loadStatusReport();
              if (viewMode === "kpi" || (viewMode === "statuses" && canUseDealerGroups)) {
                loadProcessingGroupsReport();
              }
            }}
            disabled={viewMode === "dealers" ? dealerReportsLoading : loading}
          >
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
              {statusGroupPanels.map(function (panel) {
                const panelLoading = showGroupedStatuses ? processingGroupsLoading : loading;
                return (
                  <article key={panel.key} className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header">
                      <h3>{panel.label} · статуси замовлень</h3>
                      <span>Натисніть на сектор для деталізації</span>
                    </div>
                    <div className="orders-dashboard__chart-wrap">
                      {panel.chartData.some(function (item) { return item.value > 0; }) ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <PieChart>
                            <Pie
                              data={panel.chartData}
                              dataKey="value"
                              nameKey="title"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              innerRadius={56}
                              paddingAngle={2}
                              activeIndex={activeStatusPanel?.key === panel.key ? STATUSES.findIndex(function (item) { return item.status === activeStatus; }) : undefined}
                              onClick={function (entry) {
                                if (entry?.status) {
                                  setActiveStatusGroup(panel.key);
                                  setActiveStatus(entry.status);
                                }
                              }}
                              cursor="pointer"
                            >
                              {panel.chartData.map(function (entry, index) {
                                return <Cell key={entry.status} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />;
                              })}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <div className="orders-dashboard__chart-empty">Немає даних для побудови діаграми.</div>}
                    </div>
                    <div className="orders-dashboard__chart-legend orders-dashboard__chart-legend--buttons">
                      {panel.chartData.map(function (item, index) {
                        return (
                          <button
                            type="button"
                            key={item.status}
                            className={"orders-dashboard__legend-item orders-dashboard__legend-button" + (activeStatusPanel?.key === panel.key && activeStatus === item.status ? " is-active" : "")}
                            onClick={function () { setActiveStatusGroup(panel.key); setActiveStatus(item.status); }}
                          >
                            <span className="orders-dashboard__legend-dot" style={{ backgroundColor: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length] }}></span>
                            <span>{item.title}</span>
                            <strong>{panelLoading ? "?" : item.value}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </section>

              <section className="orders-dashboard__details orders-dashboard__details--single">
                <h2>{activeStatusPanel?.label} · {activeStatusMeta.title} ({showGroupedStatuses ? processingGroupsLoading ? "?" : activeStatusOrders.length : loading ? "?" : activeStatusOrders.length})</h2>
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
                      {(showGroupedStatuses ? processingGroupsLoading : loading) ? (
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
          </>
        ) : viewMode === "kpi" ? (
          <>
            <section className="orders-dashboard__kpi-cards">
              {showGroupedKpi ? visibleProcessingGroupKpis.map(function (group) {
                const isLoading = processingGroupsLoading;
                return (
                  <Fragment key={group.name}>
                    <article className={"orders-dashboard__kpi-card is-processing is-clickable" + (processingDetailsScope === group.key ? " is-details-open" : "")} role="button" tabIndex={0} aria-expanded={processingDetailsScope === group.key} onClick={function () { openProcessingDetails(group.key); }} onKeyDown={function (event) { if (event.key === "Enter" || event.key === " ") openProcessingDetails(group.key); }}>
                      <span className="orders-dashboard__kpi-label">{group.name} · середній час обробки</span>
                      <strong className="orders-dashboard__kpi-value">{isLoading || !group.processedCount ? "—" : formatHours(group.averageProcessingHours)}</strong>
                      <span className="orders-dashboard__kpi-hint">За {formatNumber(group.processedCount)} заявками із замовленням</span>
                      <button type="button" className="orders-dashboard__details-trigger" onClick={function (event) { event.stopPropagation(); openProcessingDetails(group.key); }}>Детальніше</button>
                    </article>
                    <article className="orders-dashboard__kpi-card is-backlog">
                      <span className="orders-dashboard__kpi-label">{group.name} · нові заявки</span>
                      <strong className="orders-dashboard__kpi-value">{isLoading ? "—" : formatNumber(group.newCount)}</strong>
                      <span className="orders-dashboard__kpi-hint">Статус «Новий»</span>
                    </article>
                    <article className="orders-dashboard__kpi-card is-processing">
                      <span className="orders-dashboard__kpi-label">{group.name} · сума замовлень</span>
                      <div className="orders-dashboard__kpi-value orders-dashboard__currency-values">
                        {isLoading ? <strong>—</strong> : group.turnoverByCurrency.length ? group.turnoverByCurrency.map(function (item) {
                          return <strong key={item.currency}>{formatCurrencyAmount(item.amount, item.currency)}</strong>;
                        }) : <strong>—</strong>}
                      </div>
                      <span className="orders-dashboard__kpi-hint">За {formatNumber(group.orders)} замовленнями</span>
                    </article>
                  </Fragment>
                );
              }) : (
                <>
                  <article className={"orders-dashboard__kpi-card is-processing is-clickable" + (processingDetailsScope === "selection" ? " is-details-open" : "")} role="button" tabIndex={0} aria-expanded={processingDetailsScope === "selection"} onClick={function () { openProcessingDetails("selection"); }} onKeyDown={function (event) { if (event.key === "Enter" || event.key === " ") openProcessingDetails("selection"); }}>
                    <span className="orders-dashboard__kpi-label">{selectedKpiDealerName ? selectedKpiDealerName + " · середній час обробки" : "Середній час обробки"}</span>
                    <strong className="orders-dashboard__kpi-value">{formatHours(selectedManagerKpi.averageProcessingHours)}</strong>
                    <span className="orders-dashboard__kpi-hint">За {formatNumber(selectedManagerKpi.processedCount)} заявками із замовленням</span>
                    <button type="button" className="orders-dashboard__details-trigger" onClick={function (event) { event.stopPropagation(); openProcessingDetails("selection"); }}>Детальніше</button>
                  </article>
                  <article className="orders-dashboard__kpi-card is-backlog">
                    <span className="orders-dashboard__kpi-label">{selectedKpiDealerName ? selectedKpiDealerName + " · нові заявки" : "Нові заявки"}</span>
                    <strong className="orders-dashboard__kpi-value">{formatNumber(selectedManagerKpi.newCount)}</strong>
                    <span className="orders-dashboard__kpi-hint">Статус «Новий»</span>
                  </article>
                  <article className="orders-dashboard__kpi-card is-processing">
                    <span className="orders-dashboard__kpi-label">{selectedKpiDealerName ? selectedKpiDealerName + " · сума замовлень" : "Сума замовлень"}</span>
                    <div className="orders-dashboard__kpi-value orders-dashboard__currency-values">
                      {selectedManagerKpi.turnoverByCurrency.length ? selectedManagerKpi.turnoverByCurrency.map(function (item) {
                        return <strong key={item.currency}>{formatCurrencyAmount(item.amount, item.currency)}</strong>;
                      }) : <strong>—</strong>}
                    </div>
                    <span className="orders-dashboard__kpi-hint">За {formatNumber(selectedManagerKpi.orders)} замовленнями</span>
                  </article>
                </>
              )}
            </section>
            {processingDetailsConfig ? (
              <div className="orders-dashboard__processing-inline">
              <details
                ref={processingDetailsRef}
                className="orders-dashboard__processing-details"
                open={processingDetailsOpen}
                onToggle={function (event) { setProcessingDetailsOpen(event.currentTarget.open); }}
              >
                <summary className="orders-dashboard__processing-details-toggle">
                  <span>Деталізація часу оформлення</span>
                  <strong>{processingDetailsOpen ? "Згорнути" : "Відкрити"}</strong>
                </summary>
                <div className="orders-dashboard__processing-details-head">
                  <div>
                    <span>Деталізація часу оформлення</span>
                    <h2>{processingDetailsConfig.title}</h2>
                  </div>
                  <button type="button" onClick={function () {
                    setProcessingDetailsOpen(false);
                    setProcessingDetailsScope(null);
                    if (processingDetailsRef.current) processingDetailsRef.current.open = false;
                  }}>Закрити</button>
                </div>

                <div className="orders-dashboard__processing-extremes">
                  {[{ key: "fastest", title: "Найшвидше оформлене замовлення", className: "is-fastest" }, { key: "longest", title: "Найдовше оформлене замовлення", className: "is-longest" }].map(function (meta) {
                    const item = processingDetailsConfig.details[meta.key];
                    return (
                      <article key={meta.key} className={"orders-dashboard__processing-extreme " + meta.className}>
                        <span>{meta.title}</span>
                        <strong>{item ? formatHours(item.processingHours) : "—"}</strong>
                        <p>{item ? item.parentNumber + " · " + item.dealer : "Немає оформлених замовлень"}</p>
                        {item?.suborders?.length ? <div className="orders-dashboard__suborder-chips"><b>Підзамовлення:</b>{item.suborders.map(function (suborder, index) { return <em key={suborder.number + index}>{suborder.number}</em>; })}</div> : null}
                      </article>
                    );
                  })}
                </div>

                <div className="orders-dashboard__processing-details-summary">Оброблено замовлень: <strong>{formatNumber(processingDetailsConfig.details.processedOrders)}</strong></div>
                <div className="orders-dashboard__dealer-order-groups">
                  {processingDetailsConfig.details.dealers.length ? processingDetailsConfig.details.dealers.map(function (dealer, dealerIndex) {
                    const dealerSubordersCount = dealer.orders.reduce(function (sum, order) { return sum + order.suborders.length; }, 0);
                    return (
                      <details key={dealer.dealer} className="orders-dashboard__dealer-order-group" open={dealerIndex === 0}>
                        <summary><span>{dealer.dealer}</span><strong>{formatNumber(dealerSubordersCount)} замовлень</strong></summary>
                        <div className="orders-dashboard__parent-orders">
                          {dealer.orders.map(function (parent) {
                            return (
                              <article key={parent.key} className="orders-dashboard__parent-order">
                                <header>
                                  <div><span>Основна заявка / номер</span><strong>{parent.parentNumber}</strong></div>
                                  <div><span>Середній час</span><strong>{formatHours(parent.averageProcessingHours)}</strong></div>
                                </header>
                                <div className="orders-dashboard__table-wrap">
                                  <table>
                                    <thead><tr><th>Підзамовлення</th><th>Статус</th><th>Створено</th><th>Час оформлення</th><th>Сума</th></tr></thead>
                                    <tbody>{parent.suborders.map(function (suborder, index) {
                                      return <tr key={suborder.number + index}><td><strong>{suborder.number}</strong></td><td>{suborder.status}</td><td>{suborder.date ? new Date(suborder.date).toLocaleString("uk-UA") : "—"}</td><td>{formatHours(suborder.processingHours)}</td><td>{formatCurrencyAmount(suborder.amount, suborder.currency)}</td></tr>;
                                    })}</tbody>
                                  </table>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </details>
                    );
                  }) : <div className="orders-dashboard__chart-empty">Немає замовлень для деталізації.</div>}
                </div>
              </details>
              </div>
            ) : null}
            {showGroupedKpi ? (
              <>
                {processingGroupsError ? <p className="orders-dashboard__error">{processingGroupsError}</p> : null}
                <section className="orders-dashboard__charts-grid orders-dashboard__charts-grid--kpi">
                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header"><h3>Середній час обробки</h3></div>
                    <div className="orders-dashboard__chart-wrap">
                      {processingGroupsLoading ? <div className="orders-dashboard__chart-empty">Завантаження даних…</div> : visibleProcessingGroupKpis.some(function (item) { return item.processedCount > 0; }) ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={visibleProcessingGroupKpis} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} />
                            <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} tickFormatter={formatHours} />
                            <Tooltip formatter={function (value) { return [formatHours(value), "Середній час"]; }} />
                            <Bar dataKey="averageProcessingHours" name="Середній час" fill="#6bb3d6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <div className="orders-dashboard__chart-empty">Немає завершених заявок для розрахунку.</div>}
                    </div>
                  </article>
                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header"><h3>Нові заявки</h3></div>
                    <div className="orders-dashboard__chart-wrap">
                      {processingGroupsLoading ? <div className="orders-dashboard__chart-empty">Завантаження даних…</div> : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={visibleProcessingGroupKpis} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} />
                            <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="newCount" name="Нові заявки" fill="#f6bf6a" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </article>
                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header"><h3>Сума замовлень</h3><span>{visibleProcessingGroupKpis.map(function (item) { return item.name; }).join(" / ")}</span></div>
                    <div className="orders-dashboard__chart-wrap">
                      {processingGroupsLoading ? <div className="orders-dashboard__chart-empty">Завантаження даних…</div> : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={currencyTurnoverChartData} margin={{ top: 20, right: 20, left: 8, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} />
                            <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} tickFormatter={function (value) { return formatNumber(value); }} />
                            <Tooltip formatter={function (value, currency) { return [formatCurrencyAmount(value, currency), currency]; }} />
                            {turnoverCurrencySeries.map(function (series, index) {
                              return <Bar key={series.dataKey} dataKey={series.dataKey} name={series.currency} fill={DEALER_CHART_COLORS[index % DEALER_CHART_COLORS.length]} radius={[6, 6, 0, 0]} />;
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </article>
                  <article className="dealer-reports-panel orders-dashboard__chart-panel">
                    <div className="dealer-reports-panel__header"><h3>Заявки та замовлення</h3><span>Порівняння обсягу</span></div>
                    <div className="orders-dashboard__chart-wrap">
                      {processingGroupsLoading ? <div className="orders-dashboard__chart-empty">Завантаження даних…</div> : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={visibleProcessingGroupKpis} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} />
                            <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="calculations" name="Заявки" fill="#6bb3d6" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="orders" name="Замовлення" fill="#8e7cc3" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </article>
                </section>
              </>
            ) : (
              <section className="orders-dashboard__charts-grid orders-dashboard__charts-grid--kpi">
                <article className="dealer-reports-panel orders-dashboard__chart-panel">
                  <div className="dealer-reports-panel__header"><h3>{selectedKpiDealerName || selectedManagerKpi.name} · обсяг</h3><span>Заявки та замовлення</span></div>
                  <div className="orders-dashboard__chart-wrap">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={[selectedManagerKpi]} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} />
                        <YAxis stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="calculations" name="Заявки" fill="#6bb3d6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="orders" name="Замовлення" fill="#8e7cc3" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="newCount" name="Нові" fill="#f6bf6a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
                <article className="dealer-reports-panel orders-dashboard__chart-panel">
                  <div className="dealer-reports-panel__header"><h3>Розподіл за статусами</h3><span>{selectedKpiDealerName || selectedManagerKpi.name}</span></div>
                  <div className="orders-dashboard__chart-wrap">
                    {statusChartData.some(function (item) { return item.value > 0; }) ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie data={statusChartData} dataKey="value" nameKey="title" cx="50%" cy="50%" outerRadius={112} innerRadius={58} paddingAngle={3}>
                            {statusChartData.map(function (entry, index) {
                              return <Cell key={entry.status} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />;
                            })}
                          </Pie>
                          <Tooltip content={<CustomChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="orders-dashboard__chart-empty">Немає даних для побудови діаграми.</div>}
                  </div>
                  <div className="orders-dashboard__chart-legend">
                    {statusChartData.map(function (item, index) {
                      return <div key={item.status} className="orders-dashboard__legend-item"><span className="orders-dashboard__legend-dot" style={{ backgroundColor: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length] }}></span><span>{item.title}</span><strong>{item.value}</strong></div>;
                    })}
                  </div>
                </article>
              </section>
            )}
            <section className="orders-dashboard__charts-grid orders-dashboard__charts-grid--kpi orders-dashboard__dealer-processing">
              <article className="dealer-reports-panel orders-dashboard__chart-panel">
                <div className="dealer-reports-panel__header"><h3>Середній час одного замовлення</h3><span>{selectedManagerKpi.name} · за спаданням</span></div>
                <div className="orders-dashboard__chart-wrap" style={{ height: dealerProcessingChartHeight }}>
                  {dealerProcessingChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dealerProcessingChartData} layout="vertical" margin={{ top: 12, right: 26, left: 12, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis type="number" stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 12 }} tickFormatter={formatHours} />
                        <YAxis type="category" dataKey="dealer" width={155} interval={0} stroke="#d0d7d1" tick={{ fill: "#d0d7d1", fontSize: 11 }} tickFormatter={function (value) { return truncateChartLabel(value); }} />
                        <Tooltip formatter={function (value) { return [formatHours(value), "Середній час"]; }} labelFormatter={function (value) { return value; }} />
                        <Bar dataKey="averageProcessingHours" name="Середній час" fill="#4fb286" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="orders-dashboard__chart-empty">Немає оброблених замовлень за вибраний період.</div>}
                </div>
              </article>
              <article className="dealer-reports-panel orders-dashboard__processing-table-panel">
                <div className="dealer-reports-panel__header"><h3>Оброблені замовлення по дилерах</h3><span>{selectedManagerKpi.name}</span></div>
                <div className="orders-dashboard__table-wrap">
                  <table>
                    <thead><tr><th>Дилер</th><th>Оброблено замовлень</th><th>Середній час 1 замовлення</th></tr></thead>
                    <tbody>
                      {dealerProcessingStats.length ? dealerProcessingStats.map(function (item) {
                        return <tr key={item.dealer}><td>{item.dealer}</td><td>{formatNumber(item.processedOrders)}</td><td>{formatHours(item.averageProcessingHours)}</td></tr>;
                      }) : <tr><td colSpan="3">Немає оброблених замовлень за вибраний період.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          </>
        ) : (
          <>
            {dealerReportsError ? <div className="dealer-reports-state is-error">{dealerReportsError}</div> : null}
            {!dealerReportsError && dealerReportsLoading ? <div className="dealer-reports-state">Формуємо звіт по дилерах…</div> : null}

            {!dealerReportsError && !dealerReportsLoading ? (
              <>
                {neufferDealer ? (
                  <section className="dealer-reports-cards orders-dashboard__dealer-cards">
                    <article className="dealer-reports-card">
                      <div className="dealer-reports-card__icon"><FaUsers /></div>
                      <div className="dealer-reports-card__label">Окремий дилер</div>
                      <div className="dealer-reports-card__value">{NEUFFER_DEALER_NAME}</div>
                    </article>
                    <article className="dealer-reports-card">
                      <div className="dealer-reports-card__icon"><FaChartLine /></div>
                      <div className="dealer-reports-card__label">Замовлення</div>
                      <div className="dealer-reports-card__value">{formatNumber(neufferDealer.orders_count)}</div>
                    </article>
                    <article className="dealer-reports-card">
                      <div className="dealer-reports-card__icon"><FaBoxes /></div>
                      <div className="dealer-reports-card__label">Конструкції</div>
                      <div className="dealer-reports-card__value">{formatNumber(neufferDealer.total_constructions)}</div>
                    </article>
                    <article className="dealer-reports-card">
                      <div className="dealer-reports-card__icon"><FaMoneyBillWave /></div>
                      <div className="dealer-reports-card__label">Оборот / сер. чек</div>
                      <div className="dealer-reports-card__value">{formatCurrency(neufferDealer.total_turnover)}</div>
                      <div className="dealer-reports-card__hint">Сер. чек: {formatCurrency(neufferDealer.avg_check)}</div>
                    </article>
                  </section>
                ) : null}
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
                        {activeDealers.filter(function (item) { return !isNeufferDealer(item.dealer_name); }).length ? activeDealers.filter(function (item) { return !isNeufferDealer(item.dealer_name); }).map(function (item, index) {
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
                            <td colSpan="8">Немає інших дилерів у вибраному періоді.</td>
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
      <button
        type="button"
        className="orders-dashboard__scroll-top"
        aria-label="Піднятися вгору"
        title="Піднятися вгору"
        onClick={function () {
          document.querySelector(".orders-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <FaArrowUp />
      </button>
    </main>
  );
}
