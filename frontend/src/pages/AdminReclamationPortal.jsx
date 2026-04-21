import React, { useState, useEffect, useMemo, useCallback } from "react";

import axiosInstance from "../api/axios";
import useCancelAllRequests from "../hooks/useCancelAllRequests";

import { ReclamationItem } from "../components/Reclamations/ReclamationItem";
import { ReclamationItemMobile } from "../components/Reclamations/ReclamationItemMobile";

import AddClaimModal from "../components/Reclamations/AddClaimModal";

import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";

import useWindowWidth from "../hooks/useWindowWidth";
import { useTheme } from "../hooks/useTheme";
import "../components/Reclamations/ReclamationItem.css";

/* ================= CONSTANTS ================= */
const RECLAMATIONS_API_URL = "/complaints/get_reclamation_info/";
const RECLAMATIONS_API_ALL_URL = "/complaints/get_reclamation_info_all/";
const ITEMS_PER_LOAD = 100;
const ALL_DEALERS_VALUE = "__ALL__";

/* =========================================================
 * FORMAT API DATA
 * ========================================================= */
function formatApiData(data) {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const dateRaw =
      item.ComplaintDate || item.DateInWork || new Date().toISOString();
    const dateObj = new Date(dateRaw);
    const statusKey = item.StatusName || "Новий";

    return {
      id: item.ComplaintNumber,
      guid: item.ComplaintGuid,
      number: item.ClaimOrderNumber,
      actNumber: item.ComplaintNumber,

      numberWEB: item.NumberWEB,
      orderNumber: item.OrderNumber,
      organization: item.OrganizationName,

      dateRaw,
      date: !isNaN(dateObj) ? dateObj.toLocaleDateString("uk-UA") : "N/A",

      deliveryDate: item.DeliveryDateText || null,
      determinationDate: item.DeterminationDateText || null,
      readyDate: item.BorderReturnDate,
      producedDate: item.ProducedDate,
      soldDate: item.SoldDate,

      status: statusKey,
      problem: item.IssueName,
      resolution: item.SolutionName || null,
      description: item.ParsedDescription,

      series: item.SeriesList || null,
      manager: item.LastManagerName || "N/A",

      amount: parseFloat(
        item.DocumentAmount || item.DocumentSum || item.CompensationAmount || 0,
      ),
      dealer: item.Customer || "N/A",
      dealerId: item.CustomerLink || "N/A",

      file: !!item.AdditionalInformation,
      issueCount: 0,
      issues: [],

      statuses: { [statusKey]: 1 },
      message: item.ParsedDescription,
    };
  });
}

/* =========================================================
 * MAIN COMPONENT
 * ========================================================= */
const AdminReclamationPortal = () => {
  const { register, cancelAll } = useCancelAllRequests();

  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();

  const [reclamationsData, setReclamationsData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [filter, setFilter] = useState({
    status: "Всі",
    month: 0,
    name: "",
  });

  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  const [loading, setLoading] = useState(true);
  const [expandedReclamation, setExpandedReclamation] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_LOAD);
  const [isNewReclamationModalOpen, setIsNewReclamationModalOpen] =
    useState(false);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1260;
  const isMobilePagination = windowWidth < 1150;

  
  // const location = useLocation();
  const yearIcon = "/assets/icons/YearIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";


  const allCalcIcon = "/assets/icons/AllCalcIcon.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const inProcessingIcon = "/assets/icons/InProcessingIcon.png";
  const waitingForPaymentIcon = "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon = "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";
  const deleteIcon = "/assets/icons/DeleteIcon.png";
  const checkMarkIcon = "/assets/icons/CheckMarkIcon.png";

  const searchIcon = "/assets/icons/SearchIcon.png";

  const { theme } = useTheme();

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const availableYears = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = currentYear; y >= startYear; y--) {
      years.push(String(y));
    }
    return years;
  }, [currentYear]);

  /* =====================================================
   * CLIENT-SIDE FILTERING
   * ===================================================== */
  const getFilteredItems = useCallback(
    (status, month, name, data = reclamationsData) => {
      let result = [...data];

      if (status !== "Всі") {
        result = result.filter((r) => r.status === status);
      }

      if (month !== 0) {
        result = result.filter(
          (r) => new Date(r.dateRaw).getMonth() + 1 === month,
        );
      }

      if (name) {
        const q = name.toLowerCase();
        result = result.filter(
          (r) =>
            (r.number || "").toLowerCase().includes(q) ||
            (r.manager || "").toLowerCase().includes(q),
        );
      }

      return result;
    },
    [reclamationsData],
  );

  /* =====================================================
   * AUTO MONTH FOR ALL DEALERS
   * ===================================================== */
  useEffect(() => {
    if (isAdmin && dealerGuid === ALL_DEALERS_VALUE && filter.month === 0) {
      setFilter((prev) => ({ ...prev, month: currentMonth }));
    }
  }, [dealerGuid, isAdmin, currentMonth, filter.month]);

  const shouldRefetchOnMonthChange = useMemo(
    () => isAdmin && dealerGuid === ALL_DEALERS_VALUE,
    [isAdmin, dealerGuid],
  );

  /* =====================================================
   * FETCH DATA
   * ===================================================== */
  useEffect(() => {
    cancelAll();

    if (isAdmin && !dealerGuid) {
      setReclamationsData([]);
      setFilteredItems([]);
      setLoading(false);
      return;
    }

    if (!dealerGuid) return;

    const controller = register();

    const loadData = async () => {
      setLoading(true);

      try {
        let endpoint = RECLAMATIONS_API_URL;
        const params = { year: selectedYear };

        if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
          endpoint = RECLAMATIONS_API_ALL_URL;
          params.month = filter.month || currentMonth;
        } else {
          params.contractor = dealerGuid;
        }

        const res = await axiosInstance.get(endpoint, {
          params,
          signal: controller.signal,
        });

        const raw = formatApiData(res.data?.data || []);
        setReclamationsData(raw);
        setFilteredItems(
          getFilteredItems(filter.status, filter.month, filter.name, raw),
        );
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
          setReclamationsData([]);
          setFilteredItems([]);
        }
      } finally {
        setLoading(false);
        setVisibleItemsCount(ITEMS_PER_LOAD);
      }
    };

    loadData();
  }, [
    selectedYear,
    dealerGuid,
    isAdmin,
    shouldRefetchOnMonthChange ? filter.month : null,
  ]);

  /* =====================================================
   * SUMMARIES
   * ===================================================== */
  const statusSummary = useMemo(() => {
    const s = {
      Всі: 0,
      Новий: 0,
      "В роботі": 0,
      Виробництво: 0,
      "На складі": 0,
      Відвантажено: 0,
      Вирішено: 0,
      Відмова: 0,
    };

    reclamationsData.forEach((r) => {
      s["Всі"]++;
      if (s[r.status] !== undefined) s[r.status]++;
    });

    return s;
  }, [reclamationsData]);

  const monthSummary = useMemo(() => {
    const m = {};
    for (let i = 1; i <= 12; i++) m[i] = 0;

    reclamationsData.forEach((r) => {
      const d = new Date(r.dateRaw);
      if (!isNaN(d)) m[d.getMonth() + 1]++;
    });

    return m;
  }, [reclamationsData]);

  /* =====================================================
   * HANDLERS
   * ===================================================== */
  const handleStatusClick = (status) => {
    setFilter((prev) => ({ ...prev, status }));
    setFilteredItems(getFilteredItems(status, filter.month, filter.name));
    setVisibleItemsCount(ITEMS_PER_LOAD);
    if (isMobile) setIsSidebarOpen(false); // Закриваємо на мобілці після вибору
  };

  const handleMonthClick = (month) => {
    if (dealerGuid === ALL_DEALERS_VALUE && month === 0) return;

    const newMonth =
      filter.month === month
        ? dealerGuid === ALL_DEALERS_VALUE
          ? month
          : 0
        : month;

    setFilter((prev) => ({ ...prev, month: newMonth }));

    if (dealerGuid !== ALL_DEALERS_VALUE) {
      setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
    }

    setVisibleItemsCount(ITEMS_PER_LOAD);
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter((prev) => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name));
    setVisibleItemsCount(ITEMS_PER_LOAD);
  };

  const handleClearSearch = () => {
    setFilter((prev) => ({ ...prev, name: "" }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, ""));
    setVisibleItemsCount(ITEMS_PER_LOAD);
  };

  /* =====================================================
   * SORT + PAGINATION
   * ===================================================== */
  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) => new Date(b.dateRaw) - new Date(a.dateRaw),
      ),
    [filteredItems],
  );

  const itemsToShow = sortedItems.slice(0, visibleItemsCount);
  const showLoadMoreButton = sortedItems.length > visibleItemsCount;

  /* =====================================================
   * UI
   * ===================================================== */
  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Завантаження рекламацій...</div>
      </div>
    );
  }

  return (
    <div className={`column portal-body ${theme}`}>
      {/* ================= HEADER + MONTHS ================= */}
      <div className="content-summary row w-100" style={{justifyContent:'center'}}>
        
{/* 
        <div className="year-selector row">
          <span>Рік:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div> */}

        <div className="by-month-pagination-wrapper row  flex items-center gap-4">

          <div
          className="mobile-sidebar-toggle flex items-center justify-center"
          onClick={() => setIsSidebarOpen(true)}
        >
          <span className="icon icon-menu font-size-24"></span>
        </div>

        <div className="flex-0 items-center no-wrap mr-4" style={{ display: 'flex', flexShrink: 0 }}>
        <img 
            src={yearIcon} 
            alt="Календар" 
            className="align-center mr-2 w-[26px] h-[25px]" 
        />
        <div className="w-32 flex items-center justify-center text-center text-white text-lg font-normal font-['Inter'] uppercase mr-2">
            Звітний рік
        </div>
        <select
            className="year-select-minimal"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
        >
            {/* Динамічна генерація: поточний рік + 2 попередні */}
            {Array.from({ length: 3 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                    <option key={year} value={year.toString()}>
                        {year}
                    </option>
                );
            })}
        </select>
    </div>

        
          {/* ===== DESKTOP: кнопки ===== */}
          {!isMobilePagination && (
            <ul className=" flex-1  gap-6 row no-wrap month-list">
              {dealerGuid !== ALL_DEALERS_VALUE && (
                <li
                  className={`pagination-item ${filter.month === 0 ? "active" : ""}`}
                  onClick={() => handleMonthClick(0)}
                >
                  Весь рік
                </li>
              )}

              {Array.from({ length: 12 }, (_, i) => {
                const num = i + 1;
                const labels = [
                  "Січ.",
                  "Лют.",
                  "Бер.",
                  "Квіт.",
                  "Трав.",
                  "Черв.",
                  "Лип.",
                  "Сер.",
                  "Вер.",
                  "Жов.",
                  "Лис.",
                  "Груд.",
                ];

                const disabled =
                  dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

                return (
                  <li
                    key={num}
                    className={`pagination-item 
                                            ${filter.month === num ? "active" : ""} 
                                            ${disabled ? "disabled" : ""}`}
                    onClick={() => !disabled && handleMonthClick(num)}
                  >
                    {labels[i]}
                    {dealerGuid !== ALL_DEALERS_VALUE && (
                      <span className="text-grey"> ({monthSummary[num]})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* ===== MOBILE: select ===== */}
          {isMobilePagination && (
            <select
              className="month-select flex-1 "
              value={filter.month}
              onChange={(e) => handleMonthClick(Number(e.target.value))}
            >
              <option value={0}>Весь рік</option>

              {Array.from({ length: 12 }, (_, i) => {
                const num = i + 1;
                const labels = [
                  "Січень",
                  "Лютий",
                  "Березень",
                  "Квітень",
                  "Травень",
                  "Червень",
                  "Липень",
                  "Серпень",
                  "Вересень",
                  "Жовтень",
                  "Листопад",
                  "Грудень",
                ];

                return (
                  <option
                    key={num}
                    value={num}
                    disabled={
                      dealerGuid !== ALL_DEALERS_VALUE &&
                      monthSummary[num] === 0
                    }
                  >
                    {labels[i]}
                    {dealerGuid !== ALL_DEALERS_VALUE
                      ? ` (${monthSummary[num]})`
                      : ""}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="content-wrapper row w-100 h-100">
        <div className="row  h-100 max-w-[1334px]  w-100">

        {/* OVERLAY (Background for mobile sidebar) */}
        {isMobile && isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <div
          className={`content-filter column ${isSidebarOpen ? "open" : "closed"}`}
        >
          {/* КНОПКА ЗАКРИТТЯ САЙДБАРУ (Тільки для мобілки) */}
          {isMobile && (
            <div className="sidebar-close-row row align-end justify-end w-100">
              <span
                className="icon icon-cancel2 font-size-24 cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          )}

          <div className="search-wrapper mb-2">
            <input
              type="text"
              className="search-orders w-full pl-10 pr-4 py-2 border rounded-md" 
              placeholder="номер рекламації"
              value={filter.name}
              onChange={handleSearchChange}
            />
            {/* {!!filter.name && (
              <span
                className="icon icon-cancel2 clear-search"
                onClick={handleClearSearch}
              />
            )} */}
            <img 
                      src={searchIcon} 
                      alt="" 
                      className="absolute left-3 top-1/2 -translate-y-1/2  opacity-50"
                  />
          </div>

          {isAdmin && (
            <>
              {/* <div className="delimiter1" /> */}
              {/* Якщо DealerSelectWithAll теж має закривати сайдбар, 
                                можна передати обгортку в onChange */}
              <DealerSelectWithAll
                value={dealerGuid}
                onChange={(val) => {
                  setDealerGuid(val);
                  if (isMobile) setIsSidebarOpen(false);
                }}
              />
            </>
          )}

          {isAdmin && (
            <>
              {/* <div className="delimiter1" /> */}

              <ul className="buttons">
                <li
                  className=" btn-add-calc"
                  onClick={() => {
                    setIsNewReclamationModalOpen(true);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                >
                  <img 
                      src={plusIcon} 
                      alt="+" 
                      className="align-center mr-2 " 
                      /* inline-style тут вже не потрібні, якщо є класи зверху */
                      />
                  <div className="text-center text-WS---DarkGrey text-[18px] font-bold font-['Inter'] uppercase">Нова рекламація</div>
        
                </li>
              </ul>
            </>
          )}

          {/* ===== FILTERS WITH ICONS ===== */}
          <ul className="filter column align-center">
             <div className="w-72 bg-white rounded-tl-[5px] rounded-tr-[20px] rounded-bl-[5px] rounded-br-[20px] shadow-sm overflow-hidden py-[26px]">            {/* <li className="delimiter1"></li> */}

            {[
              {
                label: "Всі рекламації",
                statusKey: "Всі",
                icon: allCalcIcon,
              },
              { label: "Нові", statusKey: "Новий", icon: newCalcIcon },
              {
                label: "В роботі",
                statusKey: "В роботі",
                icon: inProcessingIcon,
              },
              {
                label: "Виробництво",
                statusKey: "Виробництво",
                icon: factoryIcon,
              },
              {
                label: "На складі",
                statusKey: "На складі",
                icon: finishedIcon,
              },
              {
                label: "Відвантажено",
                statusKey: "Відвантажено",
                icon: deliveredIcon,
              },
              { label: "Вирішено", statusKey: "Вирішено", icon:checkMarkIcon },
              {
                label: "Відмова",
                statusKey: "Відмова",
                icon: canceledCalcIcon,
              },
            ].map(({ label, statusKey, icon }) => (
              <li
                key={statusKey}
                className={`filter-item ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleStatusClick(statusKey)}
              >
                 <img 
                                    src={icon}
                                    alt="" 
                                    className={`mr-3 object-contain transition-all duration-300
                                        ${filter.status === statusKey 
                                        ? "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" 
                                        : "opacity-70 group-hover:opacity-100 group-hover:brightness-0"
                                        }`} 
                                    />
                <span className="w-100">{label}</span>
                <span
                  className={statusSummary[statusKey] === 0 ? "disabled" : ""}
                >
                  {statusSummary[statusKey]}
                </span>
              </li>
            ))}

            </div>
          </ul>
        </div>

        {/* LIST */}
        <div className="content">
          <div className="items-wrapper column gap-1">
            {itemsToShow.length === 0 ? (
              <div className="no-data column align-center">
                Немає рекламацій
              </div>
            ) : (
              itemsToShow.map((r) =>
                isMobilePagination ? (
                  <ReclamationItemMobile
                    key={r.id}
                    reclamation={r}
                    isExpanded={expandedReclamation === r.id}
                    onToggle={() =>
                      setExpandedReclamation(
                        expandedReclamation === r.id ? null : r.id,
                      )
                    }
                    expandedIssueId={expandedIssue}
                    onIssueToggle={setExpandedIssue}
                  />
                ) : (
                  <ReclamationItem
                    key={r.id}
                    reclamation={r}
                    isExpanded={expandedReclamation === r.id}
                    onToggle={() =>
                      setExpandedReclamation(
                        expandedReclamation === r.id ? null : r.id,
                      )
                    }
                    expandedIssueId={expandedIssue}
                    onIssueToggle={setExpandedIssue}
                  />
                ),
              )
            )}

            {showLoadMoreButton && (
              <button
                className="btn btn-primary uppercase btn-load-more-big"
                onClick={() => setVisibleItemsCount((v) => v + ITEMS_PER_LOAD)}
              >
                Завантажити ще
              </button>
            )}
          </div>
        </div>
      </div>

      <AddClaimModal
        isOpen={isNewReclamationModalOpen}
        onClose={() => setIsNewReclamationModalOpen(false)}
        onSave={() => setIsNewReclamationModalOpen(false)}
      />
      </div>
    </div>
  );
};

export default AdminReclamationPortal;
