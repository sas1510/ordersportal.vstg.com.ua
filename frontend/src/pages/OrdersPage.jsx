import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";

import axiosInstance from "../api/axios";
import {
  CalculationItem,
} from "../components/Orders/OrderComponents";
import {
  CalculationItemMobile,
} from "../components/Orders/CalculationItemMobile";
import NewCalculationModal from "../components/Orders/NewCalculationModal";
import OrdersDailyReminderModal from "../components/Orders/OrdersDailyReminderModal";

import useWindowWidth from "../hooks/useWindowWidth";
import useCancelAllRequests from "../hooks/useCancelAllRequests";

import "../components/Portal/PortalOriginal.css";
import "../components/Orders/OrdersDailyReminderModal.css";

const ITEMS_PER_LOAD = 100;

const getLocalDateString = (dateValue = new Date()) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const PortalOriginal = () => {
  const { register, cancelAll } = useCancelAllRequests();
  const { t, i18n } = useTranslation();

  const locale = i18n.language;
  const navigate = useNavigate();
  const location = useLocation();

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const currentYearNumber = new Date().getFullYear();
  const currentYear = String(currentYearNumber);
  const todayDate = getLocalDateString();

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
  const closeIcon = "/assets/icons/CloseButton.png";

  const [error, setError] = useState(null);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState(null);
  const [calculationsData, setCalculationsData] = useState([]);

  const [filter, setFilter] = useState({
    status: "Всі",
    month: 0,
    name: "",
  });

  const [dateFilterMode, setDateFilterMode] = useState("year");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo] = useState(todayDate);

  const [appliedDateFilter, setAppliedDateFilter] = useState({
    mode: "year",
    year: currentYear,
    dateFrom: `${currentYear}-01-01`,
    dateTo: `${currentYear}-12-31`,
  });

  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [limit, setLimit] = useState(ITEMS_PER_LOAD);
  const [isDailyReminderOpen, setIsDailyReminderOpen] =
    useState(false);

  const getReminderStorageKey = useCallback(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser
        ? JSON.parse(rawUser)
        : null;

      const identity =
        parsedUser?.user_id_1c ||
        parsedUser?.id ||
        parsedUser?.username ||
        localStorage.getItem("role") ||
        "anonymous";

      return `orders_daily_reminder_seen_${identity}_${getLocalDateString()}`;
    } catch {
      return `orders_daily_reminder_seen_anonymous_${getLocalDateString()}`;
    }
  }, []);

  const getReminderOptOutKey = useCallback(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser
        ? JSON.parse(rawUser)
        : null;

      const identity =
        parsedUser?.user_id_1c ||
        parsedUser?.id ||
        parsedUser?.username ||
        localStorage.getItem("role") ||
        "anonymous";

      return `orders_daily_reminder_opt_out_${identity}`;
    } catch {
      return "orders_daily_reminder_opt_out_anonymous";
    }
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilter((previous) => ({
      ...previous,
      [key]: value,
    }));

    setLimit(ITEMS_PER_LOAD);
  }, []);

  const resetLocalMonthFilter = useCallback(() => {
    setFilter((previous) => ({
      ...previous,
      month: 0,
    }));

    setLimit(ITEMS_PER_LOAD);
  }, []);

  const handleDateFilterModeChange = useCallback((mode) => {
    setDateFilterMode(mode);

    if (mode === "period") {
      setFilter((previous) => ({
        ...previous,
        month: 0,
      }));

      setLimit(ITEMS_PER_LOAD);
    }
  }, []);

  const handleYearChange = useCallback((event) => {
    setSelectedYear(event.target.value);
  }, []);

  const handleDateFromChange = useCallback(
    (event) => {
      const newDateFrom = event.target.value;

      setDateFrom(newDateFrom);

      if (newDateFrom && dateTo && newDateFrom > dateTo) {
        setDateTo(newDateFrom);
      }
    },
    [dateTo],
  );

  const handleDateToChange = useCallback((event) => {
    setDateTo(event.target.value);
  }, []);

  const handleApplyDateFilter = useCallback(() => {
    setError(null);

    let nextFilter;

    if (dateFilterMode === "period") {
      if (!dateFrom || !dateTo) {
        setError(
          t("portal_calc.errors.date_period_required", {
            defaultValue: "Вкажіть початкову та кінцеву дату.",
          }),
        );

        return;
      }

      if (dateFrom > dateTo) {
        setError(
          t("portal_calc.errors.invalid_date_period", {
            defaultValue:
              'Дата "з" не може бути більшою за дату "по".',
          }),
        );

        return;
      }

      nextFilter = {
        mode: "period",
        year: selectedYear,
        dateFrom,
        dateTo,
      };
    } else {
      nextFilter = {
        mode: "year",
        year: selectedYear,
        dateFrom: `${selectedYear}-01-01`,
        dateTo: `${selectedYear}-12-31`,
      };
    }

    setAppliedDateFilter((previous) => {
      const isSameFilter =
        previous.mode === nextFilter.mode &&
        previous.year === nextFilter.year &&
        previous.dateFrom === nextFilter.dateFrom &&
        previous.dateTo === nextFilter.dateTo;

      return isSameFilter ? previous : nextFilter;
    });

    setExpandedCalc(null);
    setExpandedOrder(null);
    resetLocalMonthFilter();
  }, [
    dateFilterMode,
    selectedYear,
    dateFrom,
    dateTo,
    resetLocalMonthFilter,
    t,
  ]);

  const handleDeleteCalculation = useCallback((calcId) => {
    setCalculationsData((previous) =>
      previous.filter((calc) => calc.id !== calcId),
    );

    setLimit(ITEMS_PER_LOAD);
  }, []);

  const handleUpdateCalculation = useCallback((calculation) => {
    setEditingCalculation(calculation);
    setIsCalcModalOpen(true);
  }, []);

  const handleMarkAsRead = useCallback((calcId) => {
    setCalculationsData((previous) =>
      previous.map((calc) =>
        calc.id === calcId
          ? {
              ...calc,
              hasUnreadMessages: false,
            }
          : calc,
      ),
    );
  }, []);

  const handleCloseCalc = useCallback(() => {
    setEditingCalculation(null);
    setIsCalcModalOpen(false);
  }, []);

  const handleOpenCreateCalculation = useCallback(() => {
    setEditingCalculation(null);
    setIsCalcModalOpen(true);
  }, []);

  const toggleCalc = useCallback((id) => {
    setExpandedCalc((previous) => (previous === id ? null : id));
  }, []);

  const toggleOrder = useCallback((id) => {
    setExpandedOrder((previous) => (previous === id ? null : id));
  }, []);

  useEffect(() => {
    let isActive = true;

    cancelAll();
    const controller = register();

    const load = async () => {
      setLoading(true);
      setError(null);

      const params =
        appliedDateFilter.mode === "period"
          ? {
              date_from: appliedDateFilter.dateFrom,
              date_to: appliedDateFilter.dateTo,
            }
          : {
              year: appliedDateFilter.year,
            };

      try {
        const response = await axiosInstance.get(
          "/order/get_orders_info/",
          {
            params,
            signal: controller.signal,
          },
        );

        if (!isActive) {
          return;
        }

        if (response.data?.status === "success") {
          const calculations =
            response.data?.data?.calculation || [];

          setCalculationsData(calculations);
          setLimit(ITEMS_PER_LOAD);
        } else {
          setCalculationsData([]);
          setError(t("portal_calc.errors.server_error"));
        }
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        const isCanceled =
          requestError?.name === "CanceledError" ||
          requestError?.name === "AbortError" ||
          requestError?.code === "ERR_CANCELED";

        if (!isCanceled) {
          setCalculationsData([]);
          setError(t("portal_calc.errors.connection_error"));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
      controller.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedDateFilter.mode,
    appliedDateFilter.year,
    appliedDateFilter.dateFrom,
    appliedDateFilter.dateTo,
  ]);

  const reloadCalculations = useCallback(async () => {
    cancelAll();

    const controller = register();

    setReloading(true);
    setError(null);

    const params =
      appliedDateFilter.mode === "period"
        ? {
            date_from: appliedDateFilter.dateFrom,
            date_to: appliedDateFilter.dateTo,
          }
        : {
            year: appliedDateFilter.year,
          };

    try {
      const response = await axiosInstance.get(
        "/order/get_orders_info/",
        {
          params,
          signal: controller.signal,
        },
      );

      if (response.data?.status === "success") {
        const calculations =
          response.data?.data?.calculation || [];

        setCalculationsData(calculations);
        setLimit(ITEMS_PER_LOAD);
      } else {
        setCalculationsData([]);
        setError(t("portal_calc.errors.server_error"));
      }
    } catch (requestError) {
      const isCanceled =
        requestError?.name === "CanceledError" ||
        requestError?.name === "AbortError" ||
        requestError?.code === "ERR_CANCELED";

      if (!isCanceled) {
        setCalculationsData([]);
        setError(t("portal_calc.errors.connection_error"));
      }
    } finally {
      setReloading(false);
    }
  }, [
    appliedDateFilter.mode,
    appliedDateFilter.year,
    appliedDateFilter.dateFrom,
    appliedDateFilter.dateTo,
    cancelAll,
    register,
    t,
  ]);

  const handleSaveCalculation = useCallback(async () => {
    setEditingCalculation(null);
    setIsCalcModalOpen(false);
    await reloadCalculations();
  }, [reloadCalculations]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const searchQuery = params.get("search");
    const yearQuery = params.get("year");

    if (
      yearQuery &&
      /^\d{4}$/.test(yearQuery) &&
      yearQuery !== appliedDateFilter.year
    ) {
      setDateFilterMode("year");
      setSelectedYear(yearQuery);
      setDateFrom(`${yearQuery}-01-01`);
      setDateTo(`${yearQuery}-12-31`);

      setAppliedDateFilter({
        mode: "year",
        year: yearQuery,
        dateFrom: `${yearQuery}-01-01`,
        dateTo: `${yearQuery}-12-31`,
      });

      resetLocalMonthFilter();

      navigate(location.pathname, {
        replace: true,
      });

      return;
    }

    if (!searchQuery) {
      return;
    }

    setFilter((previous) => ({
      ...previous,
      name: searchQuery,
      status: "Всі",
      month: 0,
    }));

    setLimit(ITEMS_PER_LOAD);

    if (calculationsData.length === 0) {
      return;
    }

    const normalizedSearch = searchQuery.toLowerCase().trim();

    const foundCalculation = calculationsData.find((calc) => {
      const calculationNumber = String(
        calc.number || "",
      ).toLowerCase();

      const dealerName = String(
        calc.dealer || calc.organizationName || "",
      ).toLowerCase();

      const hasMatchingOrder = (calc.orders || []).some((order) =>
        String(order.number || "")
          .toLowerCase()
          .includes(normalizedSearch),
      );

      return (
        calculationNumber.includes(normalizedSearch) ||
        dealerName.includes(normalizedSearch) ||
        hasMatchingOrder
      );
    });

    if (!foundCalculation) {
      return;
    }

    setExpandedCalc(foundCalculation.id);

    navigate(location.pathname, {
      replace: true,
    });

    const scrollTimeout = window.setTimeout(() => {
      const element = document.getElementById(
        `calc-${foundCalculation.id}`,
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 500);

    return () => {
      window.clearTimeout(scrollTimeout);
    };
  }, [
    location.search,
    location.pathname,
    calculationsData,
    appliedDateFilter.year,
    navigate,
    resetLocalMonthFilter,
  ]);

  const statusSummary = useMemo(() => {
    const summary = {
      Всі: 0,
      Новий: 0,
      "Очікуємо оплату": 0,
      "Очікуємо підтвердження": 0,
      Підтверджений: 0,
      "У виробництві": 0,
      Готовий: 0,
      Відвантажений: 0,
      Відмова: 0,
    };

    calculationsData.forEach((calc) => {
      const orders = Array.isArray(calc.orders)
        ? calc.orders
        : [];

      summary.Всі += orders.length || 1;

      if (orders.length === 0) {
        summary.Новий += 1;
      }

      orders.forEach((order) => {
        if (summary[order.status] !== undefined) {
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
      if (!calc.dateRaw) {
        return;
      }

      const calculationDate = new Date(calc.dateRaw);

      if (Number.isNaN(calculationDate.getTime())) {
        return;
      }

      summary[calculationDate.getMonth() + 1] += 1;
    });

    return summary;
  }, [calculationsData]);

  const getFilteredItems = useCallback(
    (statusValue, monthValue, nameValue) => {
      let items = [...calculationsData];

      if (statusValue !== "Всі") {
        items = items.filter((calc) => {
          const orders = Array.isArray(calc.orders)
            ? calc.orders
            : [];

          if (orders.length === 0) {
            return statusValue === "Новий";
          }

          return orders.some(
            (order) => order.status === statusValue,
          );
        });
      }

      if (
        appliedDateFilter.mode === "year" &&
        monthValue !== 0
      ) {
        items = items.filter((calc) => {
          if (!calc.dateRaw) {
            return false;
          }

          const calculationDate = new Date(calc.dateRaw);

          return (
            !Number.isNaN(calculationDate.getTime()) &&
            calculationDate.getMonth() + 1 === monthValue
          );
        });
      }

      if (nameValue?.trim()) {
        const normalizedName = nameValue.toLowerCase().trim();

        items = items.filter((calc) => {
          const calculationNumber = String(
            calc.number || "",
          ).toLowerCase();

          const dealerName = String(
            calc.dealer || calc.organizationName || "",
          ).toLowerCase();

          const orders = Array.isArray(calc.orders)
            ? calc.orders
            : [];

          return (
            calculationNumber.includes(normalizedName) ||
            dealerName.includes(normalizedName) ||
            orders.some((order) =>
              String(order.number || "")
                .toLowerCase()
                .includes(normalizedName),
            )
          );
        });
      }

      return items;
    },
    [calculationsData, appliedDateFilter.mode],
  );

  const fullFiltered = useMemo(() => {
    const items = getFilteredItems(
      filter.status,
      filter.month,
      filter.name,
    );

    return items.sort((first, second) => {
      const firstTime = first.dateRaw
        ? new Date(first.dateRaw).getTime()
        : 0;

      const secondTime = second.dateRaw
        ? new Date(second.dateRaw).getTime()
        : 0;

      return secondTime - firstTime;
    });
  }, [filter, getFilteredItems]);

  const totalFilteredCount = fullFiltered.length;

  const paginatedItems = useMemo(
    () => fullFiltered.slice(0, limit),
    [fullFiltered, limit],
  );

  const hasMore = limit < totalFilteredCount;

  const remainingCount = Math.max(
    totalFilteredCount - limit,
    0,
  );

  const loadAmount = Math.min(
    ITEMS_PER_LOAD,
    remainingCount,
  );

  const buttonText =
    loadAmount < ITEMS_PER_LOAD
      ? t("portal_calc.ui.load_more_all", {
          count: loadAmount,
        })
      : t("portal_calc.ui.load_more", {
          total: remainingCount,
        });

  const handleLoadMore = useCallback(() => {
    setLimit((previous) =>
      Math.min(
        previous + ITEMS_PER_LOAD,
        totalFilteredCount,
      ),
    );
  }, [totalFilteredCount]);

  const shortMonthLabels = useMemo(() => {
    const labels = t("portal_calc.months.short", {
      returnObjects: true,
    });

    return Array.isArray(labels) ? labels : [];
  }, [t, locale]);

  const fullMonthLabels = useMemo(() => {
    const labels = t("portal_calc.months.full", {
      returnObjects: true,
    });

    return Array.isArray(labels) ? labels : [];
  }, [t, locale]);

  const statusFilters = useMemo(
    () => [
      {
        id: "all",
        label: t("portal_calc.filter_labels.all"),
        icon: allCalcIcon,
        statusKey: "Всі",
      },
      {
        id: "new",
        label: t("portal_calc.filter_labels.new"),
        icon: newCalcIcon,
        statusKey: "Новий",
      },
      {
        id: "waiting-confirm",
        label: t(
          "portal_calc.filter_labels.waiting_confirm",
        ),
        icon: waitingForConfirmIcon,
        statusKey: "Очікуємо підтвердження",
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
        label: t("portal_calc.filter_labels.confirmed"),
        icon: confirmedIcon,
        statusKey: "Підтверджений",
      },
      {
        id: "production",
        label: t("portal_calc.filter_labels.production"),
        icon: factoryIcon,
        statusKey: "У виробництві",
      },
      {
        id: "ready",
        label: t("portal_calc.filter_labels.ready"),
        icon: finishedIcon,
        statusKey: "Готовий",
      },
      {
        id: "delivered",
        label: t("portal_calc.filter_labels.delivered"),
        icon: deliveredIcon,
        statusKey: "Відвантажений",
      },
      {
        id: "rejected",
        label: t("portal_calc.filter_labels.rejected"),
        icon: canceledCalcIcon,
        statusKey: "Відмова",
      },
    ],
    [
      t,
      allCalcIcon,
      newCalcIcon,
      waitingForConfirmIcon,
      waitingForPaymentIcon,
      confirmedIcon,
      factoryIcon,
      finishedIcon,
      deliveredIcon,
      canceledCalcIcon,
    ],
  );

  const waitingConfirmCount =
    statusSummary["Очікуємо підтвердження"] || 0;
  const waitingPaymentCount =
    statusSummary["Очікуємо оплату"] || 0;

  const closeDailyReminder = useCallback(() => {
    try {
      localStorage.setItem(
        getReminderStorageKey(),
        JSON.stringify({
          shownAt: new Date().toISOString(),
          waitingConfirmCount,
          waitingPaymentCount,
        }),
      );
    } catch {
      // ignore localStorage failures
    }

    setIsDailyReminderOpen(false);
  }, [
    getReminderStorageKey,
    waitingConfirmCount,
    waitingPaymentCount,
  ]);

  const handleReminderSelectStatus = useCallback(
    (statusKey) => {
      handleFilterChange("status", statusKey);
      closeDailyReminder();
    },
    [handleFilterChange, closeDailyReminder],
  );

  const disableFutureDailyReminder = useCallback(() => {
    try {
      localStorage.setItem(
        getReminderOptOutKey(),
        JSON.stringify({
          disabledAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore localStorage failures
    }

    closeDailyReminder();
  }, [closeDailyReminder, getReminderOptOutKey]);

  useEffect(() => {
    if (loading || reloading) {
      return;
    }

    const hasReminderItems =
      waitingConfirmCount > 0 || waitingPaymentCount > 0;

    if (!hasReminderItems) {
      setIsDailyReminderOpen(false);
      return;
    }

    if (
      appliedDateFilter.mode !== "year" ||
      appliedDateFilter.year !== currentYear
    ) {
      return;
    }

    try {
      const isOptedOut = localStorage.getItem(
        getReminderOptOutKey(),
      );

      if (isOptedOut) {
        setIsDailyReminderOpen(false);
        return;
      }

      const alreadyShown = localStorage.getItem(
        getReminderStorageKey(),
      );

      if (!alreadyShown) {
        setIsDailyReminderOpen(true);
      }
    } catch {
      setIsDailyReminderOpen(true);
    }
  }, [
    loading,
    reloading,
    waitingConfirmCount,
    waitingPaymentCount,
    appliedDateFilter.mode,
    appliedDateFilter.year,
    currentYear,
    getReminderStorageKey,
    getReminderOptOutKey,
  ]);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner" />

        <div className="loading-text">
          {t("portal_calc.ui.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="column portal-body">
      <OrdersDailyReminderModal
        isOpen={isDailyReminderOpen}
        waitingConfirmCount={waitingConfirmCount}
        waitingPaymentCount={waitingPaymentCount}
        onClose={closeDailyReminder}
        onSelectStatus={handleReminderSelectStatus}
        onDisableFuture={disableFutureDailyReminder}
      />

      <div className="content-summary row w-100 justify-center">
        <div className="by-month-pagination-wrapper">
          <div className="pagination-container w-100 row items-center gap-2">
           

            <div className="date-filter-inline ">
              <div className="date-filter-top-row">
                 <button
              type="button"
              className="mobile-sidebar-toggle mr-1"
              onClick={() => setIsSidebarOpen(true)}
              aria-label={t("portal_calc.ui.filters")}
            >
              <img
                src={filterIcon}
                alt=""
                className="align-center mr-1 min-w-[20px] h-[20px]"
              />
            </button>
                <div className="date-filter-mode-switch row items-center">
                  <button
                    type="button"
                    className={`date-filter-mode-button ${
                      dateFilterMode === "year"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleDateFilterModeChange("year")
                    }
                  >
                    {t("portal_calc.ui.filter_by_year", {
                      defaultValue: "Рік",
                    })}
                  </button>

                  <button
                    type="button"
                    className={`date-filter-mode-button ${
                      dateFilterMode === "period"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleDateFilterModeChange("period")
                    }
                  >
                    {t("portal_calc.ui.filter_by_period", {
                      defaultValue: "Період",
                    })}
                  </button>
                </div>

                {dateFilterMode === "year" && (
                  <>
                    <select
                      className="year-select-minimal"
                      value={selectedYear}
                      onChange={handleYearChange}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, index) => {
                          const year =
                            currentYearNumber - index;

                          return (
                            <option
                              key={year}
                              value={year}
                            >
                              {year}
                            </option>
                          );
                        },
                      )}
                    </select>

                    <button
                      type="button"
                      className="date-filter-search-button"
                      onClick={handleApplyDateFilter}
                      disabled={loading || reloading}
                    >
                      <FaSearch className="date-filter-search-icon" />

                      <span className="date-filter-search-text">
                        {reloading
                          ? t(
                              "portal_calc.ui.searching",
                              {
                                defaultValue:
                                  "Пошук...",
                              },
                            )
                          : t(
                              "portal_calc.ui.search",
                              {
                                defaultValue:
                                  "Пошук",
                              },
                            )}
                      </span>
                    </button>
                  </>
                )}
              </div>

              {dateFilterMode === "period" && (
                <div className="date-filter-bottom-row">
                  <div className="date-period-fields">
                    <label className="date-period-field">
                      <span>
                        {t(
                          "portal_calc.ui.date_from",
                          {
                            defaultValue: "З",
                          },
                        )}
                      </span>

                      <input
                        type="date"
                        className="date-period-input"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={handleDateFromChange}
                      />
                    </label>

                    <label className="date-period-field">
                      <span>
                        {t(
                          "portal_calc.ui.date_to",
                          {
                            defaultValue: "По",
                          },
                        )}
                      </span>

                      <input
                        type="date"
                        className="date-period-input"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={handleDateToChange}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="date-filter-search-button"
                    onClick={handleApplyDateFilter}
                    disabled={loading || reloading}
                  >
                    <FaSearch className="date-filter-search-icon" />

                    <span className="date-filter-search-text">
                      {reloading
                        ? t(
                            "portal_calc.ui.searching",
                            {
                              defaultValue:
                                "Пошук...",
                            },
                          )
                        : t(
                            "portal_calc.ui.search",
                            {
                              defaultValue:
                                "Пошук",
                            },
                          )}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {dateFilterMode === "year" && (
              <>
                <ul className="gap-6 row no-wrap month-list">
                  <li
                    className={`pagination-item ${
                      filter.month === 0
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleFilterChange("month", 0)
                    }
                  >
                    {t("portal_calc.months.all_year")}
                  </li>

                  {Array.from(
                    { length: 12 },
                    (_, index) => {
                      const monthNumber = index + 1;

                      const isDisabled =
                        monthSummary[monthNumber] === 0;

                      return (
                        <li
                          key={monthNumber}
                          className={`pagination-item ${
                            filter.month === monthNumber
                              ? "active"
                              : ""
                          } ${
                            isDisabled ? "disabled" : ""
                          }`}
                          onClick={() => {
                            if (!isDisabled) {
                              handleFilterChange(
                                "month",
                                monthNumber,
                              );
                            }
                          }}
                        >
                          {shortMonthLabels[index] ||
                            monthNumber}{" "}
                          <span className="text-yellow">
                            (
                            {monthSummary[monthNumber]})
                          </span>
                        </li>
                      );
                    },
                  )}
                </ul>

                <select
                  className="month-select row"
                  value={filter.month}
                  onChange={(event) =>
                    handleFilterChange(
                      "month",
                      Number(event.target.value),
                    )
                  }
                >
                  <option value={0}>
                    {t("portal_calc.months.all_year")}
                  </option>

                  {Array.from(
                    { length: 12 },
                    (_, index) => {
                      const monthNumber = index + 1;

                      return (
                        <option
                          key={monthNumber}
                          value={monthNumber}
                          disabled={
                            monthSummary[monthNumber] === 0
                          }
                        >
                          {fullMonthLabels[index] ||
                            monthNumber}{" "}
                          ({monthSummary[monthNumber]})
                        </option>
                      );
                    },
                  )}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="content-wrapper row w-100 h-100">
        <div className="row h-100 max-w-[1334px] w-100">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 !z-[10001] min-[1260px]:hidden transition-opacity"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--header-profile-bg), transparent 60%)",
              }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div
            className={`content-filter column ${
              isSidebarOpen ? "open" : "closed"
            }`}
          >
            {isSidebarOpen && (
              <div className="sidebar-header row ai-center jc-space-between min-[1260px]:!hidden">
                <span>{t("portal_calc.ui.filters")}</span>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <img src={closeIcon} alt="" />
                </button>
              </div>
            )}

            <div className="search-wrapper relative">
              <input
                type="text"
                className="search-orders w-full pl-10 pr-4 py-2 border rounded-md"
                placeholder={t(
                  "portal_calc.ui.search_placeholder",
                )}
                value={filter.name}
                onChange={(event) =>
                  handleFilterChange(
                    "name",
                    event.target.value,
                  )
                }
              />

              <img
                src={searchIcon}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
              />
            </div>

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

                <div className="text-center text-[#44403F] text-[18px] font-bold font-['Inter'] uppercase">
                  {t(
                    "portal_calc.ui.new_calculation",
                  )}
                </div>
              </li>
            </ul>

            <ul className="filter column align-center h-full overflow-hidden">
              <div
                className="
                  w-full
                  h-full
                  min-h-full
                  bg-[#6B98BF]
              
                  py-[26px]
                  rounded-tl-[5px]
                  rounded-tr-[20px]
                  rounded-bl-[5px]
                  rounded-br-[20px]
                  overflow-y-auto
                  overflow-x-hidden
                "
              >
                {statusFilters.map(
                  ({
                    id,
                    label,
                    icon,
                    statusKey,
                  }) => (
                    <li
                      key={id}
                      className={`filter-item text-[#fff] row ${
                        filter.status === statusKey
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        handleFilterChange(
                          "status",
                          statusKey,
                        );

                        if (isSidebarOpen) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <img
                        src={icon}
                        alt=""
                        className={`mr-3 object-contain ${
                          filter.status === statusKey
                            ? "opacity-70"
                            : "brightness-0 invert"
                        }`}
                      />

                      <span className="w-100 font-normal font-['Inter']">
                        {label}
                      </span>

                      <span
                        className={
                          statusSummary[statusKey] === 0
                            ? "disabled"
                            : ""
                        }
                      >
                        {statusSummary[statusKey]}
                      </span>
                    </li>
                  ),
                )}
              </div>
            </ul>
          </div>

          <div
            className="content justify-center"
            id="content"
          >
            <div
              className="items-wrapper column gap-14"
              id="items-wrapper"
            >
              {reloading && (
                <div className="row justify-center items-center py-3">
                  <div className="loading-spinner-small" />

                  <span className="ml-2 text-grey">
                    {t("portal_calc.ui.reloading")}
                  </span>
                </div>
              )}

              {error ? (
                <div className="error-empty-state column align-center jc-center">
                  <span className="icon icon-warning text-red font-size-48 mb-16" />

                  <h3 className="font-size-20 weight-600 mb-8">
                    {t("portal_calc.ui.error_title")}
                  </h3>

                  <p className="text-grey mb-24 text-center">
                    {error}
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-load-more-big"
                    onClick={reloadCalculations}
                    disabled={reloading}
                  >
                    <span className="icon icon-loop2 mr-10" />

                    {t("portal_calc.ui.try_again")}
                  </button>
                </div>
              ) : totalFilteredCount === 0 ? (
                <div className="no-data column align-center h-100">
                  <div className="font-size-24 text-grey">
                    {t(
                      "portal_calc.ui.no_calculations",
                    )}
                  </div>
                </div>
              ) : (
                paginatedItems.map((calc) =>
                  isMobile ? (
                    <CalculationItemMobile
                      key={calc.id}
                      calc={calc}
                      isExpanded={
                        expandedCalc === calc.id
                      }
                      onToggle={toggleCalc}
                      expandedOrderId={expandedOrder}
                      onOrderToggle={toggleOrder}
                      onDelete={
                        handleDeleteCalculation
                      }
                      onEdit={
                        handleUpdateCalculation
                      }
                      onMarkAsRead={handleMarkAsRead}
                      reloadCalculations={
                        reloadCalculations
                      }
                    />
                  ) : (
                    <CalculationItem
                      key={calc.id}
                      calc={calc}
                      isExpanded={
                        expandedCalc === calc.id
                      }
                      onToggle={toggleCalc}
                      expandedOrderId={expandedOrder}
                      onOrderToggle={toggleOrder}
                      onDelete={
                        handleDeleteCalculation
                      }
                      onEdit={
                        handleUpdateCalculation
                      }
                      onMarkAsRead={handleMarkAsRead}
                      reloadCalculations={
                        reloadCalculations
                      }
                    />
                  ),
                )
              )}

              {hasMore && (
                <div
                  className="row w-100"
                  style={{
                    marginTop: "20px",
                    marginBottom: "20px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary uppercase btn-load-more-big"
                    onClick={handleLoadMore}
                    style={{
                      padding: "12px 24px",
                      fontSize: "13px",
                      fontWeight: "400",
                      minWidth: "200px",
                      backgroundColor: "#5e83bf",
                      color: "#ffffff",
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

                    {buttonText}
                  </button>
                </div>
              )}

              {!hasMore &&
                totalFilteredCount >
                  ITEMS_PER_LOAD && (
                  <div
                    className="row justify-content-center text-grey"
                    style={{
                      marginTop: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    {t(
                      "portal_calc.ui.all_loaded",
                      {
                        count: totalFilteredCount,
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
        onClose={handleCloseCalc}
        onSave={handleSaveCalculation}
        initialCalculation={editingCalculation}
      />
    </div>
  );
};

export default PortalOriginal;
