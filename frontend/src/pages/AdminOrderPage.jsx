import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axiosInstance from "../api/axios";
import {
  CalculationItem,
} from "../components/Orders/OrderComponents";
import {
  CalculationItemMobile,
} from "../components/Orders/CalculationItemMobile";
import "../components/Portal/PortalOriginal.css";

import NewCalculationModal from "../components/Orders/NewCalculationModal";

import useWindowWidth from "../hooks/useWindowWidth";
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";

const ITEMS_PER_LOAD = 100;
const ALL_DEALERS_VALUE = "__ALL__";

const getLocalDateString = (dateValue = new Date()) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthDateRange = (yearValue, monthValue) => {
  const year = Number(yearValue);
  const month = Number(monthValue);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  return {
    dateFrom: getLocalDateString(firstDay),
    dateTo: getLocalDateString(lastDay),
  };
};

const getDefaultDateRange = () => {
  const now = new Date();

  return {
    dateFrom: getLocalDateString(
      new Date(now.getFullYear(), now.getMonth(), 1),
    ),
    dateTo: getLocalDateString(now),
  };
};

const isValidDateRange = (dateFrom, dateTo) => {
  if (!dateFrom || !dateTo) return false;

  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);

  return (
    !Number.isNaN(from.getTime()) &&
    !Number.isNaN(to.getTime()) &&
    from <= to
  );
};

const AdminPortalOriginal = () => {
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  const { register, cancelAll } = useCancelAllRequests();
  const { t } = useTranslation();

  const [calculationsData, setCalculationsData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [filter, setFilter] = useState({
    status: "Всі",
    month: 0,
    name: "",
  });

  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  const [allDealersDateMode, setAllDealersDateMode] = useState("month");

  const [singleDealerDateMode, setSingleDealerDateMode] = useState("year");

  const [singleDealerDateFrom, setSingleDealerDateFrom] = useState(
    `${new Date().getFullYear()}-01-01`,
  );
  const [singleDealerDateTo, setSingleDealerDateTo] = useState(
    getLocalDateString(),
  );

  const [appliedSingleDealerDateFrom, setAppliedSingleDealerDateFrom] =
    useState(`${new Date().getFullYear()}-01-01`);
  const [appliedSingleDealerDateTo, setAppliedSingleDealerDateTo] =
    useState(`${new Date().getFullYear()}-12-31`);
  const [appliedSingleDealerMode, setAppliedSingleDealerMode] =
    useState("year");
  const [appliedSingleDealerYear, setAppliedSingleDealerYear] =
    useState(String(new Date().getFullYear()));

  const previousDealerGuidRef = useRef(dealerGuid);

  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);

  const [dateFrom, setDateFrom] = useState(defaultDateRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultDateRange.dateTo);

  const [appliedDateFrom, setAppliedDateFrom] = useState(
    defaultDateRange.dateFrom,
  );
  const [appliedDateTo, setAppliedDateTo] = useState(
    defaultDateRange.dateTo,
  );

  const [dateRangeError, setDateRangeError] = useState("");

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_LOAD);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const currentMonth = useMemo(
    () => new Date().getMonth() + 1,
    [],
  );

  const currentYear = useMemo(
    () => new Date().getFullYear(),
    [],
  );

  const yearIcon = "/assets/icons/YearIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";
  const searchIcon = "/assets/icons/SearchIcon.png";
  const allCalcIcon = "/assets/icons/AllCalcIcon.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const waitingForPaymentIcon =
    "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon =
    "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";
  const filterIcon = "/assets/icons/FiltersIcon.png";

  const isAllDealers =
    isAdmin && dealerGuid === ALL_DEALERS_VALUE;

  const availableYears = useMemo(() => {
    const startYear = 2024;
    const years = [];

    for (let year = currentYear; year >= startYear; year -= 1) {
      years.push(String(year));
    }

    return years;
  }, [currentYear]);

  const getFilteredItems = useCallback(
    (status, month, name, data = []) => {
      let result = [...data];

      if (status && status !== "Всі") {
        result = result.filter((calc) => {
          const orders = calc.orders || [];

          if (orders.length === 0) {
            return status === "Новий";
          }

          return orders.some(
            (order) => order.status === status,
          );
        });
      }

      /*
       * Для всіх дилерів сервер уже повертає тільки потрібний
       * місяць або довільний період. Повторно фільтрувати
       * місяць на клієнті не потрібно.
       */
      if (!isAllDealers && month !== 0) {
        result = result.filter((calc) => {
          if (!calc.dateRaw) return false;

          const date = new Date(calc.dateRaw);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMonth() + 1 === month
          );
        });
      }

      const query = String(name || "")
        .toLowerCase()
        .trim();

      if (query) {
        result = result.filter(
          (calc) =>
            String(calc.number || "")
              .toLowerCase()
              .includes(query) ||
            String(
              calc.dealer || calc.organizationName || "",
            )
              .toLowerCase()
              .includes(query) ||
            (calc.orders || []).some((order) =>
              String(order.number || "")
                .toLowerCase()
                .includes(query),
            ),
        );
      }

      return result;
    },
    [isAllDealers],
  );

  useEffect(() => {
    if (isAdmin && !dealerGuid) {
      setDealerGuid(ALL_DEALERS_VALUE);
    }
  }, [isAdmin, dealerGuid, setDealerGuid]);

  useEffect(() => {
    if (!isAllDealers) return;

    setFilter((previous) => {
      if (previous.month !== 0) return previous;

      return {
        ...previous,
        month: currentMonth,
      };
    });
  }, [isAllDealers, currentMonth]);


  const applyAllDealersMonth = useCallback(() => {
    const month = filter.month || currentMonth;
    const range = getMonthDateRange(selectedYear, month);

    setDateRangeError("");
    setAppliedDateFrom(range.dateFrom);
    setAppliedDateTo(range.dateTo);
    setDisplayLimit(ITEMS_PER_LOAD);
  }, [filter.month, currentMonth, selectedYear]);

  const applyDateRange = useCallback(() => {
    if (!dateFrom || !dateTo) {
      setDateRangeError("Оберіть обидві дати.");
      return;
    }

    if (!isValidDateRange(dateFrom, dateTo)) {
      setDateRangeError(
        "Дата початку не може бути більшою за дату завершення.",
      );
      return;
    }

    setDateRangeError("");
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setDisplayLimit(ITEMS_PER_LOAD);
  }, [dateFrom, dateTo]);

  const handleDateModeChange = useCallback(
    (mode) => {
      setAllDealersDateMode(mode);
      setDateRangeError("");
      setDisplayLimit(ITEMS_PER_LOAD);

      if (mode === "range") {
        setDateFrom(appliedDateFrom);
        setDateTo(appliedDateTo);
      }
    },
    [
      filter.month,
      currentMonth,
      selectedYear,
      appliedDateFrom,
      appliedDateTo,
    ],
  );


  const applySingleDealerPeriod = useCallback(() => {
    if (!singleDealerDateFrom || !singleDealerDateTo) {
      setDateRangeError("Оберіть обидві дати.");
      return;
    }

    if (
      !isValidDateRange(
        singleDealerDateFrom,
        singleDealerDateTo,
      )
    ) {
      setDateRangeError(
        "Дата початку не може бути більшою за дату завершення.",
      );
      return;
    }

    setDateRangeError("");
    setAppliedSingleDealerMode("period");
    setAppliedSingleDealerDateFrom(singleDealerDateFrom);
    setAppliedSingleDealerDateTo(singleDealerDateTo);
    setFilter((previous) => ({
      ...previous,
      month: 0,
    }));
    setDisplayLimit(ITEMS_PER_LOAD);
  }, [singleDealerDateFrom, singleDealerDateTo]);

  const handleSingleDealerDateModeChange = useCallback(
    (mode) => {
      setSingleDealerDateMode(mode);
      setDateRangeError("");
      setDisplayLimit(ITEMS_PER_LOAD);

      if (mode === "period") {
        setFilter((previous) => ({
          ...previous,
          month: 0,
        }));
      }
    },
    [],
  );

  const applySingleDealerYear = useCallback(() => {
    setDateRangeError("");
    setAppliedSingleDealerMode("year");
    setAppliedSingleDealerYear(selectedYear);
    setAppliedSingleDealerDateFrom(`${selectedYear}-01-01`);
    setAppliedSingleDealerDateTo(`${selectedYear}-12-31`);
    setDisplayLimit(ITEMS_PER_LOAD);
  }, [selectedYear]);

  useEffect(() => {
    const previousDealerGuid = previousDealerGuidRef.current;

    const switchedFromAllToSingle =
      previousDealerGuid === ALL_DEALERS_VALUE &&
      dealerGuid &&
      dealerGuid !== ALL_DEALERS_VALUE;

    if (switchedFromAllToSingle) {
      setSingleDealerDateMode("year");
      setAppliedSingleDealerMode("year");
      setAppliedSingleDealerYear(selectedYear);
      setSingleDealerDateFrom(`${selectedYear}-01-01`);
      setSingleDealerDateTo(`${selectedYear}-12-31`);
      setAppliedSingleDealerDateFrom(`${selectedYear}-01-01`);
      setAppliedSingleDealerDateTo(`${selectedYear}-12-31`);
      setFilter((previous) => ({
        ...previous,
        month: 0,
      }));
      setDateRangeError("");
      setDisplayLimit(ITEMS_PER_LOAD);
    }

    previousDealerGuidRef.current = dealerGuid;
  }, [dealerGuid, selectedYear]);

  const reloadCalculations = useCallback(async () => {
    cancelAll();

    const controller = register();
    setReloading(true);

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const range = getMonthDateRange(year, month);

      setDealerGuid(ALL_DEALERS_VALUE);
      setSelectedYear(String(year));
      setAllDealersDateMode("month");

      setFilter((previous) => ({
        ...previous,
        month,
      }));

      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
      setAppliedDateFrom(range.dateFrom);
      setAppliedDateTo(range.dateTo);
      setDateRangeError("");

      const response = await axiosInstance.get(
        "/order/get_orders_info_all/",
        {
          params: {
            date_from: range.dateFrom,
            date_to: range.dateTo,
          },
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted) return;

      if (response.data?.status === "success") {
        const rawData =
          response.data.data?.calculation || [];

        setCalculationsData(rawData);
        setDisplayLimit(ITEMS_PER_LOAD);
      } else {
        setCalculationsData([]);
      }
    } catch (error) {
      if (
        error.name !== "CanceledError" &&
        error.code !== "ERR_CANCELED"
      ) {
        setCalculationsData([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setReloading(false);
      }
    }
  }, [
    cancelAll,
    register,
    setDealerGuid,
  ]);

  const requestYear = isAllDealers
    ? selectedYear
    : appliedSingleDealerYear;

  useEffect(() => {
    cancelAll();

    const controller = register();
    const { signal } = controller;

    const fetchData = async () => {
      setLoading(true);

      try {
        let response;

        if (isAllDealers) {
          if (
            !isValidDateRange(
              appliedDateFrom,
              appliedDateTo,
            )
          ) {
            setCalculationsData([]);
            return;
          }

          response = await axiosInstance.get(
            "/order/get_orders_info_all/",
            {
              params: {
                date_from: appliedDateFrom,
                date_to: appliedDateTo,
              },
              signal,
            },
          );
        } else if (dealerGuid) {
          const params =
            appliedSingleDealerMode === "period"
              ? {
                  date_from: appliedSingleDealerDateFrom,
                  date_to: appliedSingleDealerDateTo,
                  contractor_guid: dealerGuid,
                }
              : {
                  year: appliedSingleDealerYear,
                  contractor_guid: dealerGuid,
                };

          response = await axiosInstance.get(
            "/order/get_orders_info/",
            {
              params,
              signal,
            },
          );
        } else if (isAdmin && !dealerGuid) {
          setCalculationsData([]);
          return;
        } else {
          response = await axiosInstance.get(
            "/order/get_orders_info/",
            {
              params: {
                year: selectedYear,
              },
              signal,
            },
          );
        }

        if (signal.aborted) return;

        if (response.data?.status === "success") {
          const rawData =
            response.data.data?.calculation || [];

          setCalculationsData(rawData);
        } else {
          setCalculationsData([]);
        }
      } catch (error) {
        if (
          error.name !== "CanceledError" &&
          error.code !== "ERR_CANCELED"
        ) {
          setCalculationsData([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setDisplayLimit(ITEMS_PER_LOAD);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };

    /*
     * cancelAll і register не додаємо в залежності.
     * Якщо useCancelAllRequests повертає нові функції
     * після кожного рендера, це створює цикл GET-запитів.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    requestYear,
    dealerGuid,
    isAdmin,
    isAllDealers,
    appliedDateFrom,
    appliedDateTo,
    appliedSingleDealerMode,
    appliedSingleDealerYear,
    appliedSingleDealerDateFrom,
    appliedSingleDealerDateTo,
  ]);

  useEffect(() => {
    setFilteredItems(
      getFilteredItems(
        filter.status,
        filter.month,
        filter.name,
        calculationsData,
      ),
    );

    setDisplayLimit(ITEMS_PER_LOAD);
  }, [
    filter.status,
    filter.month,
    filter.name,
    calculationsData,
    getFilteredItems,
  ]);

  const statusSummary = useMemo(() => {
    const summary = {
      Всі: 0,
      Новий: 0,
      "В обробці": 0,
      "Очікуємо оплату": 0,
      Підтверджений: 0,
      "Очікуємо підтвердження": 0,
      "У виробництві": 0,
      Готовий: 0,
      Відвантажений: 0,
      Відмова: 0,
    };

    calculationsData.forEach((calc) => {
      const orders = calc.orders || [];

      summary.Всі += orders.length || 1;

      if (orders.length === 0) {
        summary.Новий += 1;
      }

      orders.forEach((order) => {
        if (
          order.status &&
          summary[order.status] !== undefined
        ) {
          summary[order.status] += 1;
        }
      });
    });

    return summary;
  }, [calculationsData]);

  const monthSummary = useMemo(() => {
    const summary = {};

    for (let month = 1; month <= 12; month += 1) {
      summary[month] = 0;
    }

    calculationsData.forEach((calc) => {
      if (!calc.dateRaw) return;

      const date = new Date(calc.dateRaw);

      if (Number.isNaN(date.getTime())) return;

      summary[date.getMonth() + 1] += 1;
    });

    return summary;
  }, [calculationsData]);

  const handleStatusClick = (status) => {
    setFilter((previous) => ({
      ...previous,
      status,
    }));
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleDeleteSuccess = useCallback((id) => {
    setCalculationsData((previous) =>
      previous.filter((item) => item.id !== id),
    );

    setFilteredItems((previous) =>
      previous.filter((item) => item.id !== id),
    );
  }, []);

  const handleEditCalculation = useCallback((calculation) => {
    setEditingCalculation(calculation);
    setIsCalcModalOpen(true);
  }, []);

  const handleOpenCreateCalculation = useCallback(() => {
    setEditingCalculation(null);
    setIsCalcModalOpen(true);
  }, []);

  const handleMonthClick = (month) => {
    if (isAllDealers && month === 0) return;

    const newMonth =
      filter.month === month
        ? isAllDealers
          ? month
          : 0
        : month;

    setFilter((previous) => ({
      ...previous,
      month: newMonth,
    }));

    /*
     * Для всіх дилерів місяць є серверним фільтром:
     * одразу формуємо date_from/date_to і запускаємо запит.
     */
    if (isAllDealers && allDealersDateMode === "month") {
      const range = getMonthDateRange(
        selectedYear,
        newMonth,
      );

      setDateRangeError("");
      setAppliedDateFrom(range.dateFrom);
      setAppliedDateTo(range.dateTo);
    }

    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleSearchChange = (event) => {
    const name = event.target.value;

    setFilter((previous) => ({
      ...previous,
      name,
    }));

    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleClearSearch = () => {
    setFilter((previous) => ({
      ...previous,
      name: "",
    }));

    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleLoadMore = () => {
    setDisplayLimit(
      (previous) => previous + ITEMS_PER_LOAD,
    );
  };

  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (first, second) =>
          new Date(second.dateRaw) -
          new Date(first.dateRaw),
      ),
    [filteredItems],
  );

  const itemsToShow = sortedItems.slice(0, displayLimit);
  const showLoadMoreButton =
    sortedItems.length > displayLimit;

  const nextLoadCount = Math.min(
    ITEMS_PER_LOAD,
    sortedItems.length - displayLimit,
  );

  const remainingItems =
    sortedItems.length - displayLimit;

  if (loading || reloading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner" />

        <div className="loading-text">
          {reloading
            ? t("portal_calc.ui.reloading")
            : t("portal_calc.ui.loading")}
        </div>
      </div>
    );
  }

  const monthShortLabels = t(
    "portal_calc.months.short",
    {
      returnObjects: true,
    },
  );

  const monthFullLabels = t(
    "portal_calc.months.full",
    {
      returnObjects: true,
    },
  );

  return (
    <div className="column portal-body">
      <div
        className="content-summary row w-100"
        style={{ justifyContent: "center" }}
      >
        <div className="by-month-pagination-wrapper row gap-4">
          <div className="pagination-container w-100 row items-center gap-2">
          <div
            className="mobile-sidebar-toggle mr-1"
            onClick={() => setIsSidebarOpen(true)}
          >
            <img
              src={filterIcon}
              alt=""
              className="align-center mr-1 min-w-[20px] h-[20px]"
            />
          </div>

          {isAllDealers ? (
            <div className="date-filter-mode-switch row">
              <button
                type="button"
                className={`date-filter-mode-button ${
                  allDealersDateMode === "month"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleDateModeChange("month")
                }
              >
                Місяць
              </button>

              <button
                type="button"
                className={`date-filter-mode-button ${
                  allDealersDateMode === "range"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleDateModeChange("range")
                }
              >
                Період
              </button>
            </div>
          ) : (
            <div className="date-filter-mode-switch row">
              <button
                type="button"
                className={`date-filter-mode-button ${
                  singleDealerDateMode === "year"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSingleDealerDateModeChange("year")
                }
              >
                Рік
              </button>

              <button
                type="button"
                className={`date-filter-mode-button ${
                  singleDealerDateMode === "period"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSingleDealerDateModeChange("period")
                }
              >
                Період
              </button>
            </div>
          )}

          {((isAllDealers &&
            allDealersDateMode === "month") ||
            (!isAllDealers &&
              singleDealerDateMode === "year")) && (
            <>
              <div className="year-inline-selector row">
                {/* <img
                  src={yearIcon}
                  alt=""
                  className="align-center mr-2 w-[26px] h-[25px]"
                />

                <div className="flex items-center justify-center text-center text-white text-lg font-normal font-['Inter'] uppercase mr-2">
                  {t("portal_calc.ui.report_year")}
                </div> */}

                <select
                  className="year-select-minimal"
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(event.target.value)
                  }
                >
                  {availableYears.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {isAllDealers && (
                <button
                  type="button"
                  className="date-filter-search-button"
                  onClick={applyAllDealersMonth}
                  disabled={loading || reloading}
                >
                  <FaSearch className="date-filter-search-icon" />
                  <span className="date-filter-search-text">
                    {reloading
                      ? t("portal_calc.ui.searching", {
                          defaultValue: "Пошук...",
                        })
                      : t("portal_calc.ui.search", {
                          defaultValue: "Пошук",
                        })}
                  </span>
                </button>
              )}

              {!isAllDealers && (
                <button
                  type="button"
                  className="date-filter-search-button"
                  onClick={applySingleDealerYear}
                  disabled={loading || reloading}
                >
                  <FaSearch className="date-filter-search-icon" />
                  <span className="date-filter-search-text">
                    {reloading
                      ? t("portal_calc.ui.searching", {
                          defaultValue: "Пошук...",
                        })
                      : t("portal_calc.ui.search", {
                          defaultValue: "Пошук",
                        })}
                  </span>
                </button>
              )}

              <ul className="gap-6 row no-wrap month-list flex-1">
                {!isAllDealers && (
                  <li
                    className={`pagination-item ${
                      filter.month === 0
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleMonthClick(0)
                    }
                  >
                    {t(
                      "portal_calc.months.all_year",
                    )}
                  </li>
                )}

                {Array.from(
                  { length: 12 },
                  (_, index) => {
                    const month = index + 1;

                    const disabled =
                      !isAllDealers &&
                      monthSummary[month] === 0;

                    return (
                      <li
                        key={month}
                        className={`pagination-item ${
                          filter.month === month
                            ? "active"
                            : ""
                        } ${
                          disabled
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() => {
                          if (disabled) return;

                          handleMonthClick(month);
                        }}
                      >
                        {monthShortLabels[index]}

                        {!isAllDealers && (
                          <span className="text-yellow">
                            {" "}
                            ({monthSummary[month]})
                          </span>
                        )}
                      </li>
                    );
                  },
                )}
              </ul>

              <select
                className="month-select flex-1"
                value={filter.month}
                onChange={(event) =>
                  handleMonthClick(
                    Number(event.target.value),
                  )
                }
              >
                {!isAllDealers && (
                  <option value={0}>
                    {t(
                      "portal_calc.months.all_year",
                    )}
                  </option>
                )}

                {Array.from(
                  { length: 12 },
                  (_, index) => {
                    const month = index + 1;

                    const disabled =
                      !isAllDealers &&
                      monthSummary[month] === 0;

                    return (
                      <option
                        key={month}
                        value={month}
                        disabled={disabled}
                      >
                        {monthFullLabels[index]}
                        {!isAllDealers
                          ? ` (${monthSummary[month]})`
                          : ""}
                      </option>
                    );
                  },
                )}
              </select>
            </>
          )}

          {!isAllDealers &&
            singleDealerDateMode === "period" && (
              <div className="date-filter-inline">
                <div className="date-filter-top-row">
                  <div className="date-period-fields">
                    <label className="date-period-field">
                      <span>З</span>
                      <input
                        type="date"
                        className="date-period-input"
                        value={singleDealerDateFrom}
                        max={singleDealerDateTo || undefined}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSingleDealerDateFrom(value);
                          if (
                            value &&
                            singleDealerDateTo &&
                            value > singleDealerDateTo
                          ) {
                            setSingleDealerDateTo(value);
                          }
                          setDateRangeError("");
                        }}
                      />
                    </label>

                    <label className="date-period-field">
                      <span>По</span>
                      <input
                        type="date"
                        className="date-period-input"
                        value={singleDealerDateTo}
                        min={singleDealerDateFrom || undefined}
                        onChange={(event) => {
                          setSingleDealerDateTo(
                            event.target.value,
                          );
                          setDateRangeError("");
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="date-filter-search-button"
                    onClick={applySingleDealerPeriod}
                    disabled={
                      loading ||
                      reloading ||
                      !singleDealerDateFrom ||
                      !singleDealerDateTo ||
                      !isValidDateRange(
                        singleDealerDateFrom,
                        singleDealerDateTo,
                      )
                    }
                  >
                    <FaSearch className="date-filter-search-icon" />
                    <span className="date-filter-search-text">
                      {reloading
                        ? t("portal_calc.ui.searching", {
                            defaultValue: "Пошук...",
                          })
                        : t("portal_calc.ui.search", {
                            defaultValue: "Пошук",
                          })}
                    </span>
                  </button>
                </div>

                {dateRangeError && (
                  <div className="date-filter-bottom-row">
                    <span className="date-range-error">
                      {dateRangeError}
                    </span>
                  </div>
                )}
              </div>
            )}

          {isAllDealers &&
            allDealersDateMode === "range" && (
              <div className="date-filter-inline">
                <div className="date-filter-top-row">
                  <div className="date-period-fields">
                    <label className="date-period-field">
                      <span>З</span>

                      <input
                        type="date"
                        className="date-period-input"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(event) => {
                          setDateFrom(
                            event.target.value,
                          );
                          setDateRangeError("");
                        }}
                      />
                    </label>

                    <label className="date-period-field">
                      <span>По</span>

                      <input
                        type="date"
                        className="date-period-input"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(event) => {
                          setDateTo(
                            event.target.value,
                          );
                          setDateRangeError("");
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="date-filter-search-button"
                    onClick={applyDateRange}
                    disabled={
                      loading ||
                      reloading ||
                      !dateFrom ||
                      !dateTo ||
                      !isValidDateRange(
                        dateFrom,
                        dateTo,
                      )
                    }
                  >
                    <FaSearch className="date-filter-search-icon" />

                    <span className="date-filter-search-text">
                      {reloading
                        ? t(
                            "portal_calc.ui.searching",
                            {
                              defaultValue: "Пошук...",
                            },
                          )
                        : t(
                            "portal_calc.ui.search",
                            {
                              defaultValue: "Пошук",
                            },
                          )}
                    </span>
                  </button>
                </div>

                {dateRangeError && (
                  <div className="date-filter-bottom-row">
                    <span className="date-range-error">
                      {dateRangeError}
                    </span>
                  </div>
                )}
              </div>
            )}
        </div>
        </div>
      </div>

      <div className="content-wrapper row w-100 h-100">
        <div className="row h-100 max-w-[1334px] w-100">
          <div
            className={`content-filter column ${
              isSidebarOpen ? "open" : "closed"
            }`}
          >
            {isSidebarOpen && (
              <div className="sidebar-header row ai-center jc-space-between">
                <span>
                  {t("portal_calc.ui.filters")}
                </span>

                <span
                  className="icon icon-cross"
                  onClick={() =>
                    setIsSidebarOpen(false)
                  }
                />
              </div>
            )}

            <div className="search-wrapper text-base">
              <input
                type="text"
                className="search-orders w-full pl-10 pr-4 py-2 border rounded-md"
                placeholder={t(
                  "portal_calc.ui.search_placeholder",
                )}
                value={filter.name}
                onChange={handleSearchChange}
              />

              {!!filter.name && (
                <span
                  className="icon icon-cancel2 clear-search"
                  title="Очистити пошук"
                  onClick={handleClearSearch}
                />
              )}

              <img
                src={searchIcon}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
              />
            </div>

            {isAdmin && (
              <ul className="buttons mt-2">
                <li>
                  <div className="dealer-select-wrapper text-[#44403E]">
                    <DealerSelectWithAll
                      value={dealerGuid}
                      onChange={setDealerGuid}
                    />
                  </div>
                </li>
              </ul>
            )}

            <ul className="buttons">
              <li
                className="btn-add-calc"
                onClick={handleOpenCreateCalculation}
              >
                <img
                  src={plusIcon}
                  alt="+"
                  className="align-center mr-2"
                />

                <div className="text-center text-WS---DarkGrey text-[18px] font-bold font-['Inter'] uppercase">
                  {t(
                    "portal_calc.ui.new_calculation",
                  )}
                </div>
              </li>
            </ul>

            <ul className="filter column align-center">
              <div
                className="
                  min-[1260px]:w-72
                  min-[1260px]:bg-[#6B98BF]
                  min-[1260px]:shadow-sm
                  min-[1260px]:py-[26px]
                  min-[1260px]:rounded-tl-[5px]
                  min-[1260px]:rounded-tr-[20px]
                  min-[1260px]:rounded-bl-[5px]
                  min-[1260px]:rounded-br-[20px]
                  min-[1260px]:h-full
                  max-[1260px]:bg-transparent
                  max-[1260px]:shadow-none
                  max-[1260px]:py-0
                  max-[1260px]:w-full
                  max-[1260px]:overflow-visible
                "
              >
                {[
                  {
                    id: "all",
                    label: t(
                      "portal_calc.filter_labels.all",
                    ),
                    icon: allCalcIcon,
                    statusKey: "Всі",
                  },
                  {
                    id: "new",
                    label: t(
                      "portal_calc.filter_labels.new",
                    ),
                    icon: newCalcIcon,
                    statusKey: "Новий",
                  },
                  {
                    id: "waiting-confirm",
                    label: t(
                      "portal_calc.filter_labels.waiting_confirm",
                    ),
                    icon: waitingForConfirmIcon,
                    statusKey:
                      "Очікуємо підтвердження",
                  },
                  {
                    id: "waiting-payment",
                    label: t(
                      "portal_calc.filter_labels.waiting_payment",
                    ),
                    icon: waitingForPaymentIcon,
                    statusKey: "Очікуємо оплату",
                  },
                  {
                    id: "confirmed",
                    label: t(
                      "portal_calc.filter_labels.confirmed",
                    ),
                    icon: confirmedIcon,
                    statusKey: "Підтверджений",
                  },
                  {
                    id: "production",
                    label: t(
                      "portal_calc.filter_labels.production",
                    ),
                    icon: factoryIcon,
                    statusKey: "У виробництві",
                  },
                  {
                    id: "ready",
                    label: t(
                      "portal_calc.filter_labels.ready",
                    ),
                    icon: finishedIcon,
                    statusKey: "Готовий",
                  },
                  {
                    id: "delivered",
                    label: t(
                      "portal_calc.filter_labels.delivered",
                    ),
                    icon: deliveredIcon,
                    statusKey: "Відвантажений",
                  },
                  {
                    id: "rejected",
                    label: t(
                      "portal_calc.filter_labels.rejected",
                    ),
                    icon: canceledCalcIcon,
                    statusKey: "Відмова",
                  },
                ].map(
                  ({
                    id,
                    label,
                    icon,
                    statusKey,
                  }) => (
                    <li
                      key={id}
                      className={`filter-item text-[#fff] ${
                        filter.status ===
                        statusKey
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleStatusClick(
                          statusKey,
                        )
                      }
                    >
                      <img
                        src={icon}
                        alt=""
                        className={`mr-3 object-contain ${
                          filter.status ===
                          statusKey
                            ? "opacity-70"
                            : "brightness-0 invert"
                        }`}
                      />

                      <span className="w-100">
                        {label}
                      </span>

                      <span
                        className={
                          statusSummary[
                            statusKey
                          ] === 0
                            ? "disabled"
                            : ""
                        }
                      >
                        {
                          statusSummary[
                            statusKey
                          ]
                        }
                      </span>
                    </li>
                  ),
                )}
              </div>
            </ul>
          </div>

          <div
            className="content"
            id="content"
          >
            <div
              className="items-wrapper column gap-14"
              id="items-wrapper"
            >
              {itemsToShow.length === 0 ? (
                <div className="no-data column align-center h-100">
                  <div className="font-size-24 text-grey">
                    {t(
                      "portal_calc.ui.no_calculations",
                    )}
                  </div>
                </div>
              ) : (
                itemsToShow.map((calc) =>
                  isMobile ? (
                    <CalculationItemMobile
                      key={calc.id}
                      calc={calc}
                      isExpanded={
                        expandedCalc === calc.id
                      }
                      onToggle={() =>
                        setExpandedCalc(
                          (previous) =>
                            previous === calc.id
                              ? null
                              : calc.id,
                        )
                      }
                      expandedOrderId={
                        expandedOrder
                      }
                      onOrderToggle={
                        setExpandedOrder
                      }
                      onDelete={
                        handleDeleteSuccess
                      }
                      onEdit={handleEditCalculation}
                    />
                  ) : (
                    <CalculationItem
                      key={calc.id}
                      calc={calc}
                      isExpanded={
                        expandedCalc === calc.id
                      }
                      onToggle={() =>
                        setExpandedCalc(
                          (previous) =>
                            previous === calc.id
                              ? null
                              : calc.id,
                        )
                      }
                      expandedOrderId={
                        expandedOrder
                      }
                      onOrderToggle={
                        setExpandedOrder
                      }
                      onDelete={
                        handleDeleteSuccess
                      }
                      onEdit={handleEditCalculation}
                    />
                  ),
                )
              )}

              {showLoadMoreButton && (
                <div
                  className="row w-100"
                  style={{
                    marginTop: "20px",
                    marginBottom: "20px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className="btn btn-primary uppercase btn-load-more-big"
                    onClick={handleLoadMore}
                    style={{
                      padding: "12px 24px",
                      fontSize: "14px",
                      fontWeight: "500",
                      minWidth: "200px",
                      backgroundColor: "#5e83bf",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      boxShadow:
                        "0 4px 6px rgba(0, 0, 0, 0.1)",
                      justifySelf: "center",
                    }}
                  >
                    <span
                      className="icon icon-loop2"
                      style={{
                        marginRight: "10px",
                      }}
                    />

                    {t(
                      "portal_calc.ui.load_more_admin",
                      {
                        next: nextLoadCount,
                        total: remainingItems,
                      },
                    )}
                  </button>
                </div>
              )}

              {!showLoadMoreButton &&
                sortedItems.length >
                  ITEMS_PER_LOAD && (
                  <div
                    className="row  text-grey"
                    style={{
                      marginTop: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    {t(
                      "portal_calc.ui.all_loaded",
                      {
                        count:
                          sortedItems.length,
                      },
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <NewCalculationModal
        isOpen={isCalcModalOpen}
        onClose={() => {
          setEditingCalculation(null);
          setIsCalcModalOpen(false);
        }}
        onSave={async () => {
          setEditingCalculation(null);
          setIsCalcModalOpen(false);
          await reloadCalculations();
        }}
        initialCalculation={editingCalculation}
      />
    </div>
  );
};

export default AdminPortalOriginal;
